import { expect, test } from "bun:test"
import {
  buildContext,
  createCLI,
  enumOption,
  flag,
  number,
  ParsingError
} from "../src/index"

const cli = createCLI({
  name: "riglet",
  commands: {
    build: {
      description: "Edge parser cases",
      options: {
        verbose: flag({ alias: ["v"], description: "Verbose output" }),
        threads: number({ min: 1, max: 4, required: false }),
        mode: enumOption({ choices: ["DEV", "PROD"], caseSensitive: false })
      },
      run(ctx) {
        return ctx.options
      }
    }
  }
})

function ctx(argv: string[]) {
  return buildContext(cli.config, argv)
}

test("negated flag yields false", () => {
  const c = ctx(["build", "--no-verbose"])
  expect(c.options.verbose).toBe(false)
})

test("short alias -v yields true", () => {
  const c = ctx(["build", "-v"])
  expect(c.options.verbose).toBe(true)
})

test("unknown option after command triggers ParsingError", () => {
  expect(() => ctx(["build", "--unknown"])).toThrow(ParsingError)
})

test("enum case-insensitive accepted", () => {
  const c = ctx(["build", "--mode=dev"])
  expect(c.options.mode).toBe("dev")
})

test("duplicate long option throws ParsingError", () => {
  expect(() => ctx(["build", "--verbose", "--verbose"])).toThrow(ParsingError)
})
