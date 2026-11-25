# MyDiningMap – terv

iOS-app (később Android is), amiben a felhasználók összegyűjtik a kedvenc budapesti helyeiket,
megnézhetik a barátaik listáit, és közös programot szervezhetnek.

## 1. Funkciók

### Helyek
- Típusok: étterem, bár, kocsma, kávézó, pékség, cukrászda.
- Két lista: **Kipróbált** és **Kívánságlista**. A „✓ Voltam itt” gombbal egy hely a kívánságlistáról átkerül a kipróbáltak közé.
- Adatok: név, típus, cím, kerület, koordináta, konyha, értékelés (1–10), árszint (1–4), „visszamennék”, jegyzet, link.
- Felvétel címkereséssel vagy a térképen kijelölve. Az irányítószámból kitölti a kerületet.
- Térkép- és listanézet, keresés, szűrés típusra és konyhára, „csak ahová visszamennék”.
- Csak Budapest, egyelőre.

### Fotók
- Helyenként **legfeljebb 6 fotó**, a galériából (felvételkor és utólag szerkesztéskor is).
- Feltöltés előtt kicsinyítés (kb. 1600 px, JPEG) és külön bélyegkép (320 px).
- A listában az első fotó bélyegképe látszik, az adatlapon fotósáv, koppintásra teljes képernyős nézegető.
- Privát Supabase-tároló (`place-photos`), aláírt linkekkel; ugyanazok látják, akik a helyet is
  (tulajdonos, barátok, publikus profilnál bárki). A hely törlésekor a fotói is törlődnek.

### Profil és láthatóság
- Minden felhasználónak van egyedi **felhasználóneve** (pl. `@marcell`), megjelenített neve és profilképe.
- A profil láthatósága **privát** vagy **publikus**, bármikor átállítható.

| Ki látja a listákat (kipróbált + kívánságlista)? | |
|---|---|
| A tulajdonos | ✅ |
| A barátai | ✅ |
| Bárki más, ha a profil publikus | ✅ |
| Bárki más, ha a profil privát | ❌ csak a felhasználónév, a név és a kép látszik |

### Keresés és barátok
- Profilt csak a **pontos felhasználónévre** lehet megtalálni, kis- és nagybetűtől függetlenül. Ez publikus és privát profilra is így működik.
- Barátnak jelölés, majd a másik fél elfogadja vagy elutasítja. Utána kölcsönösen látják egymás listáit.
  Ha ketten egymást jelölik, automatikusan barátok lesznek.
- A barátság bármikor megszüntethető, az elküldött jelölés visszavonható.
- Külön **Barátok** fül: keresés, bejövő és elküldött jelölések, barátlista.
- Más felhasználó helyei a profiljánál látszanak, **listában** (térképnézet ott nincs). A **fő Térkép fülön csak a saját helyek** jelennek meg.
- Más felhasználó helyei csak adatbázis-függvényen át olvashatók (`get_profile_places`), így a publikus
  profilok helyei sem kérhetők le tömegesen.

### Események
- Eseményre **csak barátot** lehet meghívni. Publikus profilú, de nem barát felhasználót nem.
- A szervező **egy időpontot** ad meg, és **egy vagy több helyet** javasol.
- A hely bármi lehet: valakinek a listájáról vagy teljesen új hely címkereséssel.
- Ha több hely van, a meghívottak (és a szervező) **szavaznak**, a végső helyet a szervező választja ki.
- A meghívottak visszajelzése: jövök / talán / nem jövök.
- Ha az időpont nem jó, a meghívott **másik időpontot javasolhat**. A szervező dönti el, hogy módosítja-e.
- A szervező módosíthatja vagy lemondhatja az eseményt.

### Push-értesítések
Külön lépésben, az események után (saját fejlesztői build és Apple Developer fiók kell hozzá).
Addig az appon belül számláló jelzi az új barátjelöléseket.
- Valaki barátnak jelöl.
- Meghívást kapsz egy eseményre.
- (Javaslat, később: valaki elfogadta a barátkérésedet, másik időpontot javasoltak, megváltozott vagy lemondták az eseményt.)

### Kötelező App Store-elemek
- **Sign in with Apple** (kötelező, ha más közösségi bejelentkezés is van), mellette e-mailes belépés.
- **Fiók törlése az appon belül** (Apple-követelmény).
- Adatvédelmi tájékoztató.

## 2. Technológia

- **Expo (React Native) + TypeScript**, Expo Router a navigációhoz.
- **Térkép:** `react-native-maps`, iOS-en Apple Maps (ingyenes, nem kell hozzá kulcs).
- **Címkeresés:** az iOS beépített geokódolója (`expo-location`), szükség esetén Nominatim.
- **Backend: Supabase**
  - Auth: Apple és e-mail.
  - Postgres adatbázis, **sorszintű jogosultságokkal (RLS)**: a láthatósági szabályokat az adatbázis kényszeríti ki, nem csak az app.
  - Edge Function a push-értesítések küldésére (Expo Push szolgáltatáson keresztül).
- **Tesztelés:** Expo Go az iPhone-on, iOS-szimulátor a Macen. **Kiadás:** EAS Build → TestFlight → App Store.

## 3. Adatmodell (vázlat)

- `profiles`: id (= auth user), username (egyedi, kisbetűs), display_name, avatar_url, visibility (`private` | `public`), created_at
- `places`: id, owner_id, status (`visited` | `wishlist`), name, type, cuisine, address, district, lat, lng, rating, price, would_return, notes, url, created_at, updated_at
- `friendships`: requester_id, addressee_id, status (`pending` | `accepted`), created_at
- `events`: id, organizer_id, title, starts_at, note, chosen_option_id, status (`active` | `cancelled`), created_at
- `event_invitees`: event_id, user_id, response (`pending` | `going` | `maybe` | `declined`), suggested_time, comment
- `event_place_options`: id, event_id, name, address, lat, lng, source_place_id (ha valakinek a listájáról jött)
- `event_votes`: option_id, user_id
- `push_tokens`: user_id, token, platform

A helyek felhasználónként külön rekordok (nincs közös helykatalógus). Ez egyszerűbb, és később is
összevonhatók, ha kellene pl. „hány barátod járt már itt” funkció.

## 4. Képernyők

1. **Belépés / regisztráció**, utána felhasználónév választása.
2. **Térkép:** saját helyek pinekkel, szűrők.
3. **Lista:** Kipróbált / Kívánságlista fülek, keresés, szűrők.
4. **Hely felvétele / szerkesztése / részletei.**
5. **Barátok:** keresés felhasználónévre, beérkezett kérések, barátlista.
6. **Másik felhasználó profilja:** a listái térképen és listában (ha látható), barátnak jelölés gomb.
7. **Események:** lista (közelgő / korábbi), létrehozás, részletek (szavazás, visszajelzés, időpont-javaslat).
8. **Saját profil / beállítások:** név, kép, láthatóság, kijelentkezés, fiók törlése.

## 5. Fejlesztési szakaszok

Minden szakasz végén kipróbálható verzió lesz a telefonon.

1. **Alapok:** projektváz, Supabase-beállítás, belépés, profil és felhasználónév, helyek felvétele/szerkesztése/törlése,
   térkép és lista, kívánságlista, szűrők, a korábbi webapp 46 helyének áttöltése.
2. **Közösségi rész:** láthatóság, felhasználónév-keresés, barátjelölés, barátok és publikus profilok listáinak megtekintése.
3. **Események:** létrehozás, meghívás, helyszavazás, visszajelzés, időpont-javaslat.
3b. **Push-értesítések** (barátjelölés, eseménymeghívó) – fejlesztői build, Apple Developer fiók.
4. **Kiadás:** ikon, indítóképernyő, adatvédelmi tájékoztató, fióktörlés, TestFlight, App Store-beküldés.

## 6. Amire szükség lesz tőled

- **Supabase-fiók** (ingyenes kerettel indulhatunk).
- **Expo-fiók** (ingyenes) a buildekhez.
- **Apple Developer fiók** (évi 99 USD) a TestFlighthoz, az App Store-hoz, a push-értesítésekhez és a Sign in with Apple-höz.
  Az 1. szakasz ennél nélkül is elkészíthető és kipróbálható az Expo Go-val.

## 7. Megállapodások a munkáról

- Kód írása vagy bármilyen módosítás előtt Claude leírja a tervet, és csak jóváhagyás után kezd bele.
- Commit és push csak kérésre.
