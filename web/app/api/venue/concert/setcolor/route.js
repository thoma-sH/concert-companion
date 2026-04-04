import { getUser, getVenue } from "../../../lib/auth"
import { NextResponse } from "next/server";
import pool from "../../../lib/db";
export async function POST(request) {
    let venueId = await getVenue(request)
    if (!venueId) return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 400 })
    let { concertId, color } = await request.json()
    await pool.execute("UPDATE Concert SET LightColor = ? WHERE idConcert = ? AND idVenue = ?", [color, concertId, venueId]);
    return NextResponse.json({ "success": true });
}