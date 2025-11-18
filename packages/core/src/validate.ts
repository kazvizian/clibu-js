import { ValidationError } from "./errors"
import type {
  EnumOptionSchema,
  FlagOptionSchema,
  NumberOptionSchema,
  OptionRecord,
  StringOptionSchema
} from "./types"

export function validateOptionValues(
  schema: OptionRecord,
  values: Record<string, unknown>
) {
  for (const [name, def] of Object.entries(schema)) {
    // required
    if (def.required && !(name in values)) {
      throw new ValidationError(`Required option missing: --${name}`)
    }
    if (!(name in values)) continue // skip absent values
    const v = values[name]
    switch (def.kind) {
      case "flag":
        validateFlag(def, v, name)
        break
      case "string":
        validateString(def, v, name)
        break
      case "number":
        validateNumber(def, v, name)
        break
      case "enum":
        validateEnum(def, v, name)
        break
    }
  }
}

function validateFlag(_def: FlagOptionSchema, v: unknown, name: string) {
  if (typeof v !== "boolean")
    throw new ValidationError(`Option --${name} must be boolean`)
}

function validateString(def: StringOptionSchema, v: unknown, name: string) {
  if (typeof v !== "string")
    throw new ValidationError(`Option --${name} must be a string`)
  if (def.minLength !== undefined && v.length < def.minLength) {
    throw new ValidationError(
      `String --${name} length < minLength ${def.minLength}`
    )
  }
  if (def.maxLength !== undefined && v.length > def.maxLength) {
    throw new ValidationError(
      `String --${name} length > maxLength ${def.maxLength}`
    )
  }
  if (def.pattern && !def.pattern.test(v)) {
    throw new ValidationError(
      `String --${name} does not match pattern ${def.pattern}`
    )
  }
}

function validateNumber(def: NumberOptionSchema, v: unknown, name: string) {
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new ValidationError(`Option --${name} must be a number`)
  }
  if (def.integer && !Number.isInteger(v)) {
    throw new ValidationError(`Option --${name} must be an integer`)
  }
  if (def.min !== undefined && v < def.min) {
    throw new ValidationError(`Value for --${name} < min ${def.min}`)
  }
  if (def.max !== undefined && v > def.max) {
    throw new ValidationError(`Value for --${name} > max ${def.max}`)
  }
}

function validateEnum(def: EnumOptionSchema, v: unknown, name: string) {
  if (typeof v !== "string")
    throw new ValidationError(`Enum option --${name} must be a string`)
  const val = def.caseSensitive ? v : v.toLowerCase()
  const choices = def.caseSensitive
    ? def.choices
    : def.choices.map((c) => c.toLowerCase())
  if (!choices.includes(val)) {
    throw new ValidationError(
      `Value for --${name} is not in enum choices: ${v}`
    )
  }
}
