import type { Context } from "hono";
import type {ContentfulStatusCode, ServerErrorStatusCode} from "hono/utils/http-status";


export function successResponse<T>(
    c: Context,
    data: T,
    message = "OK",
    status: ContentfulStatusCode = 200,
) {
    return c.json({ success: true, message, data }, status);
}


export function failedResponse(
    c: Context,
    message: string,
    status: ContentfulStatusCode = 400,
    errors: unknown = null,
) {
    return c.json({ success: false, message, errors }, status);
}


export function validationFailed(c: Context, errors: unknown) {
    return failedResponse(c, "Validation failed.", 422, errors);
}

export function internalServiceErrorResponse(
    c: Context,
    message: string,
    status: ServerErrorStatusCode = 500,
) {
    return c.json({ success: false, message }, status);
}