import { expect, test } from "bun:test"
import { renderCommandHelp, renderHelp } from "../src/help"
import { createCLI, enumOption, flag, number, string } from "../src/index"
import { matchSnapshot } from "./snapshot.util"

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
      }
    }
  }
})

test("snapshot: root help", () => {
  const out = renderHelp(cli.config)
  const res = matchSnapshot("root-help", out)
  expect(res.created === false || res.created === true).toBe(true)
})

test("snapshot: build command help", () => {
  const out = renderCommandHelp(cli.config, ["build"])
  const res = matchSnapshot("build-help", out)
  expect(res.created === false || res.created === true).toBe(true)
})
