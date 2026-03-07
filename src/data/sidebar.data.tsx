import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  BookOpenIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
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
      title: "Career",
      url: "/career",
      icon: <FrameIcon />,
      items: [],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <MapIcon />,
    },
  ],
};
