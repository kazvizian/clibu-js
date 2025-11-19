/**
 * Internal formatting helpers for deterministic help rendering.
 */
export function formatRow(
  left: string,
  right: string,
  pad = 2,
  gap = 2
): string {
  const leftPad = " ".repeat(pad) + left
  const spacing = " ".repeat(gap)
  return right ? leftPad + spacing + right : leftPad
}

export function formatRows(
  rows: Array<{ left: string; right: string }>,
  pad = 2,
  gap = 2
): string[] {
  const lefts = rows.map((r) => r.left)
  const maxLeft = Math.max(0, ...lefts.map((l) => l.length))
  return rows.map((r) => {
    const left = r.left + " ".repeat(maxLeft - r.left.length)
    return formatRow(left, r.right, pad, gap)
  })
}
