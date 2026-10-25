import type { DomainErrorDefinition } from "./domain-error.types"

/**
 * Business rule violation raised by services. It carries no HTTP details;
 * `handleApiError` maps its kind to a status code.
 */
export class DomainError extends Error {
  constructor(readonly definition: DomainErrorDefinition) {
    super(definition.message)
    this.name = DomainError.name
  }
}
