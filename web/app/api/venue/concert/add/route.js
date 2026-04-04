import { getUser, getVenue } from "../../../lib/auth"
import { NextResponse } from "next/server";
import pool from "../../../lib/db";
export async function POST(request) {
    let venueId = await getVenue(request)
    if (!venueId) return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 400 })
    let { concertName, startDate, endDate } = await request.json()
    console.log([concertName, startDate, endDate, venueId])
    await pool.execute("INSERT INTO  Concert (ConcertName, StartDate, EndDate, idVenue) VALUES (?, ?, ?, ?)", [concertName, startDate, endDate, venueId]);
    return NextResponse.json({ "success": true });
}