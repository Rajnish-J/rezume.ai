export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface Team {
  name: string;
  logo: React.ReactNode;
  plan: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  items?: NavItem[];
}

export interface Project {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export interface SidebarData {
  user: User;
  teams: Team[];
  navMain: NavItem[];
  projects: Project[];
}
