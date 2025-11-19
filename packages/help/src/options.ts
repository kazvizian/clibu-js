import type { OptionRecord, OptionSchema } from "@clibu/core"
import { normalizeOptionRecord } from "@clibu/core"
import { formatRows } from "./format"

export function renderOptions(options?: OptionRecord): string {
  if (!options || !Object.keys(options).length) return "(No options)"
  const norm = normalizeOptionRecord(options)
  const rows = Object.keys(norm).map((name) => {
    const schema: OptionSchema = norm[name]
    const aliasList: string[] = Array.isArray(schema.alias)
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

export function renderGlobalOptions(options: OptionRecord): string {
  const norm = normalizeOptionRecord(options)
  const rows = Object.keys(norm).map((name) => {
    const schema: OptionSchema = norm[name]
    const aliasList: string[] = Array.isArray(schema.alias)
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
