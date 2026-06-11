export function isSecretAuthorized(headers: Headers, secret?: string) {
  if (!secret) return false;

  const auth = headers.get("authorization");
  const headerSecret = headers.get("x-cron-secret");
  return auth === `Bearer ${secret}` || headerSecret === secret;
}
