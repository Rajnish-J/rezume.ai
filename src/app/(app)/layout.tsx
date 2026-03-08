import { redirect } from "next/navigation";

import { AppHeader } from "@/src/components/AppHeader";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { auth } from "@/src/lib/auth/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

