// Public endpoint — no auth required.
// Returns basic concert info so the live feed can show the concert name.
// GET /api/concert/[id]

import { NextResponse } from "next/server";
import pool from "../../lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "no id provided" }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT idConcert, ConcertName, StartDate, EndDate FROM Concert WHERE idConcert = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "concert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...rows[0] });
  } catch (error) {
    console.error("concert lookup error:", error);
    return NextResponse.json({ success: false, error: "internal server error" }, { status: 500 });
  }
}
