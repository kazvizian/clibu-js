/**
 * Safely pick the exported configuration object from a dynamic module import.
 *
 * The loader supports both named `export const config = {}` and default
 * `export default {}` shapes. For CommonJS compatibility this function also
 * handles an imported object that contains a `config` property.
 */
export function pickExport(mod: unknown): unknown {
  if (mod && typeof mod === "object") {
    const rec = mod as Record<string, unknown>
    // Prefer named `config` if present (covers CJS `exports.config = {}` case)
    if ("config" in rec && rec.config !== undefined) return rec.config
    if ("default" in rec && rec.default !== undefined) return rec.default
  }
  return mod
}
