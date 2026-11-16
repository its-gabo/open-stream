import { ACTIVITY_ACTOR_KINDS } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  BotIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  UserIcon,
  UserXIcon,
} from "lucide-react"
import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { ACTIVITY_ACTION_TRANSLATION_KEYS } from "../activity.constants"
import { ActivityChanges } from "./activity-changes"

import type { ActivityLog } from "@/api/generated-api"

type ActivityTableProps = {
  activities: ActivityLog[]
}

function ActorIcon({ kind }: { kind: ActivityLog["actor"]["kind"] }) {
  const className = "size-3.5 shrink-0 text-muted-foreground"

  return match(kind)
    .with(ACTIVITY_ACTOR_KINDS.USER, () => <UserIcon className={className} />)
    .with(ACTIVITY_ACTOR_KINDS.API_KEY, () => (
      <KeyRoundIcon className={className} />
    ))
    .with(ACTIVITY_ACTOR_KINDS.ANONYMOUS, () => (
      <UserXIcon className={className} />
    ))
    .with(ACTIVITY_ACTOR_KINDS.SYSTEM, () => <BotIcon className={className} />)
    .exhaustive()
}

/** Activity entries, newest first; each expands to the values it changed and where it came from. */
export function ActivityTable({ activities }: ActivityTableProps) {
  const { t, i18n } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date(value))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-0 pr-0 pl-2 sm:pl-3" />
          <TableHead>{t("activity.columns.action")}</TableHead>
          <TableHead>{t("activity.columns.resource")}</TableHead>
          <TableHead>{t("activity.columns.actor")}</TableHead>
          <TableHead className="pr-4 sm:pr-5">
            {t("activity.columns.when")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity) => {
          const isExpanded = expandedId === activity.id

          return (
            <Fragment key={activity.id}>
              <TableRow>
                <TableCell className="w-0 pr-0 pl-2 sm:pl-3">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-expanded={isExpanded}
                    aria-label={t("activity.toggle_details")}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : activity.id)
                    }
                  >
                    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {t(
                      `activity.actions.${ACTIVITY_ACTION_TRANSLATION_KEYS[activity.action]}`
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-56 items-center gap-2">
                    <Badge variant="secondary" className="shrink-0">
                      {t(`activity.resource_types.${activity.resource.type}`)}
                    </Badge>
                    <span
                      className="truncate text-sm"
                      title={activity.resource.label ?? undefined}
                    >
                      {activity.resource.label ?? activity.resource.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-64 items-center gap-1.5 text-sm">
                    <ActorIcon kind={activity.actor.kind} />
                    <span className="truncate">{activity.actor.label}</span>
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground sm:pr-5">
                  {formatDateTime(activity.createdAt)}
                </TableCell>
              </TableRow>
              {isExpanded && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell className="w-0 pr-0 pl-2 sm:pl-3" />
                  <TableCell
                    colSpan={4}
                    className="pr-4 whitespace-normal sm:pr-5"
                  >
                    <ActivityChanges activity={activity} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
