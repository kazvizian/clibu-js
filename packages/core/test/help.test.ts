import { expect, test } from "bun:test"
import { renderCommandHelp, renderHelp } from "../../help/src/index"
import { createCLI, enumOption, flag, number, string } from "../src/index"

const cli = createCLI({
  name: "riglet",
  version: "0.0.1",
  commands: {
    build: {
      description: "Build project",
      options: {
        threads: number({
          min: 1,
          max: 8,
          required: true,
          description: "Thread count"
        }),
        verbose: flag({ alias: "v", description: "Output verbose" }),
        mode: enumOption({
          choices: ["dev", "prod"],
          required: true,
          description: "Build mode"
        }),
        profile: string({
          pattern: /^[a-z]+$/,
          required: false,
          description: "Lowercase profile"
        })
      },
      run() {}
    }
  }
})

test("renderHelp includes command list", () => {
  const out = renderHelp(cli.config)
  expect(out).toContain("COMMANDS:")
  expect(out).toContain("build")
})

test("renderCommandHelp includes OPTIONS and metadata", () => {
  const out = renderCommandHelp(cli.config, ["build"])
  expect(out).toContain("OPTIONS:")
  expect(out).toContain("--threads")
  expect(out).toContain("choices: dev|prod")
  expect(out).toContain("default") // verbose default false
})
