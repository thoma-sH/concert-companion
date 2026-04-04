import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import bcrypt from "bcrypt"


export async function POST(request) {
    let { phoneNumber, screenName, concertId } = await request.json()
    let existing_users = await pool.execute("SELECT PhoneNumber FROM User WHERE PhoneNumber = ? and idConcert = ? LIMIT 1", [phoneNumber, concertId])
    if (existing_users[0].length != 0) {
        return NextResponse.json({ "success": false, "error": "this email already exists" }, { status: 200 })
    }
    let existing_name = await pool.execute("SELECT ScreenName FROM User WHERE ScreenName = ? and idConcert = ? LIMIT 1", [screenName, concertId])
    if (existing_name[0].length != 0) {
        return NextResponse.json({ "success": false, "error": "this screen Name already exists" }, { status: 200 })
    }
    await pool.execute('INSERT INTO User (PhoneNumber, idConcert, ScreenName) VALUES (?,?,?)', [phoneNumber, concertId, screenName])
    return NextResponse.json({ "success": true }, { status: 200 });
}