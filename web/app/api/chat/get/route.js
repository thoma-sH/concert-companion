import { NextRequest, NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const concertId = searchParams.get("concertId");
    const userId = searchParams.get("userId"); // Extract userId from query params

    if (!concertId) {
        return NextResponse.json({ "success": false, "error": "No concert specified" }, { status: 400 });
    }
    const query = `
    SELECT 
        cm.idUser, 
        cm.Type, 
        cm.idChatMessage, 
        cm.Message, 
        cm.Sent, 
        u.ScreenName AS Username, 
        COUNT(up.idUser) AS UpvoteCount,
        ${userId ? `MAX(CASE WHEN up.idUser = ? THEN 1 ELSE 0 END)` : '0'} AS hasUpvoted
    FROM concert_companion.ChatMessage AS cm 
    LEFT JOIN concert_companion.User AS u ON cm.idUser = u.idUser 
    LEFT JOIN concert_companion.Upvotes AS up ON cm.idChatMessage = up.idChatMessage 
    WHERE cm.idConcert = ? 
    GROUP BY 
        cm.idUser, 
        cm.Type, 
        cm.idChatMessage, 
        cm.Message, 
        cm.Sent, 
        u.ScreenName
    ORDER BY cm.Sent ASC 
    LIMIT 100;
`;

    const queryParams = userId ? [userId, concertId] : [concertId];
    const [queryResult] = await pool.execute(query, queryParams);
    const [countResult] = await pool.execute(
        "SELECT COUNT(*) AS total FROM User WHERE idConcert = ?",
        [concertId]
    );
    return NextResponse.json({
        "success": true,
        "data": queryResult,
        "count": countResult[0].total
    }, { status: 200 });

}