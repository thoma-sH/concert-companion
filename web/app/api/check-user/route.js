// This is a Next.js API route — it runs on the server, not in the browser.
// The URL is: GET /api/check-user?username=someuser
//
// Right now it always returns { hasPhone: false } so the UserOnboarding page
// always shows the phone field. Once the MySQL database is connected,
// replace the body of this function with a real query.

import { NextResponse } from "next/server";

export async function GET(request) {
  // Read the username from the URL query string (e.g. ?username=sergio)
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    // If no username was passed, return an error response
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  // TODO: replace this block with a real database query, e.g.:
  //   const user = await db.query("SELECT phone FROM users WHERE username = ?", [username]);
  //   const hasPhone = user.length > 0 && !!user[0].phone;
  //   return NextResponse.json({ hasPhone });

  // For now, always return false so the phone field is shown to every user.
  return NextResponse.json({ hasPhone: false });
}
