export type EmailContent = {
  getText: () => Promise<string>
  getHtml: () => Promise<string>
}
