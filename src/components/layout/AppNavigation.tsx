
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Code2,
  Database,
  Settings,
  Layout,
  Workflow,
  FileSpreadsheet,
  Bot,
  Plug,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";
import { MoonIcon, SunIcon } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface MainNavigationProps {
  children?: React.ReactNode;
  className?: string;
}

function MainNavigation({ className }: MainNavigationProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const navigationItems: NavSection[] = [
    {
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <Layout className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Data",
      items: [
        {
          title: "Contacts",
          href: "/objects/contact",
          icon: <Database className="h-5 w-5" />,
        },
        {
          title: "Accounts",
          href: "/objects/account",
          icon: <Code2 className="h-5 w-5" />,
        },
        {
          title: "Deals",
          href: "/objects/deal",
          icon: <FileSpreadsheet className="h-5 w-5" />,
        },
        {
          title: "Activities",
          href: "/objects/activity",
          icon: <Workflow className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "AI",
      items: [
        {
          title: "AI Assistant",
          href: "/openai/assistant",
          icon: <Bot className="h-5 w-5" />,
        },
        {
          title: "AI Settings",
          href: "/openai/settings",
          icon: <Settings className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          title: "Settings",
          href: "/settings",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "Help",
          href: "/help",
          icon: <BookOpen className="h-5 w-5" />,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6 flex-grow">
        <ul className="space-y-2">
          {navigationItems.map((section, sectionIndex) => (
            <li key={`section-${sectionIndex}`}>
              {section.title ? (
                <div className="text-sm font-semibold text-muted-foreground px-2">
                  {section.title}
                </div>
              ) : null}
              <ul className="mt-2 space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={`item-${sectionIndex}-${itemIndex}`}>
                    <NavigationLink item={item} location={location} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-8 w-full items-center justify-between rounded-md">
              <Avatar className="mr-2 h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                <AvatarFallback>{user?.user_metadata?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {user?.user_metadata?.full_name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.user_metadata?.full_name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile/appearance')}>Appearance</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              Toggle Theme
              <div className="ml-auto">
                <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface MobileNavigationProps {
  children?: React.ReactNode;
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

  const navigationItems: NavSection[] = [
    {
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <Layout className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Data",
      items: [
        {
          title: "Contacts",
          href: "/objects/contact",
          icon: <Database className="h-5 w-5" />,
        },
        {
          title: "Accounts",
          href: "/objects/account",
          icon: <Code2 className="h-5 w-5" />,
        },
        {
          title: "Deals",
          href: "/objects/deal",
          icon: <FileSpreadsheet className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "AI",
      items: [
        {
          title: "AI Assistant",
          href: "/openai/assistant",
          icon: <Bot className="h-5 w-5" />,
        },
        {
          title: "AI Settings",
          href: "/openai/settings",
          icon: <Settings className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          title: "Settings",
          href: "/settings",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "Help",
          href: "/help",
          icon: <BookOpen className="h-5 w-5" />,
        },
      ],
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="pl-0">
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader className="pl-4 pt-4">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate through the application.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 flex-grow">
            <ul className="space-y-2">
              {navigationItems.map((section, sectionIndex) => (
                <li key={`section-${sectionIndex}`}>
                  {section.title ? (
                    <div className="text-sm font-semibold text-muted-foreground px-2">
                      {section.title}
                    </div>
                  ) : null}
                  <ul className="mt-2 space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <li key={`item-${sectionIndex}-${itemIndex}`}>
                        <NavigationLink item={item} location={location} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="profile">
                <AccordionTrigger className="data-[state=open]:text-foreground">
                  <Avatar className="mr-2 h-8 w-8 inline-block">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                    <AvatarFallback>{user?.user_metadata?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {user?.user_metadata?.full_name}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="mt-2 space-y-1">
                    <li>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/profile')}>
                        Profile
                      </Button>
                    </li>
                    <li>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/profile/appearance')}>
                        Appearance
                      </Button>
                    </li>
                    <li>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                        Toggle Theme
                      </Button>
                    </li>
                    <li>
                      <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                        Logout
                      </Button>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface NavigationLinkProps {
  item: NavItem;
  location: { pathname: string };
}

function NavigationLink({ item, location }: NavigationLinkProps) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `flex items-center text-sm font-medium py-2 px-3 rounded-md transition-colors
        ${isActive
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`
      }
    >
      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
      {item.title}
      {item.label && (
        <span className="ml-auto text-xs font-semibold px-2 py-1 bg-secondary text-foreground rounded-full">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

export default MainNavigation;
