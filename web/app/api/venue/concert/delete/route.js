import { getUser, getVenue } from "../../../lib/auth"
import { NextResponse } from "next/server";
import pool from "../../../lib/db";
export async function POST(request) {
    let venueId = await getVenue(request)
    if (!venueId) return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 400 })
    let { concertId } = await request.json()
    await pool.execute("DELETE FROM Concert WHERE idConcert = ? AND idVenue = ?", [concertId, venueId]);
    return NextResponse.json({ "success": true });
}