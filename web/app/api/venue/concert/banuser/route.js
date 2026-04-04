import { getVenue } from "@/app/api/lib/auth";
import pool from "@/app/api/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    let venueId = await getVenue(request)
    if (!venueId) return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 200 })
    let { userId, concertId } = await request.json()
    await pool.execute("UPDATE User SET Banned = 1 WHERE idUser = ? AND idConcert = ?", [userId, concertId]);
    await pool.execute("DELETE FROM ChatMessages WHERE idUser = ?", [userId]);
    return NextResponse.json({ "success": true })
}