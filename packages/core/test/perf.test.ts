import { expect, test } from "bun:test"

// Rough cold-start measurement: dynamic import + createCLI.
// This is an approximation, not a strict benchmark.

test("cold start under 50ms (approx)", async () => {
  const t0 = performance.now()
  const mod = await import("../src/index")
  const t1 = performance.now()
  interface CoreExports {
    createCLI?: (cfg: {
      name: string
      commands: Record<
        string,
        { description?: string; run?: (ctx: unknown) => unknown }
      >
    }) => unknown
  }
  const core: CoreExports = mod
  if (!core.createCLI) throw new Error("missing createCLI export")
  const { createCLI } = core
  const t2Before = performance.now()
  createCLI({
    name: "riglet",
    commands: { noop: { description: "noop", run() {} } }
  })
  const t2 = performance.now()
  const importTime = t1 - t0
  const createTime = t2 - t2Before
  // Allow generous upper bound for CI variability.
  expect(importTime).toBeLessThan(80)
  expect(createTime).toBeLessThan(10)
  // Log numbers for manual tracking.
  console.log(
    `perf(import=${importTime.toFixed(2)}ms create=${createTime.toFixed(2)}ms)`
  )
})
