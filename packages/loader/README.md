<div align="center">

# @clibu/loader

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/clibu-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets Butterfly](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

[![gzip size](http://img.badgesize.io/https://unpkg.com/@clibu/loader@latest/dist/index.mjs?compression=gzip)](https://unpkg.com/@clibu/loader@latest/dist/index.mjs)

</div>

Configuration loader for Clibu. Discovers `clibu.config.*` with first‑match resolution and lightweight TypeScript transpile + cache.

## Features

- Searches the project root for the first existing config in this order:
  1. `clibu.config.ts`
  2. `clibu.config.mts`
  3. `clibu.config.cts`
  4. `clibu.config.mjs`
  5. `clibu.config.js`
  6. `clibu.config.cjs`
  7. `clibu.config.json`

- For TypeScript files, transpiles on the fly and caches the output in `.clibu/cache/` using a SHA‑1 of the source contents.
  - `.ts` / `.mts` → ESM (`.mjs`)
  - `.cts` → CJS (`.cjs`)

## Basic usage

```ts
import type { CLIConfig } from "@clibu/core"
import { loadConfig, sampleConfigHint } from "@clibu/loader"

async function main() {
  const cfg: CLIConfig | null = await loadConfig(process.cwd())
  if (!cfg) {
    console.error(sampleConfigHint())
    process.exitCode = 1
    return
  }
  // Use cfg with @clibu/core
}
```

## Example TypeScript config

```ts
// clibu.config.ts
import { defineConfig } from "clibu"

export default {
  name: "mycli",
  version: "0.0.1",
  options: {
    verbose: { kind: "flag", alias: "v", description: "Verbose output" }
  },
  commands: {
    hello: {
      description: "Greet user",
      run(ctx) {
        console.log("hello", ctx.args.join(" "))
      }
    }
  }
}
```

## Notes

- Cache invalidation is content‑based; modifying the source regenerates the cache file.
- Loader concerns only discovery + loading; parsing/validation/runtime live in `@clibu/core`.

## License

MIT © KazViz
