import { TUS_VERSION } from "@workspace/shared"

import { API_BASE_PATH } from "../../src/common/http/http.constants"
import { encodeTusMetadata } from "./video-files"

import type { ApiClient } from "./api-client"

const TUS_PATCH_CONTENT_TYPE = "application/offset+octet-stream"

/** tus requests against one video's upload endpoint, as tus-js-client sends them. */
export function createTusClient(client: ApiClient, videoPath: string) {
  const toApiPath = (location: string) => location.slice(API_BASE_PATH.length)

  const create = (
    uploadLength: number,
    fileName: string,
    headers: Record<string, string> = {}
  ) =>
    client.request(`${videoPath}/uploads`, {
      method: "POST",
      headers: {
        "tus-resumable": TUS_VERSION,
        "upload-length": String(uploadLength),
        "upload-metadata": encodeTusMetadata({ filename: fileName }),
        ...headers,
      },
    })

  const head = (location: string) =>
    client.request(toApiPath(location), {
      method: "HEAD",
      headers: { "tus-resumable": TUS_VERSION },
    })

  const patch = (
    location: string,
    uploadOffset: number,
    bytes: Uint8Array<ArrayBuffer>
  ) =>
    client.request(toApiPath(location), {
      method: "PATCH",
      rawBody: bytes,
      headers: {
        "tus-resumable": TUS_VERSION,
        "upload-offset": String(uploadOffset),
        "content-type": TUS_PATCH_CONTENT_TYPE,
        "content-length": String(bytes.byteLength),
      },
    })

  const terminate = (location: string) =>
    client.request(toApiPath(location), {
      method: "DELETE",
      headers: { "tus-resumable": TUS_VERSION },
    })

  /** Creates the upload and sends `bytes` in `chunkSize` chunks; returns the last response. */
  const upload = async (
    bytes: Uint8Array<ArrayBuffer>,
    fileName: string,
    chunkSize: number
  ) => {
    const created = await create(bytes.byteLength, fileName)
    const location = created.headers.get("location")

    if (!location) return created

    let response = created

    for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
      response = await patch(
        location,
        offset,
        bytes.subarray(offset, offset + chunkSize)
      )

      if (response.status !== 204) return response
    }

    return response
  }

  return { create, head, patch, terminate, upload }
}

export const requireLocation = (response: Response) => {
  const location = response.headers.get("location")

  if (!location) throw new Error(`No upload location (${response.status})`)

  return location
}
