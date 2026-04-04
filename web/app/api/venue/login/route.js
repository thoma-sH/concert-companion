import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import bcrypt from "bcrypt"
import { SignJWT } from 'jose';
import { JWT_TOKEN } from '../../lib/secrets';

const SECRET = new TextEncoder().encode(JWT_TOKEN);

export async function POST(request) {
    try {

        const res = await request.json()
        const { email, password } = res

        const rows = await pool.execute(
            'SELECT idVenue, Email, Password, VenueName FROM Venue WHERE Email = ? LIMIT 1',
            [email]
        );

        const user = rows[0];
        console.log(user)
        if (!user || !(await bcrypt.compare(password, user[0].Password))) {
            return NextResponse.json({ success: true, error: 'Invalid credentials' }, { status: 401 });
        }
        const token = await new SignJWT({ userId: user[0].idVenue, VenueName: user[0].VenueName, type: "venue" })
            .setProtectedHeader({ alg: 'HS256' })
            .sign(SECRET);

        const response = NextResponse.json({ success: true });
        response.cookies.set('session', token, {
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}