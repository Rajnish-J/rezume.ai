import CareerContainer from "@/src/app/(app)/career/career.container";
import { auth } from "@/src/lib/auth/auth";

export default async function Page() {
  const session = await auth();
  const userId = Number(session?.user?.id ?? 0);

  return <CareerContainer userId={userId} />;
}
