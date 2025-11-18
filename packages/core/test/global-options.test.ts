import { expect, test } from "bun:test"
import { renderCommandHelp, renderHelp } from "../../help/src/index"
import { OptionConflictError } from "../src/errors"
import { buildContext, createCLI, enumOption, flag, number } from "../src/index"

test("root help lists GLOBAL OPTIONS section", () => {
  const cli = createCLI({
    name: "tool",
    version: "0.0.0",
    options: {
      verbose: flag({ alias: "v", description: "Verbose output" }),
      mode: enumOption({ choices: ["dev", "prod"], description: "Mode" })
    },
    commands: { build: { description: "Build", run() {} } }
  })
  const out = renderHelp(cli.config)
  expect(out).toContain("GLOBAL OPTIONS:")
  expect(out).toContain("--verbose")
  expect(out).toContain("--mode")
})

test("command help inherits global options by default", () => {
  const cli = createCLI({
    name: "tool",
    options: { verbose: flag({ alias: "v" }) },
    commands: {
      build: {
        description: "Build",
        options: {
          threads: number({ min: 1, max: 8, description: "Threads" })
        },
        run() {}
      }
    }
  })
  const out = renderCommandHelp(cli.config, ["build"])
  expect(out).toContain("GLOBAL OPTIONS:")
  expect(out).toContain("--verbose")
  expect(out).toContain("OPTIONS:")
  expect(out).toContain("--threads")
})

test("inheritGlobal:false hides global options", () => {
  const cli = createCLI({
    name: "tool",
    options: { verbose: flag({ alias: "v" }) },
    commands: {
      build: {
        description: "Build",
        inheritGlobal: false,
        options: { threads: number({ min: 1, max: 8 }) },
        run() {}
      }
    }
  })
  const out = renderCommandHelp(cli.config, ["build"])
  expect(out).not.toContain("GLOBAL OPTIONS:")
  expect(out).toContain("--threads")
})

test("overridden global option not listed in GLOBAL OPTIONS section", () => {
  const cli = createCLI({
    name: "tool",
    options: { verbose: flag({ alias: "v", description: "Global verbose" }) },
    commands: {
      build: {
        description: "Build",
        // Override same name with new description (same kind allowed)
        options: {
          verbose: flag({ alias: "v", description: "Local verbose" })
        },
        run() {}
      }
    }
  })
  const out = renderCommandHelp(cli.config, ["build"])
  // Should not show verbose under GLOBAL OPTIONS, but under OPTIONS
  const globalSectionStart = out.indexOf("GLOBAL OPTIONS:")
  if (globalSectionStart !== -1) {
    const globalSlice = out.slice(globalSectionStart, globalSectionStart + 200)
    expect(globalSlice).not.toContain("Local verbose")
  }
  expect(out).toContain("OPTIONS:")
  expect(out).toContain("Local verbose")
})

test("alias collision between global and command options throws OptionConflictError", () => {
  expect(() => {
    createCLI({
      name: "tool",
      options: { verbose: flag({ alias: "v" }) },
      commands: {
        build: {
          description: "Build",
          options: { quick: flag({ alias: "v" }) }, // alias v collides with different name
          run() {}
        }
      }
    })
  }).toThrow(OptionConflictError)
})

test("kind mismatch override throws OptionConflictError", () => {
  expect(() => {
    createCLI({
      name: "tool",
      options: { verbose: flag({ alias: "v" }) },
      commands: {
        build: {
          description: "Build",
          options: { verbose: number({ min: 0, max: 10 }) }, // same name different kind
          run() {}
        }
      }
    })
  }).toThrow(OptionConflictError)
})

test("buildContext merges global and command options", () => {
  const cli = createCLI({
    name: "tool",
    options: { verbose: flag({ alias: "v" }) },
    commands: {
      build: {
        description: "Build",
        options: { threads: number({ min: 1, max: 8 }) },
        run() {}
      }
    }
  })
  const argv = ["build", "--verbose", "--threads=4"]
  const ctx = buildContext(cli.config, argv)
  expect(ctx.globalOptions?.verbose).toBe(true)
  expect(ctx.commandOptions?.threads).toBe(4)
  expect(ctx.options.verbose).toBe(true)
  expect(ctx.options.threads).toBe(4)
})
