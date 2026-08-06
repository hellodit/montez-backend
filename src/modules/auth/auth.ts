import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer, jwt } from 'better-auth/plugins'
import { db } from '../../db/client'
import { user, session, account, verification, jwks } from '../../db/schema'
import { env } from '../../config'

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
  ],
})
