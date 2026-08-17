import { getSessionUser } from "@/lib/session";
import { Nav } from "@/components/nav";
import { TokenLab } from "@/components/token-lab/token-lab";

export default async function TokenLabPage() {
  const user = await getSessionUser();

  return (
    <>
      <Nav user={user ? { email: user.email, role: user.role } : null} />
      <TokenLab />
    </>
  );
}
