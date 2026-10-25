import { emailTemplateFactory } from "./email-factory"
import OrganizationNotificationEmailTemplate from "./templates/OrganizationNotificationEmail"
import ResetPasswordEmailTemplate from "./templates/ResetPasswordEmail"
import WelcomeVerifyEmailTemplate from "./templates/WelcomeVerifyEmail"

export type { EmailContent } from "./email-content.types"
export type { OrganizationNotificationEmailProps } from "./templates/OrganizationNotificationEmail"
export type { ResetPasswordEmailProps } from "./templates/ResetPasswordEmail"
export type { WelcomeVerifyEmailProps } from "./templates/WelcomeVerifyEmail"

export { ORGANIZATION_EMAIL_KINDS } from "./templates/OrganizationNotificationEmail"

export const WelcomeVerifyEmail = emailTemplateFactory(
  WelcomeVerifyEmailTemplate
)
export const ResetPasswordEmail = emailTemplateFactory(
  ResetPasswordEmailTemplate
)
export const OrganizationNotificationEmail = emailTemplateFactory(
  OrganizationNotificationEmailTemplate
)
