import { NextResponse } from "next/server"
import { getVenue } from "../../../lib/auth";
import pool from "../../../lib/db"
export async function GET(request, { params }) {
    let { id } = await params
    if (!id) return NextResponse.json({ "success": false, "error": "no ID Specified" }, { status: 200 });
    let venueId = await getVenue(request);
    if (!venueId) return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 200 });
    let response = await pool.execute("SELECT * FROM Concert WHERE idVenue = ? AND idConcert = ? LIMIT 1", [venueId, id]);
    if (response[0].length == 0) return NextResponse.json({ success: false, "error": "no such concert" }, {})
    return NextResponse.json(response[0][0], { status: 200 })
}