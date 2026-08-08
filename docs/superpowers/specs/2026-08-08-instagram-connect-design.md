# Connect to Instagram — Design

Date: 2026-08-08
Status: Approved (pending user's final read-through)

## Goal

Let a logged-in Montez user connect their own Instagram professional account
(Business or Creator) so the backend can call the Instagram Graph API on their
behalf later (insights, demographics, media, etc.).

This is **not** a login/sign-up method. Login stays limited to email+password
and Google. Connecting Instagram must never create a session or a new user.

## Chosen Meta flow

Meta offers two different OAuth products for reaching an Instagram account:

1. **Login with Facebook (Facebook Login for Business)** — sign in with a
   Facebook user, then look up that user's Facebook Pages and find the one
   with a linked `instagram_business_account`. Requires a page-selection step
   when a user owns multiple eligible Pages.
2. **Instagram API with Instagram Login** — the user authorizes directly from
   `instagram.com/oauth/authorize`. No Facebook Page concept at all; one
   authorization always maps to exactly one Instagram account.

**Decision: use (2), Instagram API with Instagram Login.** No Page-selection
step is needed. (Earlier scaffolding in `.env.example`/schema comments —
`META_REDIRECT_URI` described as `/api/auth/facebook/callback`, the
`meta_ig_business_id` column name — assumed flow (1). Both flows are still
served by the same `provider` = `"meta"` credential row and the same
`meta_ig_business_id` column (it now holds the Instagram-scoped user id
returned directly by `/me`, rather than a Page-derived id), so no schema
migration is required. The actual redirect path better-auth registers is
`/api/auth/oauth2/callback/instagram`, not `/api/auth/facebook/callback` —
`META_REDIRECT_URI` must be updated to match when implemented.)

Reference implementation studied for validation (not taken as a dependency):
[`better-auth-instagram`](https://github.com/rajatsandeepsen/better-auth-instagram),
a thin wrapper around better-auth's own `generic-oauth` plugin targeting this
same Meta product.

## Mechanism: better-auth `generic-oauth` plugin

Better-auth ships two different OAuth surfaces:

- `socialProviders` (used today for Google) — built for **login**. Its
  account-linking endpoint (`/link-social`) still enforces that the linked
  provider's email matches the current user's email, unless the provider is
  listed in `trustedProviders`.
- plugin **`generic-oauth`** — built for "connect a third-party account for
  API access," not login. Its link endpoint (`/oauth2/link`) only requires
  `account.accountLinking.allowDifferentEmails: true` to tolerate a
  non-matching email; it does not have the `trustedProviders` gate. Its
  sign-in endpoint (`/sign-in/oauth2`) is a distinct route from
  `/sign-in/social`, so a custom `providerId` here can never collide with the
  existing Google login path.

**Decision:** use `generic-oauth` with a custom `providerId: "instagram"`
(not the native `facebook` provider — keeps this fully separate from any
future "real" Facebook login and avoids the `trustedProviders` change that
approach would need).

**Config is hand-written in `auth.ts`**, not via the `better-auth-instagram`
npm package. The package saves ~15–20 lines of provider config; we still have
to write the long-lived-token exchange and the domain-table sync ourselves
either way, so owning the config directly avoids a third-party runtime
dependency for something this small.

### `auth.ts` changes

```ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ['google'], // unchanged
    allowDifferentEmails: true,   // NEW — Instagram's email never matches the Montez login email
  },
},
plugins: [
  bearer(),
  jwt({ /* unchanged */ }),
  genericOAuth({
    config: [{
      providerId: 'instagram',
      clientId: env.META_APP_ID ?? '',
      clientSecret: env.META_APP_SECRET ?? '',
      authorizationUrl: 'https://www.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      userInfoUrl:
        'https://graph.instagram.com/me?fields=id,username,name,account_type,profile_picture_url,followers_count,follows_count,biography,website',
      scopes: ['instagram_business_basic', 'instagram_business_manage_insights'],
      redirectURI: env.META_REDIRECT_URI,
      // better-auth requires a resolvable, non-empty email for every linked
      // account even though we never use it — Instagram's API doesn't return
      // one, so this placeholder only exists to satisfy that requirement.
      mapProfileToUser: (p) => ({ email: `${p.id}@instagram.placeholder`, name: p.username }),
    }],
  }),
],
databaseHooks: {
  account: {
    create: { after: async (account) => { if (account.providerId === 'instagram') await syncInstagramAccount(account) } },
    update: { after: async (account) => { if (account.providerId === 'instagram') await syncInstagramAccount(account) } },
  },
},
```

`syncInstagramAccount` lives in the new module (see below) and is where the
short-lived → long-lived token exchange and the `social_accounts` /
`account_credentials` upsert happen — triggered automatically by better-auth
right after it persists the linked account, regardless of what happens to the
browser redirect afterward.

Update `.env.example` comment for `META_REDIRECT_URI` to point at
`/api/auth/oauth2/callback/instagram` instead of `/api/auth/facebook/callback`.

## New module: `src/modules/social-accounts/`

Follows the existing `routes/controller/service/schema/types` split used by
`users`. Mounted at `/api/social-accounts`.

| Endpoint | Auth | Behavior |
|---|---|---|
| `POST /social-accounts/instagram/connect` | `requireAuth` | Resolves a better-auth session token for the current user (see below), calls `auth.api.oAuth2LinkAccount({ providerId: 'instagram', callbackURL, errorCallbackURL })`, returns `{ url }` for the frontend to redirect the browser to. |
| `GET /social-accounts` | `requireAuth` | Lists the current user's `social_accounts` rows with a derived `connected: boolean` (whether a matching `account_credentials` row exists). Never returns the access token. |
| `DELETE /social-accounts/:id/instagram` | `requireAuth` | Ownership check, then `auth.api.unlinkAccount({ providerId: 'instagram', accountId: credential.metaIgBusinessId })`, then deletes the `account_credentials` row. `social_accounts` and historical `posts`/`audits` rows are left intact — disconnecting revokes API access, not history. |

### Full flow

1. Frontend calls `connect` → receives the Instagram authorization URL →
   redirects the browser.
2. User authorizes on `instagram.com` → Instagram redirects to better-auth's
   own `/api/auth/oauth2/callback/instagram` (this exact URL is what gets
   registered as the Redirect URI in the Meta Developer Console; Instagram
   requires HTTPS on a real domain, so local development needs a tunnel).
3. Better-auth exchanges the code for a token and stores it (encrypted) in
   its own `account` table, then invokes the `databaseHooks.account.create.after`
   hook, which calls `syncInstagramAccount`:
   - exchange the short-lived token for a 60-day long-lived one via
     `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token`
     (better-auth has no built-in support for this — Instagram doesn't use
     the standard OAuth `refresh_token` grant, so this step is always custom
     code regardless of provider mechanism chosen),
   - fetch the profile fields already listed in `userInfoUrl`,
   - `upsert` into `social_accounts` (keyed on `userId + platform + username`)
     and `account_credentials` (keyed on `accountId`, storing the long-lived
     token in plaintext per the existing owner decision, and the Instagram
     user id in `meta_ig_business_id`).
   - Any failure here is caught and logged; no partial `social_accounts`/
     `account_credentials` row is created. The frontend finds out by simply
     not seeing the account appear in `GET /social-accounts`.
4. Better-auth redirects the browser to the `callbackURL` the frontend
   originally supplied (a frontend page, e.g. `/settings/integrations`).

### Bridging the app's JWT auth to better-auth's session requirement

`oAuth2LinkAccount` and `unlinkAccount` both require a real better-auth
session (resolved via cookie or `Authorization: Bearer <sessionToken>` through
the `bearer()` plugin) — not the app's own JWT that `requireAuth` verifies.
Since the controller only has `currentUserId(c)` from the JWT, it looks up
that user's most recent non-expired row in the `session` table and calls the
better-auth API with `headers: new Headers({ authorization: \`Bearer ${session.token}\` })`.
This mirrors the existing `withJwt()` pattern in `auth.helper.ts`, which
already does the same kind of manual bearer-header construction to call a
better-auth API method server-side.

## Error handling

- `META_APP_ID` / `META_APP_SECRET` unset → `connect` returns `503`
  (`"Instagram connect is not configured."`), matching the existing
  `loginGoogle` pattern for `GOOGLE_CLIENT_ID`.
- Long-lived token exchange or profile fetch fails inside the hook → caught,
  logged, no domain rows written (see step 3 above).
- Reconnecting the same Instagram account → upserts (updates token/profile),
  does not duplicate, consistent with the existing unique index on
  `social_accounts`.
- Disconnecting an account that isn't the caller's, or that has no
  credential → `404`.
- Instagram account not eligible (not a Professional account, or not added as
  an Instagram Tester while the Meta app is pre-review) → Instagram itself
  blocks the authorization and better-auth redirects to `errorCallbackURL`;
  this is an operational/setup concern, not something the code needs to
  branch on.

## Testing

- Unit test `syncInstagramAccount` (token exchange + profile mapping +
  upsert) with a mocked fetch boundary; assert a failed exchange leaves no
  partial row.
- Route tests for `social-accounts.routes.ts` following the `auth.test.ts`
  pattern: `connect` requires auth (401 without a token) and returns 503 when
  unconfigured; `disconnect` returns 404 for another user's account.
- No live end-to-end test against real Instagram (requires Meta App Review
  and a real tester account) — the Graph API boundary is mocked instead.

## Out of scope for this feature

- Automatically refreshing the long-lived token before its ~60-day expiry
  (can reuse better-auth's `refresh-token`/`get-access-token` endpoints or a
  scheduled job later — not needed for the initial connect flow).
- Any platform other than Instagram (the schema's `platform`/`provider`
  columns are already generic, but no other platform is being wired up now).
