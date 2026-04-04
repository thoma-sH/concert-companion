import { NextResponse } from "next/server";
import { getVenue } from "../../lib/auth";
import pool from "../../lib/db";
export async function POST(request) {
    let venueId = await getVenue(request)
    if (!venueId) return NextResponse.json({ "success": false, "error": "unauthorized" })
    let { chatId } = await request.json();
    await pool.execute("DELETE FROM ChatMessage WHERE idChatMessage = ?", [chatId]);
    return NextResponse.json({ "success": true })
}