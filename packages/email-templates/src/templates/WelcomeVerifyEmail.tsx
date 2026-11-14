import { EmailLayout } from "./components/EmailLayout"
import { EMAIL_BRAND_NAME } from "./theme/email-styles"

export type WelcomeVerifyEmailProps = {
  email: string
  name: string
  verificationUrl: string
  expiresInHours: number
}

export default function WelcomeVerifyEmail({
  email,
  name,
  verificationUrl,
  expiresInHours,
}: WelcomeVerifyEmailProps) {
  return (
    <EmailLayout
      preview={`Verify your ${EMAIL_BRAND_NAME} email address.`}
      title="Verify Your Email Address"
      intro={`Welcome, ${name}! Thank you for signing up for ${EMAIL_BRAND_NAME}. To complete your registration and start using your account, please verify your email address.`}
      action={{ label: "Verify Email Address", url: verificationUrl }}
      notice={`This verification link will expire in ${expiresInHours} hours. If you didn't create an account with ${EMAIL_BRAND_NAME}, you can safely ignore this email.`}
      footerNotice={`This email was sent to ${email} because an account was created with ${EMAIL_BRAND_NAME}.`}
    />
  )
}

WelcomeVerifyEmail.PreviewProps = {
  email: "ada@example.com",
  name: "Ada",
  verificationUrl:
    "http://localhost:3000/verify-email?token=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  expiresInHours: 24,
} satisfies WelcomeVerifyEmailProps
