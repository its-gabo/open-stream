export type FormFieldSelectOption = {
  label: string
  value: string
}

export type FormFieldType = {
  name: string
  label?: string
  placeholder?: string
  type?: "text" | "email" | "password" | "select"
  autoComplete?: string
  /** For `select` fields. */
  options?: FormFieldSelectOption[]
  searchPlaceholder?: string
  emptyMessage?: string
}
