import { NextResponse } from "next/server"
import { getUser } from "../../lib/auth"
import pool from "../../lib/db"
export async function POST(request) {
    let { userId } = await getUser(request)
    if (!userId) return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 200 })
    let { messageId } = await request.json()
    if (!messageId) return NextResponse.json({ "success": false, "error": "no message id" })
    await pool.execute("DELETE FROM Upvotes WHERE idUser = ? AND idChatMessage = ?", [userId, messageId])
    return NextResponse.json({ "success": true })
}