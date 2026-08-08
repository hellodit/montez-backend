import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ValidationErrors } from "./validation.ts";

/**
 * Error bisnis yang boleh "dilempar" dari service dan diterjemahkan jadi
 * response amplop standar oleh `app.onError` (lihat src/app.ts).
 *
 * Dipakai agar controller tetap tipis: service cukup `throw new AppError(...)`
 * alih-alih mengembalikan sentinel yang harus dicek manual di tiap handler.
 */
export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly errors: ValidationErrors | null;

  constructor(
    message: string,
    status: ContentfulStatusCode = 400,
    errors: ValidationErrors | null = null,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.errors = errors;
  }
}

export function unauthorized(message: string): AppError {
  return new AppError(message, 401);
}

export function notFound(message: string): AppError {
  return new AppError(message, 404);
}

export function forbidden(message: string): AppError {
  return new AppError(message, 403);
}

export function conflict(message: string): AppError {
  return new AppError(message, 409);
}

/** 422 dengan map error per-field (bentuk sama seperti `validationFailed`). */
export function unprocessable(errors: ValidationErrors, message = "Validation failed."): AppError {
  return new AppError(message, 422, errors);
}
