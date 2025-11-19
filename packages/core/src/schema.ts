import type {
  CLIConfig,
  EnumOptionSchema,
  FlagOptionSchema,
  NumberOptionSchema,
  OptionRecord,
  StringOptionSchema
} from "./types"

/**
 * Create a boolean flag option schema.
 *
 * Example: `verbose: flag({ alias: 'v' })`
 */
export const flag = (
  cfg: Partial<FlagOptionSchema> = {}
): FlagOptionSchema => ({
  kind: "flag",
  description: cfg.description,
  required: cfg.required,
  default: cfg.default ?? false,
  alias: cfg.alias,
  negate: cfg.negate ?? true
})

/** Create a string option schema. */
export const string = (
  cfg: Partial<StringOptionSchema> = {}
): StringOptionSchema => ({
  kind: "string",
  description: cfg.description,
  required: cfg.required,
  default: cfg.default,
  alias: cfg.alias,
  minLength: cfg.minLength,
  maxLength: cfg.maxLength,
  pattern: cfg.pattern
})

/** Create a numeric option schema. */
export const number = (
  cfg: Partial<NumberOptionSchema> = {}
): NumberOptionSchema => ({
  kind: "number",
  description: cfg.description,
  required: cfg.required,
  default: cfg.default,
  alias: cfg.alias,
  min: cfg.min,
  max: cfg.max,
  integer: cfg.integer ?? false
})

/** Create an enum option schema. `choices` is required. */
export const enumOption = (
  cfg: Partial<EnumOptionSchema> & { choices: readonly string[] }
): EnumOptionSchema => ({
  kind: "enum",
  description: cfg.description,
  required: cfg.required,
  default: cfg.default,
  alias: cfg.alias,
  choices: cfg.choices,
  caseSensitive: cfg.caseSensitive ?? false,
  suggest: cfg.suggest ?? false
})

/**
 * Normalize an OptionRecord so each `alias` is represented as an array when
 * present. This simplifies downstream consumers that iterate alias lists.
 */
export function normalizeOptionRecord(rec: OptionRecord): OptionRecord {
  const out: OptionRecord = {}
  for (const [k, v] of Object.entries(rec)) {
    const alias = v.alias
    out[k] = {
      ...v,
      alias: Array.isArray(alias) ? alias : alias ? [alias] : undefined
    }
  }
  return out
}

/**
 * Define a `CLIConfig` with full type-safety in authoring time.
 *
 * Wrap your exported configuration with this helper to get rich IntelliSense
 * and immediate type errors in your editor:
 *
 * ```ts
 * import { defineConfig } from "clibu"
 * export default defineConfig({
 *   name: "mycli",
 *   commands: {}
 * })
 * ```
 *
 * Notes:
 * - This
function is
a
no - op
at
runtime
it
returns
the
object
unchanged.
 * - Alternatively, on
TS
4.9 + you
can
use
the`satisfies`
operator:
*   `
export default { ... } satisfies CLIConfig
`
 */
export function defineConfig<T extends CLIConfig>(cfg: T): T {
  return cfg
}
