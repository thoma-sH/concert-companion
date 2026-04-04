// API route: GET /api/check-phone?phone=+15550000000
//
// Checks if the given phone number exists in the DB.
// Returns { username: "theirname" } if found, or { username: null } if not.
//
// TODO: replace the stub below with a real DB query once MySQL is connected:
//   const rows = await db.query("SELECT username FROM users WHERE phone = ?", [phone]);
//   const username = rows.length > 0 ? rows[0].username : null;
//   return NextResponse.json({ username });

import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  // Stub — always returns null (phone not found) so the username step is shown.
  // Swap this out when the DB is ready.
  return NextResponse.json({ username: null });
}
