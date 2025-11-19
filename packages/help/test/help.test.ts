import { describe, expect, it } from "bun:test"
import type { CLIConfig } from "@clibu/core"
import { renderCommandHelp, renderHelp } from "../src/index"

const baseConfig: CLIConfig = {
  name: "mycli",
  version: "1.2.3",
  options: {
    verbose: { kind: "flag", alias: "v", description: "Verbose output" },
    mode: {
      kind: "enum",
      choices: ["a", "b", "c"],
      description: "Mode",
      default: "b"
    }
  },
  commands: {
    hello: {
      description: "Greet",
      options: {
        name: { kind: "string", description: "Name" }
      },
      run() {
        /* no-op */
      }
    },
    sub: {
      description: "Parent",
      commands: {
        child: { description: "Child cmd" }
      }
    },
    noinherit: {
      description: "No inherit",
      inheritGlobal: false,
      options: {
        count: { kind: "number", description: "Count", default: 1 }
      }
    },
    override: {
      description: "Override global option",
      options: {
        verbose: { kind: "flag", description: "Local verbose" }
      }
    }
  }
}

describe("@clibu/help renderHelp", () => {
  it("renders top-level help (snapshot)", () => {
    const out = renderHelp(baseConfig)
    expect(out).toMatchSnapshot()
  })
})

describe("@clibu/help renderCommandHelp", () => {
  it("renders command help with options (snapshot)", () => {
    const out = renderCommandHelp(baseConfig, ["hello"])
    expect(out).toMatchSnapshot()
  })

  it("renders subcommands list (snapshot)", () => {
    const out = renderCommandHelp(baseConfig, ["sub"])
    expect(out).toMatchSnapshot()
  })

  it("filters global options when inheritGlobal=false", () => {
    const out = renderCommandHelp(baseConfig, ["noinherit"])
    expect(out).not.toContain("GLOBAL OPTIONS:")
    expect(out).toContain("OPTIONS:")
  })

  it("filters overridden global options from global list", () => {
    const out = renderCommandHelp(baseConfig, ["override"])
    // Global options header exists, but --verbose should not appear there
    const lines = out.split("\n")
    const globalIndex = lines.findIndex((l) => l.trim() === "GLOBAL OPTIONS:")
    const optionsIndex = lines.findIndex((l) => l.trim() === "OPTIONS:")
    const globalSection = lines.slice(globalIndex + 1, optionsIndex).join("\n")
    expect(globalSection).not.toContain("--verbose")
    // Local options should contain verbose
    const localSection = lines.slice(optionsIndex + 1).join("\n")
    expect(localSection).toContain("--verbose")
  })

  it("prints (No options) when command has no options", () => {
    const out = renderCommandHelp(baseConfig, ["sub", "child"])
    expect(out).toContain("(No options)")
  })
})
