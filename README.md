# MM Digital

Next.js rebuild of [mm-digi.co.uk](https://mm-digi.co.uk/) for Vercel.

Client dashboards stay behind username + password login. Existing client passwords are stored as bcrypt hashes only — never as plaintext in this repo.

## Local

```bash
cp .env.example .env.local
# set AUTH_SECRET to a long random string
npm install
npm run dev
```

## Production

Set `AUTH_SECRET` in the Vercel project, then deploy from this GitHub repository.

After go-live, point `mm-digi.co.uk` DNS at Vercel.
