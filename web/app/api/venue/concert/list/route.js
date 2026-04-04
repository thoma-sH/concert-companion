import { getUser, getVenue } from "../../../lib/auth"
import { NextResponse } from "next/server";
import pool from "../../../lib/db"
export async function GET(request) {
    try {
        let venueId = await getVenue(request)
        if (!venueId) return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 400 })
        console.log(venueId)
        return NextResponse.json({ "success": true, "data": (await pool.execute("SELECT * FROM Concert WHERE idVenue = ?", [venueId]))[0] }, { status: 200 });
    } catch {
        return NextResponse.json({ "success": false, "error": "internal server error" })
    }
}