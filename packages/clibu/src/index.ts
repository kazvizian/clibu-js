#!/usr/bin/env node
import { pathToFileURL } from "node:url"
import { createCLI } from "@clibu/core"
import { renderCommandHelp, renderHelp } from "@clibu/help"
import { loadConfig, sampleConfigHint } from "@clibu/loader"

// Re-export programmatic APIs for umbrella usage
export * from "@clibu/core"
export * from "@clibu/help"
export * from "@clibu/loader"

/**
 * Entrypoint runner for Clibu.
 *
 * This high-level convenience function composes the loader, help renderer,
 * and core `createCLI` runtime to provide a minimal UX when invoking the
 * package as a binary. Behavior summary:
 *
 * - Attempts to discover and load `clibu.config.*` from `cwd` using the
 *   loader.
 * - If no config is found, prints a helpful hint (via `sampleConfigHint`).
 * - Short-circuits `--help` / `-h` handling and uses `@clibu/help` to render
 *   top-level or command-specific help.
 * - Delegates normal execution to a `createCLI(cfg).run(argv)` instance.
 *
 * Note: this function is safe to call programmatically from tests or tools.
 *
 * @param cwd - Directory used to discover `clibu.config.*` (defaults to
 *              `process.cwd()`).
 * @param argv - Argument vector (defaults to `process.argv.slice(2)`).
 * @returns A numeric exit code (0 success, 1 error).
 */
export async function run(
  cwd: string = process.cwd(),
  argv: string[] = process.argv.slice(2)
): Promise<number> {
  const cfg = await loadConfig(cwd)
  if (!cfg) {
    console.error(sampleConfigHint())
    return 1
  }

  // Intercept --help/-h and render help via @clibu/help
  const helpIndex = argv.findIndex((a) => a === "--help" || a === "-h")
  if (helpIndex !== -1) {
    const pathTokens: string[] = []
    for (const token of argv.slice(0, helpIndex)) {
      if (token.startsWith("-")) break
      pathTokens.push(token)
    }
    if (!pathTokens.length) {
      console.log(renderHelp(cfg))
    } else {
      try {
        console.log(renderCommandHelp(cfg, pathTokens))
      } catch {
        console.log(renderHelp(cfg))
      }
    }
    return 0
  }

  const cli = createCLI(cfg)
  const code = await cli.run(argv)
  return code
}

// Execute when invoked as a CLI binary; do nothing when imported as a module.
const isCliEntry = (() => {
  try {
    const argv1 = process.argv.length > 1 ? process.argv[1] : undefined
    if (!argv1) return false
    return import.meta.url === pathToFileURL(argv1).href
  } catch {
    return false
  }
})()

if (isCliEntry) {
  run()
    .then((code) => {
      process.exitCode = code
    })
    .catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
}
