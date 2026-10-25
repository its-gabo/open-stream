import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react"
import { match } from "ts-pattern"

type SubmitButtonIconProps = {
  isPending: boolean
}

export function SubmitButtonIcon({ isPending }: SubmitButtonIconProps) {
  return match(isPending)
    .with(true, () => <LoaderCircleIcon className="size-4 animate-spin" />)
    .with(false, () => <ArrowRightIcon className="size-4" />)
    .exhaustive()
}
