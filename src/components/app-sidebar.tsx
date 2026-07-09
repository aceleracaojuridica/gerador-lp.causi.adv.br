"use client";

import { Group, Home } from "@material-symbols-svg/react";
import {
  ChevronLeft,
  FileCopy,
  Help,
  Image,
} from "@material-symbols-svg/react/rounded";
import dynamic from "next/dynamic";
import Link from "next/link";
import React from "react";
import CausiLogoIcon from "@/components/icons/causi-logo";
import { useLpAccess } from "@/components/lp-access-provider";
import { SupportModal } from "@/components/support-modal";
import { Button } from "@/components/ui/button";
import { useAccessControl } from "@/hooks/use-access-control";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const AvatarDropdown = dynamic(() => import("./ui-patterns/avatar-dropdown"), {
  ssr: false,
});

/** Props for the AppSidebar component */
interface AppSidebarProps {
  /** Currently active path for highlighting the active nav item */
  currentPath?: string;
  /** Controls if the sidebar is open on mobile */
  isOpen?: boolean;
  /** Callback for when the sidebar open state changes */
  setIsOpen?: (open: boolean) => void;
  /** Link do Kanban de deals — `/oportunidades/{cookie}` ou `/oportunidades`. */
  dealsHref?: string;
}

/** Type for navigation items */
interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** Optional: list of route paths that should activate this item */
  routes?: string[];
  /** Optional: feature flag required to show this item */
  feature?: string;
}

/** Type for bottom navigation items (can have optional action) */
interface BottomNavItem extends NavItem {
  action?: () => void;
  disabled?: boolean;
}

export function AppSidebar({
  currentPath = "/",
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  dealsHref = "/",
}: AppSidebarProps) {
  void dealsHref;
  const [localIsOpen, setLocalIsOpen] = React.useState(false);
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);
  const hasLpAccess = useLpAccess();
  const { hasFeature } = useAccessControl();
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
  const setIsOpen = externalSetIsOpen || setLocalIsOpen;

  const closeSidebar = React.useCallback(() => setIsOpen(false), [setIsOpen]);

  /** Check if current path is active for this nav item */
  const isNavItemActive = React.useCallback(
    (item: NavItem): boolean => {
      const paths = item.routes?.length ? item.routes : [item.href];
      return paths.some((route) => {
        if (route === "/") return currentPath === "/";
        return currentPath === route || currentPath.startsWith(`${route}/`);
      });
    },
    [currentPath],
  );

  const navItems: NavItem[] = [
    {
      href: "/",
      icon: FileCopy,
      label: "Página inicial",
    },
    {
      href: "/galeria",
      icon: Image,
      label: "Galeria de imagens",
      routes: ["/galeria"],
    },
    {
      href: "/contatos",
      icon: Group,
      label: "Contatos",
      routes: ["/contatos"],
    },
  ];

  const mainNavItems = [...(hasLpAccess ? navItems : [])];

  const bottomItems: BottomNavItem[] = [
    {
      href: "?suporte=abrir",
      icon: Help,
      label: "Suporte",
      action: () => setSupportModalOpen(true),
    },
    {
      href: "https://app.causi.com.br",
      icon: Home,
      label: "Voltar ao Causi",
    },
  ].filter((item: BottomNavItem) => !item.feature || hasFeature(item.feature));

  return (
    <>
      {/* Backdrop Overlay - Mobile Only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-200"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-15 border-r border-border bg-card flex flex-col items-center py-4 shrink-0
          overflow-visible
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsOpen(!isOpen);
            }
          }}
          className="md:hidden absolute top-1/2 -translate-y-1/2 -right-6 w-6 h-28 bg-card border-r border-y border-border flex items-center justify-center cursor-pointer z-45 rounded-r-xl group transition-all duration-300 active:scale-95"
          style={{ boxShadow: "4px 0 12px -2px rgba(0,0,0,0.12)" }}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          <div
            className="absolute pointer-events-none"
            style={{ bottom: "100%", left: 0, width: 20, height: 20 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              overflow="visible"
              role="img"
              aria-labelledby="concave-top-title"
            >
              <title id="concave-top-title">Canto superior côncavo</title>
              <path
                d="M 0 0 L 0 20 L 20 20 Q 0 20 0 0 Z"
                className="fill-card"
              />
              <path
                d="M 0 0 Q 0 20 20 20"
                className="stroke-border"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>

          {/* Canto côncavo INFERIOR — espelho vertical */}
          <div
            className="absolute pointer-events-none"
            style={{ top: "100%", left: 0, width: 20, height: 20 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              overflow="visible"
              role="img"
              aria-labelledby="concave-bottom-title"
            >
              <title id="concave-bottom-title">Canto inferior côncavo</title>
              <path
                d="M 0 20 L 0 0 L 20 0 Q 0 0 0 20 Z"
                className="fill-card"
              />
              <path
                d="M 0 20 Q 0 0 20 0"
                className="stroke-border"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>

          <ChevronLeft
            className={`size-5 text-muted-foreground group-hover:text-primary transition-all duration-300 ${isOpen ? "" : "rotate-y-180"}`}
          />
        </button>

        {/* Logo */}
        <div className="mb-5">
          <CausiLogoIcon className="size-9" />
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-1 w-full items-center">
          {mainNavItems.map((item) => {
            const isActive = isNavItemActive(item);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="icon-lg"
                    asChild
                    className={`${isActive ? "text-primary !bg-primary/10 dark:!bg-primary/15" : ""}`}
                  >
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      title={item.label}
                    >
                      <item.icon className="size-6.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto flex flex-col gap-1 items-center border-t border-border/50 pt-4">
          {bottomItems.map((item) => {
            const isActive = isNavItemActive(item);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="icon-lg"
                    className={`${isActive ? "text-primary !bg-primary/10 dark:!bg-primary/15" : ""}`}
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        // Para itens sem action, fecha o sidebar
                        closeSidebar();
                      }
                    }}
                  >
                    {item.action ? (
                      <item.icon className="size-6.5" />
                    ) : (
                      <Link href={item.href} title={item.label}>
                        <item.icon className="size-6.5" />
                      </Link>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <AvatarDropdown />
        </div>
      </aside>

      {/* Modal de Suporte */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </>
  );
}
