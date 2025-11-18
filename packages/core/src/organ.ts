/**
 * Organ / Plugin interface stub (future phase).
 */
import type { CLIConfig, CLIContext } from "./types"

/**
 * Plugin (organ) contract used to observe or augment CLI behavior.
 *
 * Methods are optional and executed by the `OrganManager` at well-defined
 * lifecycle points. Implementers should keep hooks fast and idempotent.
 */
export interface ClibuOrgan {
  /** Human-readable plugin name. */
  name: string
  /** Optional version string for diagnostics. */
  version?: string
  /** Called when the CLI configuration is registered/loaded. */
  onRegister?(config: CLIConfig): void
  /** Called during argv parsing (relaxed first pass). */
  onParse?(argv: string[]): void
  /** Called before the command `run()` handler executes. */
  onBeforeRun?(ctx: CLIContext): void | Promise<void>
  /** Called after the command `run()` handler completes. */
  onAfterRun?(ctx: CLIContext, result: unknown): void | Promise<void>
  /** Optionally return an augmented config (used by advanced organs). */
  extendConfig?(config: CLIConfig): CLIConfig
}

export interface OrganManagerOptions {
  organs?: ClibuOrgan[]
}

/**
 * Simple manager that stores and invokes organs at lifecycle points. The
 * implementation is intentionally small — organs are an optional extension
 * mechanism and should not affect core correctness.
 */
export class OrganManager {
  private organs: ClibuOrgan[]
  constructor(opts: OrganManagerOptions = {}) {
    this.organs = opts.organs ?? []
  }
  /** Register an organ instance to receive lifecycle events. */
  register(organ: ClibuOrgan) {
    this.organs.push(organ)
  }
  /** Emit the `onRegister` event for all organs. */
  emitRegister(config: CLIConfig) {
    for (const o of this.organs) o.onRegister?.(config)
  }
  /** Emit the `onParse` event for all organs. */
  emitParse(argv: string[]) {
    for (const o of this.organs) o.onParse?.(argv)
  }
  /** Emit the `onBeforeRun` event for all organs (awaits asynchronous hooks). */
  async emitBeforeRun(ctx: CLIContext) {
    for (const o of this.organs) await o.onBeforeRun?.(ctx)
  }
  /** Emit the `onAfterRun` event for all organs (awaits asynchronous hooks). */
  async emitAfterRun(ctx: CLIContext, result: unknown) {
    for (const o of this.organs) await o.onAfterRun?.(ctx, result)
  }
}
