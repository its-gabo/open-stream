import { useTranslation } from "react-i18next"

import type { ActivityLog } from "@/api/generated-api"
import { formatActivityValue } from "../activity.utils"

type ActivityChangesProps = {
  activity: ActivityLog
}

/** The fields an activity changed, each with its value before and after, then any context. */
export function ActivityChanges({ activity }: ActivityChangesProps) {
  const { t } = useTranslation()
  const fields = [
    ...new Set([
      ...Object.keys(activity.before ?? {}),
      ...Object.keys(activity.after ?? {}),
    ]),
  ]
  const context = Object.entries(activity.context)

  return (
    <div className="flex flex-col gap-3 text-xs">
      {fields.length > 0 && (
        <table className="w-full table-fixed">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="w-1/4 pb-1 font-medium">
                {t("activity.changes.field")}
              </th>
              <th className="pb-1 font-medium">
                {t("activity.changes.before")}
              </th>
              <th className="pb-1 font-medium">
                {t("activity.changes.after")}
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {fields.map((field) => (
              <tr key={field} className="align-top">
                <td className="py-0.5 pr-2 break-words">{field}</td>
                <td className="py-0.5 pr-2 break-all text-destructive">
                  {formatActivityValue(activity.before?.[field])}
                </td>
                <td className="py-0.5 break-all text-primary">
                  {formatActivityValue(activity.after?.[field])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {context.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {context.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="font-mono break-all">
                {formatActivityValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-muted-foreground">
        {[activity.ipAddress, activity.userAgent].filter(Boolean).join(" · ") ||
          t("activity.changes.no_source")}
      </p>
    </div>
  )
}
