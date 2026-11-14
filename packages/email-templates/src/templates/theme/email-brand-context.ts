import { createContext } from "react"

export type EmailBrand = {
  /** Absolute URL of the logo; email clients cannot resolve relative paths. */
  logoUrl: string
}

/** Defaults to the preview server's `static` folder; senders provide a hosted URL. */
export const EmailBrandContext = createContext<EmailBrand>({
  logoUrl: "/static/openstream-logo-email.png",
})
