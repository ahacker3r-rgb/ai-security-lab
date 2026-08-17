import { requireUser } from "@/lib/auth/guards";
import { Nav } from "@/components/nav";
import { TokenLab } from "@/components/token-lab/token-lab";

export default async function TokenLabPage() {
  const user = await requireUser();

  return (
    <>
      <Nav email={user.email} role={user.role} />
      <TokenLab />
    </>
  );
}
