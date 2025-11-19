<div align="center">

# Clibu — a modern TypeScript-first CLI builder

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/clibu-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

</div>

Clibu is a small TypeScript-first CLI builder split across focused packages so the core parser, help renderer, and configuration loader can evolve independently.

## Packages

- `@clibu/core` — Core engine: parsing, command graph, option validation, context creation, and runtime execution (exports `createCLI`, schema helpers).
- `@clibu/help` — Deterministic plain-text help renderer for root and per-command help. Implemented with small, testable modules (format / options / render).
- `@clibu/loader` — Configuration discovery and TypeScript transpilation with content-hash caching under `.clibu/cache/`. Implements smart picking of named/default exports and supports `.ts/.mts/.cts` transpilation.
- `clibu` — Umbrella package and executable facade: loads a project config, intercepts `--help`/`-h`, runs commands via `@clibu/core`, and re-export functions and types across `@clibu` packages.

## Quick start

1. Create a configuration file at your project root. For best IDE experience prefer TypeScript and `defineConfig`:

```ts
// clibu.config.ts
import { defineConfig } from "clibu"

export default defineConfig({
  name: "mycli",
  version: "0.0.1",
  options: {
    verbose: { kind: "flag", alias: "v", description: "Verbose output" }
  },
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

Notes:

- `defineConfig(...)` is exported for IDE-friendly type inference. On TS 4.9+ you can also use the `satisfies` operator with `CLIConfig`.
- TypeScript configs (`.ts/.mts/.cts`) are transpiled on-demand and cached under `.clibu/cache/`.

2. Run the CLI:

```bash
npx clibu --help
npx clibu hello world -v
```

## Development

- Build: `bun run build` (runs turbo/packlet pipeline)
- Test: `bun run test` (runs tests across packages)
- Lint & format: `bun run lint` and `bun run format:check` / `bun run format`

The repository uses Bun for local scripts but runs on Node 18+ at runtime.

## Design highlights

- Two-phase parsing: a relaxed discovery pass finds the target command path, then a strict per-command parse validates options.
- Global options support inheritance and overrides; conflicts (alias/shape) are detected at creation time.
- Help rendering is intentionally deterministic and small so snapshot tests are reliable.

## Internals (help & loader refactor)

- `@clibu/help` internals are split into `format`, `options`, and `render` modules. The package root re-exports the renderer functions.
- `@clibu/loader` was split into `pick`, `transpile`, `sample`, and `load` modules; `index.ts` re-exports the public helpers.

These refactors keep the public API stable while making the code easier to test and extend.

## Plugin system (Organs)

Clibu supports a small plugin surface (called "organs") that can observe and augment runtime behavior. See `@clibu/core` docs and `docs/tutorial/07-plugins-organs.md` for lifecycle hooks and examples.

## Examples and tutorials

- See `examples/quickstart/` for a minimal runnable example.
- A tutorial series is available under `docs/tutorial/` covering setup, config authoring, validation, programmatic usage, and testing.

## License

MIT © KazViz
