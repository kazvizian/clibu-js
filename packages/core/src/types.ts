/**
 * Core types for Clibu command and option definitions.
 *
 * This file defines the public shape of configuration objects consumed by the
 * rest of the `@clibu/core` package. Types are intentionally explicit to
 * provide good editor feedback for CLI authors.
 */

/** Primitive option kinds supported by the DSL. */
export type OptionKind = "flag" | "string" | "number" | "enum"

/**
 * Base option schema shared by all option kinds.
 *
 * - `kind` discriminates the concrete option shape.
 * - `alias` may be a single letter or an array of letters used as short aliases.
 */
export interface BaseOptionSchema<K extends OptionKind = OptionKind> {
  kind: K
  description?: string
  required?: boolean
  alias?: string | string[]
}

/** Schema for boolean flags. */
export interface FlagOptionSchema extends BaseOptionSchema<"flag"> {
  /** Default boolean value when the flag is not provided. */
  default?: boolean
  /** Whether `--no-<name>` negation is supported (default: true). */
  negate?: boolean
}

/** Schema for string options. */
export interface StringOptionSchema extends BaseOptionSchema<"string"> {
  default?: string
  minLength?: number
  maxLength?: number
  pattern?: RegExp
}

/** Schema for numeric options. */
export interface NumberOptionSchema extends BaseOptionSchema<"number"> {
  default?: number
  min?: number
  max?: number
  integer?: boolean
}

/** Schema for enumeration options (string values from a closed set). */
export interface EnumOptionSchema extends BaseOptionSchema<"enum"> {
  default?: string
  /** List of allowed string choices. */
  choices: readonly string[]
  /** Whether comparisons are case-sensitive (default: false). */
  caseSensitive?: boolean
  /** Enable suggestion for near-miss values (future improvement). */
  suggest?: boolean
}

export type OptionSchema =
  | FlagOptionSchema
  | StringOptionSchema
  | NumberOptionSchema
  | EnumOptionSchema

/** Map of option name -> option schema. */
export type OptionRecord = Record<string, OptionSchema>

// Inferensi tipe value dari schema
export type InferOptionValue<S extends OptionSchema> =
  S extends FlagOptionSchema
    ? boolean
    : S extends StringOptionSchema
      ? string
      : S extends NumberOptionSchema
        ? number
        : S extends EnumOptionSchema
          ? S["choices"][number]
          : unknown

/** Utility type to derive the runtime shape of parsed options from a schema. */
export type InferOptions<R extends OptionRecord> = {
  [K in keyof R]: InferOptionValue<R[K]>
}

/** Definition for a command node in the command graph. */
export interface CommandDef {
  description?: string
  options?: OptionRecord
  commands?: Record<string, CommandDef>
  run?: (ctx: CLIContext) => unknown | Promise<unknown>
  /** When `false`, this command will not inherit root-level global options. */
  inheritGlobal?: boolean
}

/** Top-level CLI configuration object consumed by `createCLI`. */
export interface CLIConfig {
  name: string
  version?: string
  /** Root-level global options available to all commands. */
  options?: OptionRecord
  commands: Record<string, CommandDef>
}

/** Result of a relaxed argv parse (early scan). */
export interface ParsedArgv {
  argvRaw: string[]
  positionals: string[]
  options: Record<string, unknown>
}

export interface CommandPathNode {
  name: string
  def: CommandDef
  depth: number
}

export interface ResolvedCommand {
  path: CommandPathNode[]
  target: CommandDef
}

/** Execution context passed to command `run(ctx)` handlers. */
export interface CLIContext {
  argvRaw: string[]
  command: ResolvedCommand
  args: string[]
  /** Final merged options (command overrides global). */
  options: Record<string, unknown>
  /** Values originating from global options (after parsing). */
  globalOptions?: Record<string, unknown>
  /** Values parsed from command-specific options (excluding inherited globals). */
  commandOptions?: Record<string, unknown>
  env: NodeJS.ProcessEnv
  logger: Logger
}

export interface Logger {
  info: (...msg: unknown[]) => void
  warn: (...msg: unknown[]) => void
  error: (...msg: unknown[]) => void
  debug: (...msg: unknown[]) => void
}

export const createLogger = (): Logger => ({
  info: (...m: unknown[]) => console.log("[clibu:info]", ...m),
  warn: (...m: unknown[]) => console.warn("[clibu:warn]", ...m),
  error: (...m: unknown[]) => console.error("[clibu:error]", ...m),
  debug: (...m: unknown[]) => console.debug("[clibu:debug]", ...m)
})
