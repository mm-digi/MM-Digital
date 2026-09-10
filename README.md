# MM Digital

Next.js rebuild of [mm-digi.co.uk](https://mm-digi.co.uk/) for Vercel.

Public pages use the original WordPress layouts. Client dashboards sit behind username + password login. Passwords are stored as bcrypt hashes only.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Production

Set `AUTH_SECRET` in the Vercel project, deploy from this GitHub repository, then point `mm-digi.co.uk` DNS at Vercel.
