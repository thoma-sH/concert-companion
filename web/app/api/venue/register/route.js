import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import bcrypt from "bcrypt"


export async function POST(request) {
    let { email, password, venueName } = await request.json()
    let existing_users = await pool.execute("SELECT Email FROM Venue WHERE Email = ? LIMIT 1", [email])
    if (existing_users[0].length != 0) {
        return NextResponse.json({ "success": false, "error": "this email already exists" }, { status: 200 })
    }
    console.log(await pool.execute('INSERT INTO Venue (Email, Password, VenueName) VALUES (?,?,?)', [email, await bcrypt.hash(password, 10), venueName]));
    return NextResponse.json({ "success": true }, { status: 200 });
}