import { describe, expect, it } from '@jest/globals';

import { normalizeUsername, validateUsername } from '../username';

describe('normalizeUsername', () => {
  it('kisbetűsít, levágja a szóközöket és a kezdő @-ot', () => {
    expect(normalizeUsername('  @Marcell ')).toBe('marcell');
    expect(normalizeUsername('@@Anna.K')).toBe('anna.k');
  });
});

describe('validateUsername', () => {
  it('elfogadja a szabályos neveket', () => {
    for (const ok of ['abc', 'marcell', 'anna.k', 'joe_99', 'a'.repeat(30)]) {
      expect(validateUsername(ok)).toBeNull();
    }
  });

  it('elutasítja az üres, túl rövid és túl hosszú nevet', () => {
    expect(validateUsername('')).toMatch(/Add meg/);
    expect(validateUsername('ab')).toMatch(/Legalább 3/);
    expect(validateUsername('a'.repeat(31))).toMatch(/Legfeljebb 30/);
  });

  it('elutasítja a nem megengedett karaktereket', () => {
    for (const bad of ['kovács', 'two words', 'dash-name', 'Upper', 'emoji🍕']) {
      expect(validateUsername(bad)).toMatch(/Csak kisbetű/);
    }
  });

  it('ugyanazt fogadja el, mint az adatbázis szabálya', () => {
    const dbPattern = /^[a-z0-9._]{3,30}$/;
    for (const s of ['abc', 'ab', 'a.b_c', 'ÁRVÍZ', 'x'.repeat(31), 'ok_name.1']) {
      expect(validateUsername(s) === null).toBe(dbPattern.test(s));
    }
  });
});
