import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import bcrypt from "bcrypt"
import { SignJWT } from 'jose';
import { JWT_TOKEN } from '../../lib/secrets';

const SECRET = new TextEncoder().encode(JWT_TOKEN);
const SESSION_DAYS = 7;

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        const [rows] = await pool.execute(
            'SELECT idVenue, Email, Password, VenueName FROM Venue WHERE Email = ? LIMIT 1',
            [email]
        );

        const user = rows[0];
        if (!user || !(await bcrypt.compare(password, user.Password))) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await new SignJWT({ userId: user.idVenue, VenueName: user.VenueName, type: "venue" })
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
