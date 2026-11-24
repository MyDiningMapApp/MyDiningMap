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

## Felépítés

- `src/app/` – képernyők (Expo Router: minden fájl egy képernyő)
- `src/components/` – újrahasználható felületi elemek
- `src/constants/`, `src/hooks/` – téma, segédfüggvények
- `.env` – a Supabase-projekt címe és publishable kulcsa (a secret kulcs soha nem kerül ide)
