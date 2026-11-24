import { describe, expect, it } from '@jest/globals';

import { authErrorMessage, usernameErrorMessage } from '../errors';

describe('authErrorMessage', () => {
  it('ismert hibakódokat magyarul ad vissza', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('Hibás e-mail-cím vagy jelszó.');
    expect(authErrorMessage({ code: 'user_already_exists' })).toMatch(/már van fiók/);
  });

  it('hálózati hibát felismeri', () => {
    expect(authErrorMessage({ message: 'Network request failed' })).toMatch(/internetkapcsolat/);
  });

  it('ismeretlen hibára általános üzenetet ad', () => {
    expect(authErrorMessage({ code: 'valami_uj' })).toBe('Valami hiba történt. Próbáld újra.');
    expect(authErrorMessage(null)).toBe('Valami hiba történt. Próbáld újra.');
  });
});

describe('usernameErrorMessage', () => {
  it('foglalt név és formátumhiba', () => {
    expect(usernameErrorMessage({ code: '23505' })).toBe('Ez a felhasználónév már foglalt.');
    expect(usernameErrorMessage({ code: '23514' })).toMatch(/formátum/);
  });
});
