#!/bin/sh
# Creates the default video bucket in the local RustFS server; safe to run on every start.
set -eu

: "${OBJECT_STORAGE_ENDPOINT:?OBJECT_STORAGE_ENDPOINT is required}"
: "${OBJECT_STORAGE_BUCKET:?OBJECT_STORAGE_BUCKET is required}"

export AWS_ACCESS_KEY_ID="${OBJECT_STORAGE_ACCESS_KEY_ID:?OBJECT_STORAGE_ACCESS_KEY_ID is required}"
export AWS_SECRET_ACCESS_KEY="${OBJECT_STORAGE_SECRET_ACCESS_KEY:?OBJECT_STORAGE_SECRET_ACCESS_KEY is required}"
export AWS_DEFAULT_REGION="${OBJECT_STORAGE_REGION:-us-east-1}"

s3api() {
  aws --endpoint-url "$OBJECT_STORAGE_ENDPOINT" s3api "$@"
}

if s3api head-bucket --bucket "$OBJECT_STORAGE_BUCKET" >/dev/null 2>&1; then
  echo "Bucket '$OBJECT_STORAGE_BUCKET' already exists"
else
  s3api create-bucket --bucket "$OBJECT_STORAGE_BUCKET"
  echo "Bucket '$OBJECT_STORAGE_BUCKET' created"
fi

# Abandoned uploads leave multipart parts behind; let the server clean them up.
s3api put-bucket-lifecycle-configuration \
  --bucket "$OBJECT_STORAGE_BUCKET" \
  --lifecycle-configuration '{"Rules":[{"ID":"abort-incomplete-uploads","Status":"Enabled","Filter":{"Prefix":""},"AbortIncompleteMultipartUpload":{"DaysAfterInitiation":2}}]}' \
  && echo "Incomplete multipart uploads expire after 2 days" \
  || echo "Could not set the lifecycle rule; incomplete uploads are kept"
