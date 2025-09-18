import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value ?? "";
  const user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
