import { NextRequest, NextResponse } from "next/server";
import pool from "../../lib/db";

const messageTypes = [
    "message",
    "image",
    "report",
    "announcement"
]


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    if (!searchParams.get("concertId")) return NextResponse.json({ "success": false, "error": "No concert specified" }, { status: 200 })
    let queryResult = await pool.execute("SELECT cm.idUser, cm.Type, cm.idChatMessage, cm.Message, cm.Sent, u.ScreenName AS Username, COUNT(up.idUser) AS UpvoteCount FROM concert_companion.ChatMessage AS cm LEFT JOIN concert_companion.User AS u ON cm.idUser = u.idUser LEFT JOIN concert_companion.Upvotes AS up ON cm.idChatMessage = up.idChatMessage WHERE cm.idConcert = 1 GROUP BY cm.idChatMessage, cm.Message, cm.Sent, u.ScreenName ORDER BY cm.Sent ASC LIMIT 100;", [searchParams.get("concertId")])
    let where = await pool.execute("SELECT COUNT(*) AS total FROM User WHERE idConcert = ?", [searchParams.get("concertId")])
    return NextResponse.json({ "success": true, "data": queryResult[0], "count": where[0][0]["total"] }, { status: 200 })
}