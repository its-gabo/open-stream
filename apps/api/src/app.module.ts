import { createAuthModule } from "./auth/auth.module"
import type { AppConfig } from "./config/app.config"
import { createDatabase } from "./db/database"
import { createEmailModule } from "./email/email.module"
import { createOrganizationsModule } from "./organizations/organizations.module"
import { createOutboxModule } from "./outbox/outbox.module"

/**
 * The composition root: creates every repository and service once, passing dependencies
 * through constructors. The API server, the worker and tests all start from here.
 */
export function createAppModule(config: AppConfig) {
  const database = createDatabase(config.DATABASE_URL)
  const outbox = createOutboxModule({ db: database.db })
  const email = createEmailModule({ config })
  const auth = createAuthModule({
    db: database.db,
    config,
    outboxService: outbox.outboxService,
  })
  const organizations = createOrganizationsModule({
    db: database.db,
    config,
    outboxService: outbox.outboxService,
    authTokenService: auth.authTokenService,
  })

  return {
    config,
    db: database.db,
    ...outbox,
    ...email,
    ...auth,
    ...organizations,
    async close() {
      email.emailSenderService.close()
      await database.close()
    },
  }
}

export type AppModule = ReturnType<typeof createAppModule>
