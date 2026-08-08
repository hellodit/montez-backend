import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer, genericOAuth, jwt } from 'better-auth/plugins'
import { db } from '../../db/client'
import { user, session, account, verification, jwks } from '../../db/schema'
import { env } from '../../config'
import { INSTAGRAM_OAUTH_PROVIDER_ID } from '../../db/constants'

// Dynamic import (bukan static) memutus siklus modul: social-accounts.service
// juga mengimpor `auth` dari file ini (untuk oAuth2LinkAccount/unlinkAccount).
async function syncInstagramAccountAfterLink(account: { userId: string; accountId: string }) {
  const { syncInstagramAccount } = await import('../social-accounts/social-accounts.service')
  await syncInstagramAccount(account)
}

// Instance Better Auth — email+password + JWT (bearer). Token JWT dipakai untuk
// autentikasi API (requireAuth memverifikasinya). ID user tetap text/uuid.
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification, jwks },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  // Google dipakai lewat id-token flow (FE kirim ID token GIS ke /login/google),
  // bukan redirect — jadi tidak ada redirect URI yang perlu didaftarkan di sini.
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // Email Google terverifikasi oleh Google — aman ditautkan otomatis ke
      // user email+password yang sudah ada dengan email sama.
      trustedProviders: ['google'],
      // Email Instagram (placeholder, lihat provider "instagram" di plugins)
      // tidak akan pernah sama dengan email login Montez — connect Instagram
      // bukan login, jadi pencocokan email tidak relevan di sini.
      allowDifferentEmails: true,
    },
  },
  user: {
    additionalFields: {
      // input: false = WAJIB, kalau tidak body /register bisa mengirim isAdmin: true.
      isAdmin: { type: 'boolean', required: false, defaultValue: false, input: false },
    },
  },
  plugins: [
    bearer(),
    jwt({
      jwt: {
        issuer: env.BETTER_AUTH_URL,
        audience: env.BETTER_AUTH_URL,
        expirationTime: '1d',
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin === true,
        }),
      },
    }),
    // Connect Instagram (owner-access ke Instagram Graph API) — BUKAN metode
    // login. providerId kustom "instagram" (bukan "facebook" native) sengaja
    // dipakai agar tak pernah bisa dipanggil lewat /sign-in/social yang sudah
    // dipakai Google; jalur login satu-satunya tetap email+password & Google.
    // Flow: "Instagram API with Instagram Login" (bukan Facebook Login for
    // Business) — satu authorize = satu akun IG, tanpa konsep Facebook Page.
    genericOAuth({
      config: [
        {
          providerId: INSTAGRAM_OAUTH_PROVIDER_ID,
          clientId: env.META_APP_ID ?? '',
          clientSecret: env.META_APP_SECRET ?? '',
          authorizationUrl: 'https://www.instagram.com/oauth/authorize',
          tokenUrl: 'https://api.instagram.com/oauth/access_token',
          userInfoUrl: 'https://graph.instagram.com/me?fields=id,username,name',
          scopes: ['instagram_business_basic', 'instagram_business_manage_insights'],
          redirectURI: env.META_REDIRECT_URI,
          // better-auth mensyaratkan email non-kosong untuk setiap akun yang
          // di-link, tapi Instagram tidak pernah mengembalikan email — nilai
          // placeholder ini tidak pernah dipakai di mana pun (tidak disimpan
          // ke tabel `user`, hanya memenuhi syarat internal better-auth).
          mapProfileToUser: (profile) => ({
            email: `${profile.id}@instagram.placeholder`,
            name: profile.username,
          }),
        },
      ],
    }),
  ],
  databaseHooks: {
    account: {
      create: {
        after: async (createdAccount) => {
          if (createdAccount.providerId === INSTAGRAM_OAUTH_PROVIDER_ID) {
            await syncInstagramAccountAfterLink(createdAccount)
          }
        },
      },
      update: {
        after: async (updatedAccount) => {
          if (updatedAccount.providerId === INSTAGRAM_OAUTH_PROVIDER_ID) {
            await syncInstagramAccountAfterLink(updatedAccount)
          }
        },
      },
    },
  },
})
