import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const token = cookies().get("session_token")?.value ?? "";
  const user = await getUserBySessionToken(token);
  const safeUser = user
    ? { id: user.id, email: user.email, name: user.name ?? undefined }
    : null;

  return <NavbarClient user={safeUser} />;
}
