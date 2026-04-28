import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { SignJWT } from 'jose';
import { JWT_TOKEN } from '../../lib/secrets';

const SECRET = new TextEncoder().encode(JWT_TOKEN);
const SESSION_DAYS = 1;

export async function POST(request) {
    try {
        const { phoneNumber, concertId } = await request.json();

        const [rows] = await pool.execute(
            'SELECT idUser, idConcert FROM User WHERE PhoneNumber = ? AND idConcert = ?',
            [phoneNumber, concertId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: "that number is not registered" }, { status: 404 });
        }

        const user = rows[0];
        const token = await new SignJWT({ userId: user.idUser, concertId: user.idConcert, type: "user" })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(`${SESSION_DAYS}d`)
            .sign(SECRET);

        const response = NextResponse.json({ success: true });
        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_DAYS * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
