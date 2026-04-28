import { NextResponse } from "next/server";
import pool from "../../lib/db";
import { getUser } from "../../lib/auth";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const paramconcertId = searchParams.get("concertId");
        let { userId, concertId } = await getUser(request);
        if (!concertId) concertId = paramconcertId;
        if (!concertId) {
            return NextResponse.json({ success: false, error: "No concert specified" }, { status: 200 });
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
                ${userId ? `MAX(CASE WHEN up.idUser = ? THEN 1 ELSE 0 END)` : '2'} AS hasUpvoted
            FROM ChatMessage AS cm
            LEFT JOIN User    AS u  ON cm.idUser = u.idUser
            LEFT JOIN Upvotes AS up ON cm.idChatMessage = up.idChatMessage
            WHERE cm.idConcert = ?
            GROUP BY
                cm.idUser,
                cm.Type,
                cm.idChatMessage,
                cm.Message,
                cm.Sent,
                u.ScreenName
            ORDER BY cm.Sent ASC
            LIMIT 100
        `;

        const queryParams = userId ? [userId, concertId] : [concertId];
        const [queryResult] = await pool.execute(query, queryParams);
        const [countResult] = await pool.execute(
            "SELECT COUNT(*) AS total FROM User WHERE idConcert = ?",
            [concertId]
        );

        return NextResponse.json({
            success: true,
            data: queryResult,
            count: countResult[0].total,
        }, { status: 200 });
    } catch (err) {
        console.error("chat/get error:", err);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
