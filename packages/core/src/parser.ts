import { ParsingError } from "./errors"
import { normalizeOptionRecord } from "./schema"
import type { CLIConfig, OptionRecord, OptionSchema, ParsedArgv } from "./types"

/** Result of a relaxed argv parse used to discover command path. */
export interface ParseResult extends ParsedArgv {}

// (removed unused Tokenized interface)

/**
 * Perform a relaxed parse of argv.
 *
 * This pass is permissive: unknown options are ignored. The goal is to
 * discover the command path (which tokens are commands vs options) so we can
 * perform a strict parse for the resolved command later.
 */
export function parseArgv(argv: string[], cfg: CLIConfig): ParseResult {
  // Copy argv (caller already stripped executable if needed)
  const args = [...argv]
  const positionals: string[] = []
  const options: Record<string, unknown> = {}

  // Collect global option schema (root-level). Relaxed parsing: unknown options ignored here.
  const globalOptions: OptionRecord = cfg.options ?? {}
  const normalizedGlobal = normalizeOptionRecord(globalOptions)

  let i = 0
  while (i < args.length) {
    const raw = args[i]
    if (raw === "--") {
      // End of options marker -- remaining tokens are positionals
      positionals.push(...args.slice(i + 1))
      break
    }
    if (raw.startsWith("--")) {
      const eqIdx = raw.indexOf("=")
      let name = raw.slice(2)
      let value: string | boolean | undefined
      if (eqIdx !== -1) {
        name = raw.slice(2, eqIdx)
        value = raw.slice(eqIdx + 1)
      }
      // Negated boolean flag form: --no-name
      let isNegated = false
      if (name.startsWith("no-")) {
        isNegated = true
        name = name.slice(3)
      }
      handleLongOption(name, value, isNegated, options, normalizedGlobal, true)
      i++
      continue
    }
    if (raw.startsWith("-") && raw !== "-") {
      // Short flag cluster: -abc
      const cluster = raw.slice(1)
      for (let ci = 0; ci < cluster.length; ci++) {
        const ch = cluster[ci]
        handleShortOption(ch, options, normalizedGlobal, true)
      }
      i++
      continue
    }
    positionals.push(raw)
    i++
  }

  return {
    argvRaw: argv,
    positionals,
    options
  }
}

/**
 * Parse only options from tokens after command path is determined.
 * Assumption: all options appear contiguously after the command path.
 */
/**
 * Strictly parse option tokens for a resolved command.
 *
 * This pass rejects unknown options and duplicates. It returns a map of
 * option name -> coerced value.
 */
export function parseOptions(
  tokens: string[],
  optionSchema: OptionRecord
): Record<string, unknown> {
  const options: Record<string, unknown> = {}
  const normalized = normalizeOptionRecord(optionSchema)
  let i = 0
  while (i < tokens.length) {
    const raw = tokens[i]
    if (raw === "--") {
      break // end of options
    }
    if (raw.startsWith("--")) {
      const eqIdx = raw.indexOf("=")
      let name = raw.slice(2)
      let value: string | boolean | undefined
      if (eqIdx !== -1) {
        name = raw.slice(2, eqIdx)
        value = raw.slice(eqIdx + 1)
      }
      let isNegated = false
      if (name.startsWith("no-")) {
        isNegated = true
        name = name.slice(3)
      }
      handleLongOption(name, value, isNegated, options, normalized)
      i++
      continue
    }
    if (raw.startsWith("-") && raw !== "-") {
      const cluster = raw.slice(1)
      for (let ci = 0; ci < cluster.length; ci++) {
        const ch = cluster[ci]
        handleShortOption(ch, options, normalized)
      }
      i++
      continue
    }
    // Non-option token: stop (remaining tokens are positional arguments)
    break
  }
  return options
}

/**
 * Handle a long form option token (e.g. `--name` or `--name=value`).
 *
 * @param name - option name without leading `--`
 * @param inlineValue - optional inline value from `--name=value`
 * @param isNegated - true when the token was `--no-name`
 * @param out - accumulator map of parsed option values
 * @param schema - normalized option schema to consult
 * @param allowUnknown - when true, unknown options are ignored (relaxed parse)
 */
function handleLongOption(
  name: string,
  inlineValue: string | boolean | undefined,
  isNegated: boolean,
  out: Record<string, unknown>,
  schema: OptionRecord,
  allowUnknown = false
) {
  const opt = schema[name]
  if (!opt) {
    if (allowUnknown) return
    throw new ParsingError(`Unknown option: --${name}`)
  }
  const value = deriveValue(opt, inlineValue, isNegated)
  if (name in out) {
    throw new ParsingError(`Duplicate option: --${name}`)
  }
  out[name] = value
}

/**
 * Handle a short alias token (single character) possibly appearing in a
 * cluster (e.g. `-abc`). Maps the alias to the option name using the
 * provided schema.
 */
function handleShortOption(
  ch: string,
  out: Record<string, unknown>,
  schema: OptionRecord,
  allowUnknown = false
) {
  const name = Object.keys(schema).find((k) => {
    const a = schema[k].alias as string[] | undefined
    return a?.includes(ch)
  })
  if (!name) {
    if (allowUnknown) return
    throw new ParsingError(`Unknown short alias: -${ch}`)
  }
  const opt = schema[name]
  const value = deriveValue(opt, undefined, false)
  if (name in out) {
    throw new ParsingError(`Duplicate option (alias): -${ch}`)
  }
  out[name] = value
}

/**
 * Coerce a raw token value to the appropriate runtime type for the option
 * according to its schema. Throws `ParsingError` on malformed values.
 */
function deriveValue(
  opt: OptionSchema,
  inlineValue: string | boolean | undefined,
  negated: boolean
) {
  switch (opt.kind) {
    case "flag":
      return negated
        ? false
        : inlineValue === undefined
          ? true
          : inlineValue !== "false"
    case "string":
      if (inlineValue === undefined) return opt.default ?? ""
      return String(inlineValue)
    case "number": {
      if (inlineValue === undefined) {
        if (opt.default === undefined)
          throw new ParsingError(
            `Option --${opt.alias ?? ""} requires a number value`
          )
        return opt.default
      }
      const n = Number(inlineValue)
      if (Number.isNaN(n))
        throw new ParsingError(`Value is not a number: ${inlineValue}`)
      return n
    }
    case "enum": {
      if (inlineValue === undefined) {
        if (opt.default === undefined)
          throw new ParsingError(
            `Enum option requires a value: ${opt.choices.join(",")}`
          )
        return opt.default
      }
      const val = String(inlineValue)
      const choices = opt.caseSensitive
        ? opt.choices
        : opt.choices.map((c) => c.toLowerCase())
      const needle = opt.caseSensitive ? val : val.toLowerCase()
      if (!choices.includes(needle)) {
        throw new ParsingError(`Value not in enum choices: ${val}`)
      }
      return inlineValue
    }
  }
}
