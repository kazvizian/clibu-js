<div align="center">

# Clibu — a modern TypeScript-first CLI builder

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![license](https://img.shields.io/github/license/kazvizian/clibu-js)

</div>

Clibu is a focused, lightweight framework for building command-line interfaces with Bun and Node.js (ESM, Node 18+). It lets you define your entire CLI in a single configuration file—TypeScript, JavaScript, or JSON—while providing precise input validation, predictable help output, and a clean programmatic surface for automation.

This README guides you through installation, configuration, and usage, introduces the core concepts behind Clibu, and covers the APIs you can rely on when embedding it into tools or test suites.

## Why Clibu?

Clibu is designed for developers who value clarity, speed, and correctness:

- **Excellent developer experience** — Strong TypeScript types help you author and maintain CLIs with confidence.
- **Predictable output** — Stable help text and deterministic parsing make testing and CI friction-free.
- **Small, intentional design** — A compact API, straightforward concepts, and clear errors keep complexity low.

Clibu emphasizes reliability without sacrificing approachability, making it suitable for both simple utilities and larger toolchains.

## Features

- Single-file declarative configuration: `clibu.config.ts` / `.mts` / `.cts` / `.mjs` / `.js` / `.cjs` / `.json`
- TypeScript-first configuration and handler context
- Rich option kinds: `flag`, `string`, `number`, `enum` with validation (min/max, pattern, choices)
- Global options with inheritance and controlled overrides
- Deterministic help rendering, ideal for snapshots
- Structured, stable error codes
- Programmatic API for runners, loaders, and help renderers

## Install

Install from npm (Node 18+ / ESM):

```sh
bun add clibu
# or
pnpm add clibu
# or
npm install clibu
# or
yarn add clibu
```

## Quick start — CLI

Create `clibu.config.ts` at your project root (with type-safety via `defineConfig`):

```ts
// clibu.config.ts
import { defineConfig } from "clibu"

export default defineConfig({
  name: "mycli",
  version: "0.0.1",
  commands: {
    hello: {
      description: "Greet the user",
      run(ctx) {
        console.log("hello", ctx.args.join(" "))
      }
    }
  }
})
```

Run from the project directory:

```sh
clibu hello world
clibu --help
clibu hello --help
```

TypeScript configs are transpiled on demand and cached under `.clibu/cache/` using a content hash.

Type-safety tips

- Prefer `defineConfig({...})` for rich IntelliSense and immediate type errors in your editor.
- On TS 4.9+, you can also use the satisfies operator:

  ```ts
  import type { CLIConfig } from "clibu"
  export default {
    /* ... */
  } satisfies CLIConfig
  ```

## Why Clibu (expanded)

- **Fast iteration** — A small, coherent API and strong types help you build CLIs quickly and safely.
- **Test-friendly by design** — Deterministic rendering and strict validation enable stable snapshot testing.
- **Explicit configuration** — Commands and options are defined through clear schemas, reducing ambiguity and runtime surprises.

### Comparison

| Feature / Tool            | Clibu                              | Commander.js                | Yargs                       | Oclif                           |
| ------------------------- | ---------------------------------- | --------------------------- | --------------------------- | ------------------------------- |
| **Language focus**        | TypeScript-first (ESM)             | JavaScript-first            | JavaScript-first            | TypeScript-first                |
| **Config style**          | Single declarative config file     | Imperative API              | Declarative + builder API   | Class-based, plugin-oriented    |
| **Deterministic help**    | Yes (snapshot-friendly)            | Mostly stable               | Varies; formatting dynamic  | Stable but stylized             |
| **Validation model**      | Explicit schemas with strict parse | Limited built-in validation | Built-in validation options | Schema-light; validation manual |
| **Global options**        | Inheritance with overrides         | Manual                      | Partial support             | Supported                       |
| **Subcommands**           | Nested in config                   | Supported                   | Supported                   | Supported (via classes)         |
| **Runtime footprint**     | Very small                         | Small                       | Medium                      | Larger                          |
| **Programmatic API**      | Minimal, focused                   | Available                   | Available                   | Extensive                       |
| **TypeScript experience** | Strong types for config & ctx      | Community types             | Community types             | Designed for TS                 |
| **Use cases**             | Tools, utilities, dev CLIs         | Simple CLIs                 | Complex option-heavy CLIs   | Large CLI frameworks & plugins  |

## Core concepts

- **Command** — A named unit of work with `description`, `options`, optional `commands` (subcommands), and a `run(ctx)` handler.
- **Option kinds** — `flag`, `string`, `number`, `enum`.
- **Global options** — Declared at the root and inherited by default. Inheritance can be disabled (`inheritGlobal: false`) or overridden per-command.
- **Context (`ctx`)** — Passed to handlers and includes `argvRaw`, `command`, `args`, `options`, `globalOptions`, `commandOptions`, `env`, and a `logger`.

## Configuration reference

Minimal shape:

```ts
export interface CLIConfig {
  name: string
  version?: string
  options?: Record<string, unknown>
  commands: Record<string, CommandDef>
}
```

Command definition:

```ts
interface CommandDef {
  description?: string
  options?: Record<string, OptionSchema>
  commands?: Record<string, CommandDef>
  run?: (ctx: CLIContext) => unknown | Promise<unknown>
  inheritGlobal?: boolean
}
```

Option schema examples:

```ts
{
  verbose: { kind: "flag", alias: "v", description: "Verbose output", default: false },
  threads: { kind: "number", min: 1, max: 8, required: true },
  mode: { kind: "enum", choices: ["dev", "prod"], default: "dev" },
  profile: { kind: "string", pattern: /^[a-z]+$/ }
}
```

Common metadata: `alias`, `required`, `default`, `min`, `max`, `integer`, `minLength`, `maxLength`, `pattern`, `choices`, `caseSensitive`.

## Help rendering

Top-level help shows the CLI name, version, usage line, commands, and global options.
Command-level help provides the command description, its usage pattern, subcommands (if any), inherited global options, and command-specific options.
When no options exist, help clearly indicates `(No options)`.

The renderer is intentionally stable, ensuring clean diffs and predictable CI behavior.

## Programmatic usage

A small programmatic surface makes Clibu easy to embed.

Quick runner:

```ts
import { run } from "clibu"

const code = await run()
process.exitCode = code
```

Manual composition:

```ts
import { createCLI, loadConfig } from "clibu"

const cfg = await loadConfig(process.cwd())
if (!cfg) throw new Error("No clibu.config.* found")

const cli = createCLI(cfg)
await cli.run(["build"])
```

Programmatic help:

```ts
import { renderHelp, renderCommandHelp } from "clibu"

console.log(renderHelp(cfg))
console.log(renderCommandHelp(cfg, ["build"]))
```

TypeScript types (`CLIConfig`, `CLIContext`, etc.) are exported for convenience.

## Loader behavior (config discovery)

Configuration is resolved using the following priority:

1. TypeScript: `clibu.config.ts`, `.mts`, `.cts`
2. JavaScript: `clibu.config.mjs`, `.js`, `.cjs`
3. JSON: `clibu.config.json`

When importing a module, Clibu prefers `export const config = {}` and falls back to `export default {}`.
TypeScript files are compiled into `.clibu/cache/<hash>.mjs` (or `.cjs` for `.cts`) to optimize repeated runs.

### Implementation notes

- Loader & TS transpilation: `packages/loader/src/index.ts`
- Core engine: `packages/core/src/*`
- Deterministic help rendering: `packages/help/src/index.ts`

## Parsing and option semantics

Clibu uses a two-phase parsing strategy:

- **Relaxed scan (discovery)** — Identifies the command path, ignoring unknown options so users can mix global flags freely.
- **Strict parse (validation)** — Once the command is resolved, remaining tokens are validated against the merged option schema. Unknown options and duplicates raise a `ParsingError` (`E_PARSE`).

Supported token forms:

- Long: `--name`, `--name=value`
- Boolean negation: `--no-<name>`
- Short aliases and clusters: e.g., `-abc`

### Merging and overriding

- Command-level options override global ones by name.
- Alias conflicts or kind mismatches trigger `E_OPTION_CONFLICT`.
- `inheritGlobal: false` disables inheritance entirely.

### Option schema extras

- Flags support `negate?: boolean` (default `true`)
- Enums support `caseSensitive?: boolean` (default `false`)

## Programmatic API (exports)

From the `clibu` facade:

- `run(cwd?, argv?): Promise<number>`
- `createCLI(config: CLIConfig)`
- `loadConfig(cwd: string)`
- `renderHelp(cfg)`
- `renderCommandHelp(cfg, path)`

## Plugin system (Organs)

Clibu provides a lightweight extension mechanism called **organs**. An organ is a small, self-contained plugin that can observe or augment CLI behavior at key lifecycle points without interfering with core guarantees such as correctness and deterministic parsing.

Organs are intentionally minimal. They allow tooling authors to integrate logging, metrics, environment preparation, or other cross-cutting concerns in a controlled way.

### Key elements

- **`ClibuOrgan`** — the plugin interface. Typical hooks include:
  - `name: string` and optional `version`
  - `onRegister(config)` — invoked when a configuration object is loaded or attached
  - `onParse(argv)` — triggered during the relaxed parsing phase
  - `onBeforeRun(ctx)` — executed before a command handler starts (supports async)
  - `onAfterRun(ctx, result)` — executed after a handler completes (supports async)
  - `extendConfig(config)` — optionally returns a modified configuration for advanced scenarios

- **OrganManager** — a small utility that registers organs and emits lifecycle events. It is available through the public Clibu API.

### Usage example

To integrate organ behavior into a custom runner, use the low-level APIs together with `OrganManager`:

```ts
import { loadConfig, buildContext, OrganManager } from "clibu"

const argv = process.argv.slice(2)
const cfg = await loadConfig(process.cwd())
if (!cfg) throw new Error("No config found")

const organs = new OrganManager()

// Register custom organs
organs.register({
  name: "my-organ",
  onRegister(cfg) {
    // inspect or log
  },
  onBeforeRun(ctx) {
    // prepare resources
  }
})

// Emit lifecycle events
organs.emitRegister(cfg)
organs.emitParse(argv)

// Build execution context (resolves command and parses options)
const ctx = buildContext(cfg, argv)

// Run lifecycle hooks around the actual command
await organs.emitBeforeRun(ctx)
const result = await ctx.command.target.run?.(ctx)
await organs.emitAfterRun(ctx, result)
```

### Notes & guidance

- Organs are opt-in and not automatically wired into the high-level `run()` helper. To involve organs in the full lifecycle, use the lower-level composition APIs shown above.
- Organ hooks should remain fast and predictable. `onBeforeRun` and `onAfterRun` support asynchronous operations, making them suitable for tasks such as telemetry, setup/teardown, or environment checks.
- `extendConfig` is intended for advanced use cases. Because it can alter command resolution and validation, use it sparingly and keep transformed configurations transparent and traceable.

## Errors and stable codes

Clibu surfaces domain-specific errors with stable codes:

- `E_PARSE` — Unknown option, malformed value, invalid token
- `E_VALIDATE` — Failed validation rules
- `E_COMMAND_NOT_FOUND`
- `E_OPTION_CONFLICT`

`--version` / `-V` prints `<name> <version>`.

## FAQ & troubleshooting

- **“No configuration file found.”**
  Ensure a valid `clibu.config.*` exists at the project root; TypeScript files are auto-transpiled.

- **“Command has no run() handler.”**
  Provide a `run(ctx)` function or execute a subcommand that defines one.

- **“Alias collision or kind mismatch.”**
  Rename the option or disable global inheritance.

- **Using CommonJS?**
  Clibu is ESM-first. For programmatic usage from CJS, wrap your call with a dynamic `import()`.

## Contributing

Clibu aims to remain compact, reliable, and pleasant to use. Contributions are welcome, with a focus on:

- Keeping help output deterministic
- Adding thorough tests for parsing and validation
- Preserving API stability

## License

MIT © KazViz
