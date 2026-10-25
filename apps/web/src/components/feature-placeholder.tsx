import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ClockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

type FeaturePlaceholderProps = {
  titleKey: string
}

export function FeaturePlaceholder({ titleKey }: FeaturePlaceholderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
      <Card className="w-full max-w-xl border-dashed bg-background/80 shadow-none">
        <CardHeader className="flex flex-col items-center text-center">
          <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClockIcon className="size-5" />
          </span>
          <CardTitle className="font-heading text-xl">{t(titleKey)}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm leading-6 text-muted-foreground">
          {t("pages.placeholder.description")}
        </CardContent>
      </Card>
    </div>
  )
}
