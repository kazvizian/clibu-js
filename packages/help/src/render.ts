import type { CLIConfig, OptionRecord, ResolvedCommand } from "@clibu/core"
import { buildGraph, resolveCommand } from "@clibu/core"
import { formatRows } from "./format"
import { renderGlobalOptions, renderOptions } from "./options"

export function renderHelp(cfg: CLIConfig): string {
  const lines: string[] = []
  lines.push(`${cfg.name}${cfg.version ? ` v${cfg.version}` : ""}`)
  lines.push("")
  lines.push("USAGE:")
  lines.push(`  ${cfg.name} <command> [options]`)
  lines.push("")
  lines.push("COMMANDS:")
  const commandEntries = Object.keys(cfg.commands)
  lines.push(
    ...formatRows(
      commandEntries.map((name) => ({
        left: name,
        right: cfg.commands[name]?.description ?? ""
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
    const subs = Object.keys(target.commands)
    lines.push(
      ...formatRows(
        subs.map((name) => ({
          left: name,
          right: target.commands?.[name]?.description ?? ""
        }))
      )
    )
    lines.push("")
  }
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
