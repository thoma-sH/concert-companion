import { NextResponse } from "next/server";
import { getUser } from "../../lib/auth";
import pool from "../../lib/db";

export async function GET(request) {
    let { userId, concertId } = await getUser(request);
    if (!userId) return NextResponse.json({ "sucess": false, error: "Not Authorized" })
    let queryResponse = await pool.execute("SELECT LightColor FROM Concert WHERE idConcert=?", [concertId])
    return NextResponse.json({ success: true, color: queryResponse[0][0]["LightColor"] })
}