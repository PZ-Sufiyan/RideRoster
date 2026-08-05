# Push notification server — deploy & troubleshoot

Public URL: `https://supabase.nst-sch.com/push-api` (nginx → `localhost:3100`)

## Quick health check

```bash
curl https://supabase.nst-sch.com/push-api/health
```

Expected: `{"ok":true,"service":"rideroster-push-notifications"}`

If you see **502 Bad Gateway**, nginx is up but the Node app is **not running** on port 3100.

---

## Deploy / update (from your Mac)

```bash
cd /path/to/RideRoster

scp server/push-notifications/*.js server/push-notifications/package*.json \
  USER@YOUR_SERVER:~/push-notifications/
```

On the server:

```bash
cd ~/push-notifications
cp .env.example .env   # first time only — then edit .env with real secrets
nano .env              # verify SUPABASE_*, FIREBASE_*, CORS_ORIGINS
npm install
pm2 start index.js --name rideroster-push || pm2 restart rideroster-push
pm2 save
pm2 logs rideroster-push --lines 50
```

Verify locally on the server:

```bash
curl http://127.0.0.1:3100/health
```

---

## After migrating to a new server

1. Copy `~/push-notifications/` (including `.env`) to the new host **or** redeploy from git + recreate `.env`.
2. Install Node 20+, `npm install`, start with pm2.
3. Update nginx on the new host to proxy `/push-api` → `http://127.0.0.1:3100` (strip `/push-api` prefix).
4. `curl https://supabase.nst-sch.com/push-api/health` must return OK before testing from the web app.

---

## Web app env

Production build must include:

```
VITE_PUSH_API_URL=https://supabase.nst-sch.com/push-api
```

Rebuild/redeploy the web app after changing this value.

---

## Mobile email confirmation

Flutter driver / PA self-registration Auth step:

```
POST https://supabase.nst-sch.com/push-api/auth/create-unconfirmed-mobile-user
{ "email", "password", "role": "driver"|"passenger_assistant", "userMetadata"?: {} }
```

Creates the Auth user with `email_confirm: false` (same as web Admin) and
sends the signup confirmation email. Set `APP_URL` in the server `.env`
so confirmation links land on `{APP_URL}/auth/confirmed?role=…`.

After deploying `emailConfirmation.js` + the updated `index.js`, restart pm2:

```
pm2 restart rideroster-push --update-env
```

### Mobile delete account

Flutter driver / PA Profile → Delete Account:

```
POST https://supabase.nst-sch.com/push-api/auth/delete-account
Authorization: Bearer <access_token>
```

Deletes the caller's profile rows and Auth user. After deploying
`deleteAccount.js` + the updated `index.js`, restart pm2:

```
pm2 restart rideroster-push --update-env
```

---

## CORS

`CORS_ORIGINS` in `.env` must include every admin URL, comma-separated, e.g.:

```
CORS_ORIGINS=http://localhost:5173,https://nst-sch.com,https://www.nst-sch.com,https://supabase.nst-sch.com
```

If CORS blocks a request, the browser shows **Failed to fetch** (same symptom as 502).

---

## Common pm2 crash causes

| Log message | Fix |
|-------------|-----|
| `Missing SUPABASE_URL...` | Fill `.env` on the server |
| `Missing Firebase service account` | Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| `EADDRINUSE :3100` | Another process on 3100 — `pm2 delete rideroster-push` and restart |
| Module not found | Run `npm install` in `~/push-notifications` |
