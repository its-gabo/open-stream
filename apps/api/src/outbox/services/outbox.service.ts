import type { DatabaseExecutor } from "../../db/database.types"
import type { OutboxRepository } from "../repository/outbox.repository"
import type {
  OutboxMessagePayloads,
  OutboxMessageType,
} from "../types/outbox.types"

export class OutboxService {
  constructor(private readonly outboxRepository: OutboxRepository) {}

  /**
   * Records a message for asynchronous handling. Pass the transaction of the
   * domain change so the message is stored only if that change commits.
   */
  async publishMessage<TType extends OutboxMessageType>(
    type: TType,
    payload: OutboxMessagePayloads[TType],
    executor: DatabaseExecutor
  ) {
    await this.outboxRepository.insertMessage({ type, payload }, executor)
  }
}
