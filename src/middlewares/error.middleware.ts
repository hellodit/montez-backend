import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { AppError } from '../lib/errors'
import { failedResponse, internalServiceErrorResponse } from '../lib/response'

// Satu-satunya error handler aplikasi (didaftarkan di src/app.ts).
// Log tanpa payload sensitif; hanya error yang kita lempar sendiri yang
// pesannya diteruskan ke client, sisanya jadi 500 generik.
export const errorHandler: ErrorHandler = (err, c) => {
  // AppError = error bisnis yang disengaja dari service layer.
  if (err instanceof AppError) {
    // `errors` (map per-field) hanya untuk 4xx — pada 5xx isinya bisa
    // membocorkan detail internal, jadi jangan diteruskan.
    const errors = err.status < 500 ? err.errors : null
    return failedResponse(c, err.message, err.status, errors)
  }
  if (err instanceof HTTPException) {
    return failedResponse(c, err.message, err.status)
  }
  console.error('[error]', err instanceof Error ? err.message : String(err))
  return internalServiceErrorResponse(c, 'Internal server error.')
}
