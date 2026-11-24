/** Supabase- és adatbázishibák magyar, felhasználónak szóló üzenetté alakítása. */

type ErrorLike = { code?: string | null; message?: string | null } | null | undefined;

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Hibás e-mail-cím vagy jelszó.',
  user_already_exists: 'Ezzel az e-mail-címmel már van fiók. Lépj be inkább.',
  email_exists: 'Ezzel az e-mail-címmel már van fiók. Lépj be inkább.',
  email_address_invalid: 'Ez az e-mail-cím nem tűnik érvényesnek.',
  validation_failed: 'Ellenőrizd az e-mail-címet és a jelszót.',
  weak_password: 'Túl gyenge a jelszó. Legalább 8 karakter legyen.',
  email_not_confirmed: 'Az e-mail-címed még nincs megerősítve. Nézd meg a postafiókodat.',
  over_email_send_rate_limit: 'Túl sok próbálkozás. Várj egy kicsit, és próbáld újra.',
  over_request_rate_limit: 'Túl sok próbálkozás. Várj egy kicsit, és próbáld újra.',
  signup_disabled: 'A regisztráció jelenleg nem elérhető.',
};

export function authErrorMessage(error: ErrorLike): string {
  if (error?.code && AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code];
  if (error?.message?.toLowerCase().includes('network')) {
    return 'Nincs internetkapcsolat, vagy a szerver nem érhető el.';
  }
  return 'Valami hiba történt. Próbáld újra.';
}

/** Felhasználónév mentésekor kapott adatbázishiba. */
export function usernameErrorMessage(error: ErrorLike): string {
  if (error?.code === '23505') return 'Ez a felhasználónév már foglalt.';
  if (error?.code === '23514') return 'Ez a felhasználónév nem megfelelő formátumú.';
  return 'Nem sikerült menteni. Próbáld újra.';
}
