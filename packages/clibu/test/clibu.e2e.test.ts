import { describe, expect, it } from "bun:test"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const cliPath = fileURLToPath(new URL("../dist/index.mjs", import.meta.url))

function makeTempDir(prefix = "clibu-e2e-") {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  const cleanup = () => rmSync(dir, { recursive: true, force: true })
  return { dir, cleanup }
}

describe("clibu e2e", () => {
  it("prints hint and exits 1 when no config is found", () => {
    const { dir, cleanup } = makeTempDir()
    try {
      const res = spawnSync("node", [cliPath], {
        cwd: dir,
        encoding: "utf8"
      })
      expect(res.status).toBe(1)
      expect(res.stderr).toContain("No configuration file found.")
    } finally {
      cleanup()
    }
  })

  it("renders global help via --help", () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.ts"),
        `export default {
          name: "mycli",
          version: "0.0.1",
          commands: {
            hello: { description: "Say hello", run(ctx){ console.log("hello", ctx.args.join(" ")) } },
            ping: { description: "Return pong", run(){ return "pong" } }
          }
        }`
      )
      const res = spawnSync("node", [cliPath, "--help"], {
        cwd: dir,
        encoding: "utf8"
      })
      expect(res.status).toBe(0)
      expect(res.stdout).toContain("USAGE:")
      expect(res.stdout).toContain("COMMANDS:")
      expect(res.stdout).toContain("hello")
      expect(res.stdout).toContain("ping")
    } finally {
      cleanup()
    }
  })

  it("renders command help via <cmd> --help and runs commands", () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.ts"),
        `export default {
          name: "mycli",
          version: "0.0.1",
          commands: {
            hello: { description: "Say hello", run(ctx){ console.log("hello", ctx.args.join(" ")) } },
            ping: { description: "Return pong", run(){ return "pong" } }
          }
        }`
      )
      const helpRes = spawnSync("node", [cliPath, "hello", "--help"], {
        cwd: dir,
        encoding: "utf8"
      })
      expect(helpRes.status).toBe(0)
      expect(helpRes.stdout).toContain("COMMAND:")
      // hello has no options; renderer shows "(No options)" instead of an OPTIONS header
      expect(helpRes.stdout).toContain("(No options)")

      const runRes = spawnSync("node", [cliPath, "hello", "Alice"], {
        cwd: dir,
        encoding: "utf8"
      })
      expect(runRes.status).toBe(0)
      expect(runRes.stdout.trim()).toBe("hello Alice")

      const pingRes = spawnSync("node", [cliPath, "ping"], {
        cwd: dir,
        encoding: "utf8"
      })
      expect(pingRes.status).toBe(0)
      expect(pingRes.stdout.trim()).toBe("pong")
    } finally {
      cleanup()
    }
  })
})
