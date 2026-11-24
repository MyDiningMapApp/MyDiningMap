/** A felhasználónév szabályai – egyezzenek az adatbázis `profiles_username_format` feltételével. */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
const USERNAME_PATTERN = /^[a-z0-9._]+$/;

/** Kisbetűsít és levágja a szóközöket, a kezdő @-ot is. */
export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

/** Magyar hibaüzenet, ha a (normalizált) név nem felel meg a szabályoknak; különben null. */
export function validateUsername(username: string): string | null {
  if (username.length === 0) return 'Add meg a felhasználónevet.';
  if (username.length < USERNAME_MIN) return `Legalább ${USERNAME_MIN} karakter legyen.`;
  if (username.length > USERNAME_MAX) return `Legfeljebb ${USERNAME_MAX} karakter lehet.`;
  if (!USERNAME_PATTERN.test(username)) {
    return 'Csak kisbetű (ékezet nélkül), szám, pont és aláhúzás lehet benne.';
  }
  return null;
}
