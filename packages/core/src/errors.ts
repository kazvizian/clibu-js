/**
 * Base error class for Clibu runtime errors.
 *
 * All domain-specific errors extend this class and provide a stable `code`
 * string that callers can use to switch on error categories.
 */
export class ClibuError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

/** Error raised during parsing (tokenization / option parsing). */
export class ParsingError extends ClibuError {
  constructor(message: string) {
    super(message, "E_PARSE")
  }
}

/** Error raised when option values fail validation rules. */
export class ValidationError extends ClibuError {
  constructor(message: string) {
    super(message, "E_VALIDATE")
  }
}

/** Error thrown when a requested command path cannot be resolved. */
export class CommandNotFoundError extends ClibuError {
  constructor(commandPath: string[]) {
    super(`Command not found: ${commandPath.join(" ")}`, "E_COMMAND_NOT_FOUND")
  }
}

/** Error representing a conflict between option definitions (alias or kind). */
export class OptionConflictError extends ClibuError {
  constructor(optionName: string, detail?: string) {
    super(
      `Option conflict '${optionName}'${detail ? `: ${detail}` : ""}`,
      "E_OPTION_CONFLICT"
    )
  }
}
