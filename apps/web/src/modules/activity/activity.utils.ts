/** A changed value as one short line; a dash when there is none. */
export const formatActivityValue = (value: unknown) =>
  value === null || value === undefined ? "—" : JSON.stringify(value)
