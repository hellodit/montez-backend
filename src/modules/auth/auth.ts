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
  trustedOrigins: [
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:4111',
    'http://127.0.0.1:4111',
    'https://stg.montezai.com',
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification, jwks },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      allowDifferentEmails: true,
    },
  },
  user: {
    additionalFields: {
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
