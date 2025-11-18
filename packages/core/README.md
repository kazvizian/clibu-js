<div align="center">

# @clibu/core

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/clibu-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets Butterfly](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

[![gzip size](http://img.badgesize.io/https://unpkg.com/@clibu/core@latest/dist/index.mjs?compression=gzip)](https://unpkg.com/@clibu/core@latest/dist/index.mjs)

</div>

Declarative CLI engine core for Clibu. It provides a compact, type-aware schema for defining commands and options, a deterministic two-phase parser, and validation/runtime primitives. The core focuses on a small, stable surface that other packages (facade, help, loader) consume.

## Key features

- Declarative command & option DSL (`flag`, `string`, `number`, `enumOption`).
- Two‑phase parsing: relaxed scan to discover the command path, then strict option parsing for the resolved command (avoids false unknown-option errors).
- Global (root-level) options with optional inheritance; conflicts are detected at CLI creation.
- Validation and coercion for option values (required, min/max, integer, pattern, enum membership).
- Help metadata support (rendering provided by `@clibu/help`).
- Lightweight logger and an organ (plugin) stub for future extensions.

## Basic usage

```ts
import { createCLI, flag, number, enumOption, string } from "@clibu/core"

const cli = createCLI({
  name: "riglet",
  version: "0.0.1",
  commands: {
    build: {
      description: "Build project",
      options: {
        threads: number({ min: 1, max: 8, required: true }),
        verbose: flag({ alias: "v" }),
        mode: enumOption({ choices: ["dev", "prod"], required: true }),
        profile: string({ pattern: /^[a-z]+$/ })
      },
      run(ctx) {
        ctx.logger.info("Running build", ctx.options)
      }
    }
  }
})

await cli.run(process.argv.slice(2))
```

## Help output (example)

Root:

```
riglet v0.0.1
USAGE:
  riglet <command> [options]
COMMANDS:
  build  Build project
(Use <command> --help for option details)
```

Per‑command:

```
riglet v0.0.1
COMMAND:
  build Build project
USAGE:
  riglet build [options]
OPTIONS:
  --threads        Thread count [required]
  --verbose (-v)   Verbose output [default: false]
  --mode           Build mode [required choices: dev|prod]
  --profile        Lowercase profile
```

## Surface API

- `createCLI(config)`: create a CLI instance with `run()` and `help()`.
- `buildContext(cfg, argv)`: build an execution context (resolved command, args, validated options). The context separates `globalOptions` from `commandOptions`.
- Option DSL: `flag()`, `string()`, `number()`, `enumOption()`.
- `OrganManager` and `ClibuOrgan`: plugin hook stubs for future extension.

## Option validation

Validation runs after parsing:

- Number: `min`, `max`, `integer`.
- String: `pattern`, `minLength`, `maxLength`.
- Enum: `choices`, `caseSensitive`.
- Flag: boolean; supports `--no-<name>` for negation.

## Parsing overview

1. `parseArgv` performs a relaxed scan (collecting root/global options and raw tokens) to discover the command path.
2. Resolve the command path via graph traversal until a non‑command token.
3. `parseOptions` strictly parses options for the resolved command and rejects unknown options.
4. Validation of values and construction of the final CLI context.

## Internal layout

```
src/
  types.ts      // Core types & inference
  schema.ts     // DSL helpers & alias normalization
  graph.ts      // Command tree build & resolve
  parser.ts     // parseArgv + parseOptions
  validate.ts   // Per‑kind option validation
  context.ts    // buildContext (integrates phases)
  help.ts       // help metadata (rendering is in @clibu/help)
  run.ts        // createCLI runtime wrapper
  organ.ts      // Plugin hook stubs
```

## Testing

- Unit & edge tests: option validation, flag negation, duplicates, unknown options.
- Snapshot tests: stable help output in `test/__snapshots__`.
- Performance baseline: `perf.test.ts` measures import & creation time.

## License

MIT © KazViz
