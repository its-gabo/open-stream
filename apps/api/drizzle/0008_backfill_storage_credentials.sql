-- Moves the encrypted storage credentials from their six columns into one value, shaped like the webhook signing secret.
UPDATE "storages" SET "credentials" = jsonb_build_object(
  'ciphertext', "credentials_ciphertext",
  'iv', "credentials_iv",
  'tag', "credentials_tag",
  'encryptedKey', "credentials_encrypted_key",
  'keyIv', "credentials_key_iv",
  'keyTag', "credentials_key_tag"
);
