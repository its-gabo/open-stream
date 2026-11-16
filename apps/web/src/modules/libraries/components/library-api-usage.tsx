import { Badge } from "@workspace/ui/components/badge"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { TerminalIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { LIBRARY_API_KEY_SCOPE_TRANSLATION_KEYS } from "../libraries.constants"
import {
  buildLibraryApiExamples,
  buildLibraryApiSetup,
} from "../libraries.utils"

import { CodeBlock } from "@/components/code-block"

type LibraryApiUsageProps = {
  apiUrl: string
}

/** The API workflow one step at a time: set the URL and key once, then a short request per step. */
export function LibraryApiUsage({ apiUrl }: LibraryApiUsageProps) {
  const { t } = useTranslation()
  const examples = buildLibraryApiExamples(apiUrl)

  return (
    <section className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TerminalIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.api.usage.title")}</CardTitle>
          <CardDescription>
            {t("libraries.api.usage.description")}
          </CardDescription>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm font-medium">{t("libraries.api.usage.setup")}</p>
        <CodeBlock code={buildLibraryApiSetup(apiUrl)} />
      </div>
      <Tabs defaultValue={examples[0].key} className="min-w-0">
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {examples.map(({ key }, index) => (
            <TabsTrigger key={key} value={key} className="flex-none">
              {index + 1}. {t(`libraries.api.usage.steps.${key}.label`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {examples.map(({ key, scope, code }) => (
          <TabsContent
            key={key}
            value={key}
            className="flex min-w-0 flex-col gap-2 pt-2"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{t(`libraries.api.usage.steps.${key}.description`)}</span>
              {scope && (
                <Badge variant="outline">
                  {t(
                    `libraries.api.scopes.${LIBRARY_API_KEY_SCOPE_TRANSLATION_KEYS[scope]}.label`
                  )}
                </Badge>
              )}
            </div>
            <CodeBlock code={code} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
