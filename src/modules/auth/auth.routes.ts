import { Hono } from 'hono'
import { requireAuth } from '../../middlewares/auth.middleware'
import { auth } from './auth'
import * as authController from './auth.controller'

/**
 * Auth di `/api/auth`. Endpoint REST kustom lebih dulu, lalu catch-all ke
 * handler Better Auth (jwks untuk verifikasi JWT, token, sign-out).
 */
export function registerAuthRoutes(app: Hono) {
  const router = new Hono()

  router.post('/register', authController.register)
  router.post('/login', authController.login)
  router.post('/login/google', authController.loginGoogle)
  router.post('/forgot-password', authController.forgotPassword)
  router.post('/reset-password', authController.resetPassword)
  router.get('/me', requireAuth, authController.me)
  router.on(['GET', 'POST'], '/*', (c) => auth.handler(c.req.raw))

  app.route('/auth', router)
}
