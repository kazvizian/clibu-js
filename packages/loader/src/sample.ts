/**
 * Return a short human-friendly hint describing supported config file names
 * and a minimal example. This is printed to stderr by the facade `run()` when
 * no configuration file is discovered.
 */
export function sampleConfigHint(): string {
  return `No configuration file found.
Create one of the following in the project root:
  - clibu.config.ts / .mts / .cts (recommended, export default config)
  - clibu.config.mjs / .js / .cjs
  - clibu.config.json
Minimal example (TypeScript):

export default {
  name: "mycli",
  version: "0.0.1",
  options: {
    verbose: { kind: "flag", alias: "v", description: "Verbose output" }
  },
  commands: {
    hello: {
      description: "Greet user",
      run(ctx) { console.log("hello", ctx.args.join(" ")) }
    }
  }
}
`
}
