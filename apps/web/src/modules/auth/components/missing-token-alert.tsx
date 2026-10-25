import { Alert, AlertDescription } from "@workspace/ui/components/alert"

type MissingTokenAlertProps = {
  message: string
}

export function MissingTokenAlert({ message }: MissingTokenAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
