import { ChevronRightIcon } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"

import {
  WEBHOOK_EVENT_GROUPS,
  WEBHOOK_EVENT_TYPE_TRANSLATION_KEYS,
  WEBHOOK_RECEIVING_STEPS,
  WEBHOOK_EXAMPLE_PAYLOAD,
} from "../libraries.constants"

import { CodeBlock } from "@/components/code-block"

const inlineCode = (
  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem] text-foreground" />
)

/** What the webhook is sent, grouped, with an example body and how to receive it. */
export function LibraryWebhookEvents() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">
          {t("libraries.webhooks.events_title")}
        </p>
        <div className="overflow-hidden rounded-lg border">
          {WEBHOOK_EVENT_GROUPS.map(({ key, events }) => (
            <section key={key} className="border-b last:border-b-0">
              <h4 className="bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {t(`libraries.webhooks.event_groups.${key}`)}
              </h4>
              <dl className="divide-y">
                {events.map((eventType) => (
                  <div
                    key={eventType}
                    className="grid gap-0.5 px-3 py-2 sm:grid-cols-[15rem_1fr] sm:gap-4"
                  >
                    <dt>
                      <code className="font-mono text-xs">{eventType}</code>
                    </dt>
                    <dd className="text-xs text-muted-foreground">
                      {t(
                        `libraries.webhooks.events.${WEBHOOK_EVENT_TYPE_TRANSLATION_KEYS[eventType]}`
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>

      <details className="group rounded-lg border">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
          {t("libraries.webhooks.example_title")}
        </summary>
        <div className="flex flex-col gap-2 px-3 pb-3">
          <p className="text-xs text-muted-foreground">
            {t("libraries.webhooks.example_description")}
          </p>
          <CodeBlock code={WEBHOOK_EXAMPLE_PAYLOAD} />
        </div>
      </details>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          {t("libraries.webhooks.receiving_title")}
        </p>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-xs text-muted-foreground">
          {WEBHOOK_RECEIVING_STEPS.map((step) => (
            <li key={step}>
              <Trans
                i18nKey={`libraries.webhooks.receiving.${step}`}
                components={{ code: inlineCode }}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
