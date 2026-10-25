import { OutboxRepository } from "./repository/outbox.repository"
import { OutboxService } from "./services/outbox.service"
import type { OutboxModuleDependencies } from "./types/outbox.types"

/** Publishing side of the outbox, used by the API to record messages. */
export function createOutboxModule(dependencies: OutboxModuleDependencies) {
  const outboxRepository = new OutboxRepository(dependencies.db)

  return {
    outboxRepository,
    outboxService: new OutboxService(outboxRepository),
  }
}
