import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

import {
  EMAIL_BRAND_NAME,
  EMAIL_FONTS,
  EMAIL_STYLES,
} from "../theme/email-styles"
import { EmailSeparator } from "./EmailSeparator"

import type { ReactNode } from "react"

type EmailAction = { label: string; url: string }

type EmailLayoutProps = {
  preview: string
  icon: ReactNode
  title: string
  intro: ReactNode
  action?: EmailAction
  /** Rendered as a plain link next to the main call to action. */
  secondaryAction?: EmailAction
  notice?: ReactNode
  footerNotice: ReactNode
}

/**
 * Shared shell of every transactional email: brand, icon, optional call to
 * action and its fallback link. Notifications without an action omit both.
 */
export function EmailLayout({
  preview,
  icon,
  title,
  intro,
  action,
  secondaryAction,
  notice,
  footerNotice,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <style>{`@import url('${EMAIL_FONTS.IMPORT_URL}');`}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body
          className="m-0 px-6 py-6"
          style={{
            backgroundColor: EMAIL_STYLES.muted,
            color: EMAIL_STYLES.foreground,
            fontFamily: EMAIL_FONTS.BODY,
          }}
        >
          <Container
            className="mx-auto w-full max-w-150"
            style={{
              backgroundColor: EMAIL_STYLES.card,
              border: `1px solid ${EMAIL_STYLES.border}`,
              borderRadius: EMAIL_STYLES.radius,
            }}
          >
            <Section className="p-12">
              <Section className="mb-12">
                <Heading
                  className="m-0 tracking-tight"
                  style={{
                    fontFamily: EMAIL_FONTS.HEADING,
                    color: EMAIL_STYLES.primary,
                    fontSize: "28px",
                    fontWeight: 700,
                    lineHeight: "1.2",
                  }}
                >
                  {EMAIL_BRAND_NAME}
                </Heading>
              </Section>

              <Section>
                <Section style={{ marginBottom: "18px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "9999px",
                      backgroundColor: EMAIL_STYLES.primarySoft,
                      color: EMAIL_STYLES.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {icon}
                  </div>
                </Section>

                <Heading
                  as="h2"
                  className="m-0"
                  style={{
                    color: EMAIL_STYLES.foreground,
                    fontFamily: EMAIL_FONTS.HEADING,
                    fontSize: "24px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    marginBottom: "12px",
                  }}
                >
                  {title}
                </Heading>

                <Text
                  className="m-0"
                  style={{
                    color: EMAIL_STYLES.foreground,
                    fontSize: "15px",
                    lineHeight: "1.6",
                    fontWeight: 300,
                    marginBottom: "20px",
                  }}
                >
                  {intro}
                </Text>

                {action && (
                  <Section style={{ marginBottom: "20px" }}>
                    <Button
                      href={action.url}
                      style={{
                        backgroundColor: EMAIL_STYLES.primary,
                        color: EMAIL_STYLES.primaryForeground,
                        borderRadius: EMAIL_STYLES.radius,
                        fontSize: "14px",
                        fontWeight: 500,
                        textDecoration: "none",
                        padding: "12px 16px",
                      }}
                    >
                      {action.label}
                    </Button>
                    {secondaryAction && (
                      <Link
                        href={secondaryAction.url}
                        style={{
                          color: EMAIL_STYLES.primary,
                          fontSize: "14px",
                          fontWeight: 500,
                          marginLeft: "16px",
                          textDecoration: "underline",
                        }}
                      >
                        {secondaryAction.label}
                      </Link>
                    )}
                  </Section>
                )}

                {(notice || action) && (
                  <EmailSeparator
                    color={EMAIL_STYLES.border}
                    marginTop={24}
                    marginBottom={24}
                  />
                )}

                {notice && (
                  <Section style={{ marginBottom: "18px" }}>
                    <Text
                      className="m-0"
                      style={{
                        color: EMAIL_STYLES.mutedForeground,
                        fontSize: "13px",
                        lineHeight: "1.6",
                        fontWeight: 400,
                      }}
                    >
                      {notice}
                    </Text>
                  </Section>
                )}

                {action && (
                  <Section
                    className="p-5"
                    style={{
                      backgroundColor: EMAIL_STYLES.muted,
                      borderRadius: EMAIL_STYLES.radius,
                    }}
                  >
                    <Text
                      className="m-0"
                      style={{
                        color: EMAIL_STYLES.mutedForeground,
                        fontSize: "13px",
                        lineHeight: "1.6",
                        fontWeight: 300,
                      }}
                    >
                      If the button above doesn&apos;t work, copy and paste this
                      link into your browser:
                    </Text>
                    <Link
                      href={action.url}
                      className="mt-2 block break-all"
                      style={{
                        color: EMAIL_STYLES.primary,
                        fontFamily: EMAIL_FONTS.MONO,
                        fontSize: "12px",
                        fontWeight: 400,
                        textDecoration: "none",
                      }}
                    >
                      {action.url}
                    </Link>
                  </Section>
                )}
              </Section>

              <EmailSeparator
                color={EMAIL_STYLES.border}
                marginTop={24}
                marginBottom={20}
              />

              <Section>
                <Text
                  className="m-0"
                  style={{
                    color: EMAIL_STYLES.mutedForeground,
                    fontSize: "13px",
                    fontWeight: 300,
                  }}
                >
                  © {new Date().getFullYear()} {EMAIL_BRAND_NAME}. All rights
                  reserved.
                </Text>
                <Text
                  className="mb-0"
                  style={{
                    color: EMAIL_STYLES.mutedForeground,
                    fontSize: "13px",
                    fontWeight: 300,
                    marginTop: "10px",
                  }}
                >
                  {footerNotice}
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
