import { Unkempt } from "next/font/google";
import { NextResponse } from "next/server";
import { getUser, getVenue } from "../../lib/auth";
import pool from "../../lib/db";
export async function GET(request) {
    try {
        let { user, concertId } = await getUser(request)
        if (venue == undefined) {
            return NextResponse.json({ success: true, loggedIn: false }, { status: 200 })
        } else {
            return NextResponse.json({ success: true, loggedIn: true, userId: venue }, { status: 200 })
        }
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}