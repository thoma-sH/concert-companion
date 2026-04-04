import { NextResponse } from "next/server";
import pool from "../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const concertId = searchParams.get("concertId");

  if (!concertId) {
    return NextResponse.json({ success: false, error: "no concertId provided" }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT LightColor FROM Concert WHERE idConcert = ? LIMIT 1",
      [concertId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "concert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, color: rows[0].LightColor });
  } catch (error) {
    console.error("concertColor error:", error);
    return NextResponse.json({ success: false, error: "internal server error" }, { status: 500 });
  }
}