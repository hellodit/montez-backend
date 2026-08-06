import type {Context} from "hono";
import {currentUserId} from "../../lib/auth";
import {successResponse, validationFailed} from "../../lib/response";
import {parseBody, parseParam, parseQueryParams} from "../../lib/validation";
import type {AuthVariables} from "../auth/auth.types";
import {
    createUserSchema,
    listUsersQuerySchema,
    updateUserSchema,
    userIdParamSchema,
} from "./users.schema";
import {
    createUser,
    deleteUser,
    fetchUsers,
    findUserById,
    updateUser,
} from "./users.service";

type Ctx = Context<{ Variables: AuthVariables }>;

export async function create(c: Ctx) {
    const body = await parseBody(c, createUserSchema);
    if (!body.ok) return validationFailed(c, body.errors);

    const user = await createUser(body.data);
    return successResponse(c, user, "User created successfully.", 201);
}

export async function index(c: Ctx) {
    const query = parseQueryParams(c, listUsersQuerySchema);
    if (!query.ok) return validationFailed(c, query.errors);

    const result = await fetchUsers(query.data);
    return successResponse(c, result, "User list.");
}

export async function show(c: Ctx) {
    const param = parseParam(c, userIdParamSchema);
    if (!param.ok) return validationFailed(c, param.errors);

    const user = await findUserById(param.data.id);
    return successResponse(c, user);
}

export async function update(c: Ctx) {
    const param = parseParam(c, userIdParamSchema);
    if (!param.ok) return validationFailed(c, param.errors);

    const body = await parseBody(c, updateUserSchema);
    if (!body.ok) return validationFailed(c, body.errors);

    const user = await updateUser(currentUserId(c), param.data.id, body.data);
    return successResponse(c, user, "User updated successfully.");
}

export async function destroy(c: Ctx) {
    const param = parseParam(c, userIdParamSchema);
    if (!param.ok) return validationFailed(c, param.errors);

    await deleteUser(currentUserId(c), param.data.id);
    return successResponse(c, null, "User deleted successfully.");
}
