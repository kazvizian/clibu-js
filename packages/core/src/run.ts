import { buildContext } from "./context"
import { ClibuError, OptionConflictError } from "./errors"
// import { buildGraph, resolveCommand } from "./graph"
import { normalizeOptionRecord } from "./schema"
import type { CLIConfig } from "./types"

/** Represents a created CLI instance exposing runtime helpers. */
export interface CLIInstance {
  /** Execute the CLI with optional argv (defaults to process.argv.slice(2)). */
  run: (argv?: string[]) => Promise<number>
  /** Return a help string. Rendering is delegated to `@clibu/help` in the facade. */
  help: () => string
  /** The CLI configuration used to build this instance. */
  config: CLIConfig
}

/**
 * Create a CLI instance from a validated `CLIConfig`.
 *
 * The function performs early validation of option conflicts (alias/kind)
 * and returns a `run` function that builds an execution context and invokes
 * the target command's `run` handler.
 */
export function createCLI(config: CLIConfig): CLIInstance {
  // Perform option conflict checks between global and command options.
  if (config.options) {
    const globalNorm = normalizeOptionRecord(config.options)
    const globalAliases = new Map<string, string>()
    for (const [name, def] of Object.entries(globalNorm)) {
      const aliasList = Array.isArray(def.alias)
        ? def.alias
        : def.alias
          ? [def.alias]
          : []
      const aliases = aliasList
      for (const a of aliases) globalAliases.set(a, name)
    }
    for (const [cmdName, cmdDef] of Object.entries(config.commands)) {
      if (cmdDef.inheritGlobal === false) continue
      if (!cmdDef.options) continue
      const cmdNorm = normalizeOptionRecord(cmdDef.options)
      for (const [name, def] of Object.entries(cmdNorm)) {
        if (name in globalNorm && globalNorm[name].kind !== def.kind) {
          throw new OptionConflictError(
            name,
            `kind mismatch in command '${cmdName}'`
          )
        }
        const aliasList = Array.isArray(def.alias)
          ? def.alias
          : def.alias
            ? [def.alias]
            : []
        const aliases = aliasList
        for (const a of aliases) {
          const existing = globalAliases.get(a)
          if (existing && existing !== name) {
            throw new OptionConflictError(
              name,
              `alias '-${a}' collides with global option '${existing}'`
            )
          }
        }
      }
    }
  }
  async function run(argv: string[] = process.argv.slice(2)): Promise<number> {
    if (argv.includes("--version") || argv.includes("-V")) {
      console.log(`${config.name} ${config.version ?? "(no version)"}`)
      return 0
    }
    try {
      const ctx = buildContext(config, argv)
      const cmd = ctx.command.target
      if (typeof cmd.run === "function") {
        const out = await cmd.run(ctx)
        if (out !== undefined) {
          // Minimal output; extensible in later phases
          console.log(out)
        }
        return 0
      } else {
        console.error("Command has no run() handler.")
        return 1
      }
    } catch (e: unknown) {
      if (e instanceof ClibuError) {
        console.error(`[${e.code}] ${e.message}`)
        return 1
      }
      console.error(e)
      return 1
    }
  }

  return {
    run,
    help: () => "(Use @clibu/help to render help)",
    config
  }
}
