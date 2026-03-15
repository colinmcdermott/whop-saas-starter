import { getSession } from "@/lib/auth";
import { HeaderClient } from "./header-client";

export async function Header() {
  const session = await getSession();
  return <HeaderClient isLoggedIn={!!session} />;
}
