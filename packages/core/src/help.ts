// Internal: fallback help renderer — used for tests and internal tooling.
// Runtime presentation and richer formatting belong in the separate
// `@clibu/help` package. Keep this copy small and deterministic so
// snapshots and unit tests remain stable.
import { buildGraph, resolveCommand } from "./graph"
import { normalizeOptionRecord } from "./schema"
import type { CLIConfig, OptionRecord, ResolvedCommand } from "./types"

/** Options that control help rendering (future use). */
export interface HelpRenderOptions {
  width?: number
}

/**
 * Render top-level help text for the provided CLI configuration.
 *
 * This function is intentionally simple and deterministic so snapshots can be
 * used in tests. Presentation responsibilities (format variants) are moved to
 * the dedicated `@clibu/help` package; this kept copy remains as a fallback
 * for tests and internal tooling.
 */
export function renderHelp(cfg: CLIConfig): string {
  const lines: string[] = []
  lines.push(`${cfg.name}${cfg.version ? ` v${cfg.version}` : ""}`)
  lines.push("")
  lines.push("USAGE:")
  lines.push(`  ${cfg.name} <command> [options]`)
  lines.push("")
  lines.push("COMMANDS:")
  const commandEntries = Object.entries(cfg.commands)
  lines.push(
    ...formatRows(
      commandEntries.map(([name, def]) => ({
        left: name,
        right: def.description ?? ""
      }))
    )
  )
  lines.push("")
  if (cfg.options && Object.keys(cfg.options).length) {
    lines.push(renderGlobalOptions(cfg.options))
    lines.push("")
  }
  lines.push("(Use <command> --help for option details)")
  return lines.join("\n")
}

function formatRow(left: string, right: string, pad = 2, gap = 2): string {
  const leftPad = " ".repeat(pad) + left
  const spacing = " ".repeat(gap)
  return right ? leftPad + spacing + right : leftPad
}

function formatRows(
  rows: Array<{ left: string; right: string }>,
  pad = 2,
  gap = 2
): string[] {
  const lefts = rows.map((r) => r.left)
  const maxLeft = Math.max(0, ...lefts.map((l) => l.length))
  return rows.map((r) => {
    const left = r.left + " ".repeat(maxLeft - r.left.length)
    return formatRow(left, r.right, pad, gap)
  })
}

/** Render an OPTIONS block for the provided option record. */
export function renderOptions(options?: OptionRecord): string {
  if (!options || !Object.keys(options).length) return "(No options)"
  const norm = normalizeOptionRecord(options)
  const rows = Object.entries(norm).map(([name, schema]) => {
    const aliasList = Array.isArray(schema.alias)
      ? schema.alias
      : schema.alias
        ? [schema.alias]
        : []
    const aliases = aliasList.length
      ? aliasList.map((a) => `-${a}`).join(",")
      : ""
    const head = `--${name}${aliases ? ` (${aliases})` : ""}`
    const meta: string[] = []
    if (schema.required) meta.push("required")
    if (schema.kind === "enum")
      meta.push(`choices: ${schema.choices.join("|")}`)
    if (schema.default !== undefined) meta.push(`default: ${schema.default}`)
    const right = [
      schema.description,
      meta.length ? `[${meta.join(", ")}]` : ""
    ]
      .filter(Boolean)
      .join(" ")
    return { left: head, right }
  })
  return ["OPTIONS:", ...formatRows(rows)].join("\n")
}

/** Render the GLOBAL OPTIONS block from a root OptionRecord. */
function renderGlobalOptions(options: OptionRecord): string {
  const norm = normalizeOptionRecord(options)
  const rows = Object.entries(norm).map(([name, schema]) => {
    const aliasList = Array.isArray(schema.alias)
      ? schema.alias
      : schema.alias
        ? [schema.alias]
        : []
    const aliases = aliasList.length
      ? aliasList.map((a) => `-${a}`).join(",")
      : ""
    const head = `--${name}${aliases ? ` (${aliases})` : ""}`
    const meta: string[] = []
    if (schema.required) meta.push("required")
    if (schema.kind === "enum")
      meta.push(`choices: ${schema.choices.join("|")}`)
    if (schema.default !== undefined) meta.push(`default: ${schema.default}`)
    const right = [
      schema.description,
      meta.length ? `[${meta.join(", ")}]` : ""
    ]
      .filter(Boolean)
      .join(" ")
    return { left: head, right }
  })
  return ["GLOBAL OPTIONS:", ...formatRows(rows)].join("\n")
}

/**
 * Render help for a specific command path including subcommands and options.
 *
 * The function filters inherited global options when a command overrides them
 * or sets `inheritGlobal: false`.
 */
export function renderCommandHelp(cfg: CLIConfig, path: string[]): string {
  const graph = buildGraph(cfg)
  const resolved: ResolvedCommand = resolveCommand(graph, path)
  const target = resolved.target
  const lines: string[] = []
  lines.push(`${cfg.name}${cfg.version ? ` v${cfg.version}` : ""}`)
  lines.push("")
  lines.push("COMMAND:")
  lines.push(
    ...formatRows([{ left: path.join(" "), right: target.description ?? "" }])
  )
  lines.push("")
  lines.push("USAGE:")
  lines.push(`  ${cfg.name} ${path.join(" ")} [options]`)
  lines.push("")
  if (target.commands && Object.keys(target.commands).length) {
    lines.push("SUBCOMMANDS:")
    lines.push(
      ...formatRows(
        Object.entries(target.commands).map(([name, def]) => ({
          left: name,
          right: def.description ?? ""
        }))
      )
    )
    lines.push("")
  }
  // Global options (filtered if overridden or inheritance disabled)
  if (cfg.options && target.inheritGlobal !== false) {
    const overridden = new Set(Object.keys(target.options ?? {}))
    const filtered: OptionRecord = {}
    for (const [k, v] of Object.entries(cfg.options)) {
      if (!overridden.has(k)) filtered[k] = v
    }
    if (Object.keys(filtered).length) {
      lines.push(renderGlobalOptions(filtered))
      lines.push("")
    }
  }
  lines.push(renderOptions(target.options))
  return lines.join("\n")
}
