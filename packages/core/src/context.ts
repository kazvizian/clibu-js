import { CommandNotFoundError } from "./errors"
import { buildGraph, resolveCommand } from "./graph"
import { parseArgv, parseOptions } from "./parser"
import type {
  CLIConfig,
  CLIContext,
  OptionRecord,
  ParsedArgv,
  ResolvedCommand
} from "./types"
import { createLogger } from "./types"
import { validateOptionValues } from "./validate"

/**
 * Result returned by `buildContext`. Includes the relaxed parse result under
 * the `parsed` field for debugging and tooling consumption.
 */
export interface BuildContextResult extends CLIContext {
  parsed: ParsedArgv
}

/**
 * Build execution context for the provided argv and CLI configuration.
 *
 * Responsibilities:
 * - Resolve the command path from argv
 * - Parse options in two phases (relaxed root scan + strict per-command parse)
 * - Separate `globalOptions` and `commandOptions`
 * - Validate parsed values against their schemas
 *
 * The function returns a `CLIContext` suitable for passing to command
 * handlers.
 */
export function buildContext(
  cfg: CLIConfig,
  argv: string[]
): BuildContextResult {
  // Store initial relaxed parse (useful for debugging); ignore its positionals because options were filtered.
  const parsedInitial = parseArgv(argv, cfg)
  const graph = buildGraph(cfg)
  if (!argv.length) throw new CommandNotFoundError(["<empty>"])
  // Determine the command path from the start of argv until a token is not a valid command name.
  const pathParts: string[] = []
  for (const token of argv) {
    if (token.startsWith("-")) break // option indicates end of command path
    try {
      resolveCommand(graph, [...pathParts, token])
      pathParts.push(token)
    } catch {
      break
    }
  }
  const resolved: ResolvedCommand = resolveCommand(graph, pathParts)
  const commandDef = resolved.target
  const tailTokens = argv.slice(pathParts.length)

  // Global options schema
  const globalSchema: OptionRecord = cfg.options ?? {}
  const inherit = commandDef.inheritGlobal !== false
  // Command option schema
  const commandSchema: OptionRecord = commandDef.options ?? {}
  // Parse command/inherited options strictly using merged schema
  const mergedSchema: OptionRecord = inherit
    ? { ...globalSchema, ...commandSchema }
    : { ...commandSchema }
  const parsedMerged = parseOptions(tailTokens, mergedSchema)

  // Global options parsed before command path (relaxed) are in parsedInitial.options
  const preGlobal = inherit ? parsedInitial.options : {}

  // Handle duplicates: if a global option also appears in strict segment, prefer strict value and drop relaxed one.
  for (const k of Object.keys(preGlobal)) {
    if (k in parsedMerged) {
      delete preGlobal[k]
    }
  }

  // Separate global vs command option values from parsedMerged
  const globalOptionValues: Record<string, unknown> = {}
  const commandOptionValues: Record<string, unknown> = {}
  if (inherit) {
    for (const k of Object.keys(globalSchema)) {
      if (k in preGlobal) globalOptionValues[k] = preGlobal[k]
      else if (k in parsedMerged) globalOptionValues[k] = parsedMerged[k]
    }
  }
  for (const k of Object.keys(commandSchema)) {
    if (k in parsedMerged) commandOptionValues[k] = parsedMerged[k]
  }

  // Final merged options (command overrides global by construction)
  const finalOptions: Record<string, unknown> = {
    ...globalOptionValues,
    ...commandOptionValues
  }

  // Validation
  if (inherit && Object.keys(globalSchema).length) {
    validateOptionValues(globalSchema, globalOptionValues)
  }
  if (Object.keys(commandSchema).length) {
    validateOptionValues(commandSchema, commandOptionValues)
  }

  const consumedOptionTokens = Object.keys(parsedMerged).length
    ? countOptionTokens(tailTokens)
    : 0
  const argPositionals = tailTokens.slice(consumedOptionTokens)

  const ctx: CLIContext = {
    argvRaw: argv,
    command: resolved,
    args: argPositionals,
    options: finalOptions,
    globalOptions: inherit ? globalOptionValues : {},
    commandOptions: commandOptionValues,
    env: process.env,
    logger: createLogger()
  }
  return { ...ctx, parsed: parsedInitial }
}

/**
 * Count how many leading tokens in the given token list are option tokens.
 *
 * This helper is used to separate option tokens from positional arguments
 * after strict option parsing has been performed.
 */
function countOptionTokens(tokens: string[]): number {
  // Count how many leading tokens are options.
  let i = 0
  while (i < tokens.length) {
    const raw = tokens[i]
    if (raw === "--") {
      i++
      break
    }
    if (raw.startsWith("--")) {
      i++
      continue
    }
    if (raw.startsWith("-") && raw !== "-") {
      i++
      continue
    }
    break
  }
  return i
}
