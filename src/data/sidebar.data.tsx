import {
  BookOpenIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  MapIcon,
  PieChartIcon,
  TerminalIcon,
  MessageSquareIcon,
} from "lucide-react";

import { SidebarData } from "../types/sidebar.types";

export const sidebarData: SidebarData = {
  user: {
    name: "Rajnish J",
    email: "rajnishOfficial02@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Rezume.ai",
      logo: <GalleryVerticalEndIcon />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLinesIcon />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <TerminalIcon />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <PieChartIcon />,
      items: [],
    },
    {
      title: "Resume",
      url: "/resume",
      icon: <BookOpenIcon />,
      items: [],
    },
    {
      title: "Chat",
      url: "/chat",
      icon: <MessageSquareIcon />,
      items: [],
    },
    {
      title: "Career",
      url: "/career",
      icon: <FrameIcon />,
      items: [],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/dashboard",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "/resume",
      icon: <PieChartIcon />,
    },
    {
      name: "Resume Chats",
      url: "/chat",
      icon: <MessageSquareIcon />,
    },
    {
      name: "Travel",
      url: "/career",
      icon: <MapIcon />,
    },
  ],
};
