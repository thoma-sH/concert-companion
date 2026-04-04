import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import bcrypt from "bcrypt"
import { SignJWT } from 'jose';
import { JWT_TOKEN } from '../../lib/secrets';

const SECRET = new TextEncoder().encode(JWT_TOKEN);

export async function POST(request) {
    try {

        const res = await request.json()
        const { phoneNumber, concertId } = res
        console.log([phoneNumber, concertId])

        const rows = await pool.execute(
            'SELECT idUser, idConcert FROM User WHERE PhoneNumber = ? and idConcert = ?',
            [phoneNumber, concertId]
        );
        console.log(rows)
        if (rows[0].length == 0) return NextResponse.json({ success: false, error: "that number is not registered" })
        const user = rows[0][0];
        console.log(user)
        const token = await new SignJWT({ userId: user.idUser, concertId: user.idConcert, type: "user" })
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