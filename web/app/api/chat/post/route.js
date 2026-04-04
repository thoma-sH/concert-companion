import { NextResponse } from "next/server";
import { getUser, getVenue } from "../../lib/auth";
import { getValue } from "@mui/system";
import pool from "../../lib/db";

const messageTypes = {
    "message": 0,
    "image": 1,
    "report": 2,
    "announcement": 3
}


export async function POST(request) {
    let { concertId, messageData, messageType } = await request.json()
    let venueId = await getVenue(request);
    let { userId, UserConcertId } = await getUser(request);
    if (!venueId && (!userId || !UserConcertId != concertId) || (messageType == "announcement" && !venueId)) {
        return NextResponse.json({ "success": false, "error": "unauthorized" }, { status: 200 })
    }
    if (userId) {
        let bannedResponse = await pool.execute("SELECT Banned from User WHERE idUser = ?", userId)
        if (bannedResponse[0][0] !== 0) return NextResponse.json({ "sucess": false, "error": "You have been banned from chatting" })
    }
    await pool.execute("INSERT INTO ChatMessage (Message, idUser, idConcert, Sent, Type) VALUES (?,?,?,NOW(),?)", [messageData, userId ? userId : null, concertId, messageTypes[messageType]])
    return NextResponse.json({ "success": true })
}