import { EmailLayout } from "./components/EmailLayout"
import { EMAIL_BRAND_NAME } from "./theme/email-styles"

export type ResetPasswordEmailProps = {
  email: string
  name: string
  resetUrl: string
  expiresInMinutes: number
}

export default function ResetPasswordEmail({
  email,
  name,
  resetUrl,
  expiresInMinutes,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      preview={`Reset your ${EMAIL_BRAND_NAME} password.`}
      title="Reset Your Password"
      intro={`Hi ${name}, we received a request to reset your password. Use the button below to set a new one.`}
      action={{ label: "Reset Password", url: resetUrl }}
      notice={`This reset link will expire in ${expiresInMinutes} minutes. If you didn't request a password reset, you can safely ignore this email.`}
      footerNotice={`This email was sent to ${email} because you have an account with ${EMAIL_BRAND_NAME}.`}
    />
  )
}

ResetPasswordEmail.PreviewProps = {
  email: "ada@example.com",
  name: "Ada",
  resetUrl:
    "http://localhost:3000/reset-password?token=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  expiresInMinutes: 30,
} satisfies ResetPasswordEmailProps
