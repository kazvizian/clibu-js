import { CommandNotFoundError } from "./errors"
import type {
  CLIConfig,
  CommandDef,
  CommandPathNode,
  ResolvedCommand
} from "./types"

/** Node in the command graph representing a registered command. */
export interface CommandGraphNode {
  name: string
  def: CommandDef
  children: Record<string, CommandGraphNode>
  depth: number
}

/** In-memory command graph built from a `CLIConfig`. */
export interface CommandGraph {
  rootCommands: Record<string, CommandGraphNode>
}

/**
 * Build a command graph from a `CLIConfig`.
 *
 * The graph mirrors the nested `commands` structure and attaches a depth
 * field to each node to help with rendering and diagnostics.
 */
export function buildGraph(cfg: CLIConfig): CommandGraph {
  const convert = (
    name: string,
    def: CommandDef,
    depth: number
  ): CommandGraphNode => ({
    name,
    def,
    depth,
    children: Object.fromEntries(
      Object.entries(def.commands ?? {}).map(([childName, childDef]) => [
        childName,
        convert(childName, childDef, depth + 1)
      ])
    )
  })
  return {
    rootCommands: Object.fromEntries(
      Object.entries(cfg.commands).map(([name, def]) => [
        name,
        convert(name, def, 0)
      ])
    )
  }
}

/**
 * Resolve a sequence of path parts into a ResolvedCommand. Throws
 * `CommandNotFoundError` when the path cannot be fully resolved.
 */
export function resolveCommand(
  graph: CommandGraph,
  pathParts: string[]
): ResolvedCommand {
  const path: CommandPathNode[] = []
  let currentMap = graph.rootCommands
  let target: CommandDef | undefined
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    const node = currentMap[part]
    if (!node) break
    path.push({ name: node.name, def: node.def, depth: node.depth })
    target = node.def
    currentMap = node.children
  }
  // If there are still parts left that couldn't be consumed, report a not-found error.
  const consumed = path.map((p) => p.name).length
  if (consumed < pathParts.length) {
    throw new CommandNotFoundError(pathParts.slice(0, consumed + 1))
  }
  if (!target) {
    throw new CommandNotFoundError(pathParts.length ? pathParts : ["<empty>"])
  }
  return { path, target }
}
