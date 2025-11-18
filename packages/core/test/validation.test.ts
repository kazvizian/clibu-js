import { expect, test } from "bun:test"
import {
  buildContext,
  createCLI,
  enumOption,
  flag,
  number,
  ParsingError,
  string,
  ValidationError
} from "../src/index"

const cli = createCLI({
  name: "riglet",
  version: "0.0.1",
  commands: {
    build: {
      description: "Build project",
      options: {
        threads: number({ min: 1, max: 8, required: true }),
        verbose: flag(),
        mode: enumOption({ choices: ["dev", "prod"], required: true }),
        profile: string({ pattern: /^[a-z]+$/, required: false })
      },
      run(ctx) {
        return ctx.options
      }
    }
  }
})

function runCtx(argv: string[]) {
  return buildContext(cli.config, argv)
}

test("success parse and validate minimal options", () => {
  const ctx = runCtx(["build", "--threads=4", "--mode=dev", "--verbose"])
  expect(ctx.options).toEqual({ threads: 4, mode: "dev", verbose: true })
})

test("fail min number", () => {
  expect(() => runCtx(["build", "--threads=0", "--mode=dev"])).toThrow(
    ValidationError
  )
})

test("fail required enum missing", () => {
  expect(() => runCtx(["build", "--threads=2"])).toThrow(ValidationError)
})

test("fail pattern string", () => {
  expect(() =>
    runCtx(["build", "--threads=2", "--mode=dev", "--profile=Abc"])
  ).toThrow(ValidationError)
})

test("fail invalid enum", () => {
  expect(() => runCtx(["build", "--threads=2", "--mode=staging"])).toThrow(
    ParsingError
  )
})
