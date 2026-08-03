# iTrustLD Admin

Separate Next.js admin portal for iTrustLD.

**Linux deployment:** see [`deploy/README.md`](../../deploy/README.md).

## Run

```bash
cd "admin side"
npm install
npm run dev
```

Open [http://localhost:3001/login](http://localhost:3001/login)

## Admin auth

Staff sign-in uses the Express API (`ITrustLD_Backend`), same `users` table and Spatie roles as Laravel.

1. Copy `ITrustLD_Admin/.env.local.example` → `.env.local`
2. Run the backend on port 4000
3. Sign in at `/login` with a system user (e.g. seeded `admin@itrustld.com` — see `ITrustLD_Existing/database/seeders/SystemUserSeeder.php`)

Role-based redirect after login matches Laravel `AuthenticatedSessionController` (dashboard, pending users, deposit/withdrawal queues).

