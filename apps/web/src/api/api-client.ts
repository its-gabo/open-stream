import { OpenStreamApi } from "./generated-api"

/** Empty by default: requests stay on the page's origin, where the reverse proxy forwards `/api/*`. */
export const API_URL = import.meta.env.VITE_API_URL ?? ""

export const apiClient = new OpenStreamApi({
  baseUrl: API_URL,
  baseApiParams: { credentials: "include" },
})
