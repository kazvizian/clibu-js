<div align="center">

# @clibu/help

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/clibu-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets Butterfly](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

[![gzip size](http://img.badgesize.io/https://unpkg.com/@clibu/help@latest/dist/index.mjs?compression=gzip)](https://unpkg.com/@clibu/help@latest/dist/index.mjs)

</div>

Deterministic text help renderer for Clibu. Produces aligned root and per‑command views; filters global options appropriately and annotates metadata.

## Features

- Root and per‑command help output (with SUBCOMMANDS when present).
- GLOBAL OPTIONS section (filtered when overridden or `inheritGlobal: false`).
- Aligned columns and concise metadata tags: `[required]`, `[default: X]`, `[choices: a|b|c]`.
- Small, snapshot‑friendly output (stable across environments).

## Basic usage

```ts
import type { CLIConfig } from "@clibu/core"
import { renderHelp, renderCommandHelp } from "@clibu/help"

function showHelp(cfg: CLIConfig, path: string[] = []) {
  const out = path.length ? renderCommandHelp(cfg, path) : renderHelp(cfg)
  console.log(out)
}
```

## API surface

- `renderHelp(cfg: CLIConfig): string`
- `renderCommandHelp(cfg: CLIConfig, path: string[]): string`

## Status

- Used by the `clibu` facade to render `--help`/`-h`.
- When testing `@clibu/core`, an internal fallback renderer is used to avoid cross‑package coupling.

## License

MIT © KazViz
