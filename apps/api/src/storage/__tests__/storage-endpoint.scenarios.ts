export const PUBLIC_ENDPOINTS = [
  "https://s3.eu-central-1.amazonaws.com",
  "https://account.r2.cloudflarestorage.com",
  "https://8.8.8.8",
] as const

export const PRIVATE_ENDPOINTS = [
  { description: "plain HTTP", endpoint: "http://s3.example.com" },
  { description: "localhost", endpoint: "https://localhost:9000" },
  { description: "a .localhost name", endpoint: "https://rustfs.localhost" },
  { description: "a .internal name", endpoint: "https://minio.internal" },
  { description: "a loopback address", endpoint: "https://127.0.0.1" },
  { description: "a 10/8 address", endpoint: "https://10.1.2.3" },
  { description: "a 172.16/12 address", endpoint: "https://172.20.0.5" },
  { description: "a 192.168/16 address", endpoint: "https://192.168.1.10" },
  {
    description: "the cloud metadata address",
    endpoint: "https://169.254.169.254",
  },
  { description: "IPv6 loopback", endpoint: "https://[::1]" },
  {
    description: "an IPv6 unique local address",
    endpoint: "https://[fd00::1]",
  },
  {
    description: "an IPv4-mapped private address",
    endpoint: "https://[::ffff:10.0.0.1]",
  },
  {
    description: "credentials in the URL",
    endpoint: "https://user:pass@s3.example.com",
  },
  { description: "another protocol", endpoint: "ftp://s3.example.com" },
] as const
