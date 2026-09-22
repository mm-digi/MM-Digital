# MM Digital — client dashboard app

React Native (Expo) app for clients to check their live analytics dashboard on
iOS and Android. Talks to the same backend as the website
(`../MM-Digital` at the repo root) via token-based API routes under
`/api/mobile/*` — the website itself uses an httpOnly cookie for its login,
which a native app can't read, so the app gets a signed token back in the
login response instead and sends it as `Authorization: Bearer <token>` on
every request.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to run it on your phone, or press
`i` / `a` for a simulator/emulator if you have Xcode / Android Studio set up.

By default the app talks to production (`https://mm-digi.co.uk`). To point it
at a local `npm run dev` instance of the website instead, create `.env.local`
here with:

```
EXPO_PUBLIC_API_URL=http://<your-computer's-LAN-IP>:3000
```

(Use your machine's LAN IP, not `localhost` — a phone on the same Wi-Fi can't
reach `localhost` on your computer. `expo start` prints your LAN IP when it
starts.)

## What's built

- Login screen, calling `POST /api/mobile/login/`
- Dashboard screen (`POST` this week / this month stat tiles, campaign list),
  calling `GET /api/mobile/dashboard/`
- Token stored via `expo-secure-store` (the OS keychain), auto-redirect to
  login when signed out or the token is invalid/expired
- Pull-to-refresh on the dashboard

## What's not built yet

- **Charts** — the website's website/Facebook/Instagram/LinkedIn/ads trend
  charts aren't in the app yet, just the stat tiles and campaign list. Would
  add a native charting lib (e.g. `victory-native` or `react-native-svg`
  based) reading the same `series`/`seriesBySource` data the backend already
  returns from `getClientSnapshot`.
- **Channel breakdown tables** ("This week/month by channel") — same story,
  not ported over yet.
- **App icon / splash screen** — currently Expo's default placeholder
  (`assets/icon.png` etc.). Needs a square 1024×1024 logo mark from the
  brand assets to replace it.
- **Push notifications** — not set up. Would need `expo-notifications` plus a
  backend job to actually send them (e.g. "your weekly report is ready").

## Shipping to the App Store / Play Store

This app is built and signed with [EAS](https://docs.expo.dev/eas/), Expo's
cloud build service — no local Xcode or Android Studio needed, including for
iOS builds on a non-Mac machine.

1. `npx eas-cli login` (the Expo account is `mmdigital`)
2. `npx eas-cli build:configure`
3. `npx eas-cli build --platform all` — builds both the iOS `.ipa` and
   Android `.aab` in the cloud
4. `npx eas-cli submit --platform all` — uploads to App Store Connect / Play
   Console

Before step 3/4 you'll need, in your own Apple Developer and Google Play
Console accounts (these have to be set up by you — an Apple Developer
Program membership is ~$99/year, a Google Play Console account is a ~$25
one-time fee):

- An Apple Developer Program membership and an App Store Connect app record
- A Google Play Console developer account and an app record (Play Console
  also wants a signed privacy policy URL and a data-safety form before
  publishing)
- App Store / Play Store listing assets: screenshots, a description, a
  privacy policy page

`eas build` can generate the iOS signing certificate/provisioning profile
and the Android keystore for you interactively the first time you run it.
