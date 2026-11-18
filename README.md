# Zuzu Town / זוזו טאון

Original kids role-play "digital dollhouse" game (ages 4-8), Hebrew + English.
Web game (Vite + TypeScript + Canvas) wrapped with Capacitor for Android and iOS.

All art, sound and music are original and generated from code (SVG + Web Audio).
No ads, no analytics, no third-party data collection. One non-consumable in-app purchase
(`full_town`) unlocks the Bakery and the Vet Clinic.

## Develop
```
npm install
npm run dev        # http://localhost:5173  (?loc=park  ?scene=map  ?unlock=1)
npm test
npm run build
```

## Native
```
npx cap sync
```
Android and iOS builds run in GitHub Actions (see `.github/workflows`).

© All rights reserved. Not open source.
