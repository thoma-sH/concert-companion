import { jwtVerify, jwtDecrypt } from "jose";
import { JWT_TOKEN } from "./secrets";

const SECRET = new TextEncoder().encode(JWT_TOKEN);

export async function getVenue(request) {
    const token = request.cookies.get('session')?.value;
    if (!token) {
        return undefined
    }
    try {
        let payload = await jwtVerify(token, SECRET);
        if (payload.payload.type != "venue") {
            return undefined
        }
        return payload.payload.userId
    } catch {
        return undefined
    }
}

export async function getUser(request) {
    const token = request.cookies.get('session')?.value;
    if (!token) {
        return { userId: undefined, concertId: undefined }
    }
    try {
        let payload = await jwtVerify(token, SECRET);
        if (payload.payload.type != "user") {
            return { userId: undefined, concertId: undefined }
        }
        return { userId: payload.payload.userId, concertId: payload.payload.concertId }
    } catch {
        return undefined
    }
}