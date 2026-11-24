# MyDiningMap

iOS-app a kedvenc budapesti helyeid (éttermek, bárok, kocsmák, kávézók, pékségek) gyűjtésére,
barátokkal és közös eseményekkel. Expo (React Native) + Supabase.

A terv: [docs/PLAN.md](docs/PLAN.md).

## Futtatás a Macen

Egyszer kell:

1. Telepítsd a [Node.js](https://nodejs.org) LTS verzióját.
2. Telepítsd az iPhone-odra az **Expo Go** appot az App Store-ból.

Utána a repó mappájában:

```bash
npm install
```

```bash
npx expo start
```

Megjelenik egy QR-kód a terminálban. Olvasd be az iPhone kamerájával, és az app megnyílik az Expo Go-ban.
A Mac és az iPhone legyen ugyanazon a Wi-Fi-hálózaton. Az `i` billentyűvel az iOS-szimulátorban is elindul
(ehhez Xcode kell).

## Hasznos parancsok

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

## Felépítés

- `src/app/` – képernyők (Expo Router: minden fájl egy képernyő)
- `src/components/` – újrahasználható felületi elemek
- `src/lib/` – Supabase-kliens, ellenőrző és segédfüggvények (tesztekkel)
- `src/providers/` – közös állapot (pl. bejelentkezés)
- `src/constants/`, `src/hooks/` – téma, hookok
- `.env` – a Supabase-projekt címe és publishable kulcsa (a secret kulcs soha nem kerül ide)

## Adatbázis (Supabase)

Az adatbázis szerkezete a `supabase/migrations/` mappában van, időrendben számozott SQL-fájlokban.
Új migrációt a Supabase felületén futtatunk le: **SQL Editor → New query**, bemásolod a fájl tartalmát, **Run**.
Minden fájlt csak egyszer, a sorrendjükben kell lefuttatni.
