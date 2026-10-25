import { useRouter } from "@tanstack/react-router"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { CircleXIcon, RotateCwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

export function RouteError() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-4 px-4">
      <Alert variant="destructive">
        <CircleXIcon />
        <AlertTitle>{t("errors.route.title")}</AlertTitle>
        <AlertDescription>{t("errors.route.description")}</AlertDescription>
      </Alert>
      <Button variant="outline" onClick={() => void router.invalidate()}>
        {t("errors.route.retry")}
        <RotateCwIcon className="size-4" />
      </Button>
    </main>
  )
}
