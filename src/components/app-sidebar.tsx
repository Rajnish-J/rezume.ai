"use client"

import * as React from "react"

import { NavMain } from "../components/nav-main"
import { NavChats } from "../components/nav-chats"
import { NavUser } from "../components/nav-user"
import { TeamSwitcher } from "../components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/src/components/ui/sidebar"
import { sidebarData } from "../data/sidebar.data"

type AppSidebarUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: AppSidebarUser }) {
  const sidebarUser = {
    name: user?.name ?? sidebarData.user.name,
    email: user?.email ?? sidebarData.user.email,
    avatar: user?.image ?? sidebarData.user.avatar,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavChats />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}