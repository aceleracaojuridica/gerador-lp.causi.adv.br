"use client";

import {
  ChevronLeft,
  EventAvailable,
  GridView,
  Help,
  IdCard,
  Inbox,
  Paid,
  Robot2,
  School,
  Tooltip as TooltipIcon,
} from "@material-symbols-svg/react/rounded";
import { Info, Moving } from "@material-symbols-svg/react/rounded/w600";
import dynamic from "next/dynamic";
import Link from "next/link";
import React from "react";
import CausiLogoIcon from "@/components/icons/causi-logo";
import { SupportModal } from "@/components/support-modal";
import { Button } from "@/components/ui/button";
import { useAccessControl } from "@/hooks/use-access-control";
import { useSession } from "@/hooks/use-session";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
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

const ONBOARDING_TARGETS: Record<string, string> = {
  "/canais": "channels",
  "/agentes": "agents",
  "/oportunidades": "opportunities",
};

export function AppSidebar({
  currentPath = "/",
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  dealsHref = "/oportunidades",
}: AppSidebarProps) {
  const [localIsOpen, setLocalIsOpen] = React.useState(false);
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);
  const session = useSession();
  const { hasFeature } = useAccessControl();
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
  const setIsOpen = externalSetIsOpen || setLocalIsOpen;

  const closeSidebar = React.useCallback(() => setIsOpen(false), [setIsOpen]);

  // Calculate usage percentage once
  const usageStats = React.useMemo(() => {
    const dealsCount = session.usage.deals_count ?? 0;
    const maxDeals = session.limits.max_contacts ?? 0;
    const pct = maxDeals > 0 ? Math.round((dealsCount / maxDeals) * 100) : 0;
    return { dealsCount, maxDeals, pct };
  }, [session.usage.deals_count, session.limits.max_contacts]);

  /** Check if current path is active for this nav item */
  const isNavItemActive = React.useCallback(
    (item: NavItem): boolean => {
      // If routes are defined, check if currentPath starts with any of them
      if (item.routes && item.routes.length > 0) {
        return item.routes.some((route) => currentPath.startsWith(route));
      }
      // Otherwise, exact match with href
      return currentPath === item.href;
    },
    [currentPath],
  );

  const navItems = [
    {
      href: "/dashboard?onboarding=true",
      icon: GridView,
      label: "Dashboard",
      feature: "deals",
    },
    {
      href: "/conversas",
      icon: TooltipIcon,
      label: "Conversas",
      feature: "conversations",
    },
    {
      href: dealsHref,
      icon: Paid,
      label: "Oportunidades",
      routes: ["/oportunidades", "/funis", "/etiquetas"],
      feature: "deals",
    },
    {
      href: "/pessoas",
      icon: IdCard,
      label: "Contatos",
      routes: ["/pessoas", "/organizacoes"],
      feature: "persons",
    },
    {
      href: "/tarefas",
      icon: EventAvailable,
      label: "Tarefas",
      feature: "tasks",
    },
    { href: "/canais", icon: Inbox, label: "Canais", feature: "channels" },
    { href: "/agentes", icon: Robot2, label: "Agentes", feature: "agents" },
  ].filter((item) => !item.feature || hasFeature(item.feature));

  const bottomItems: BottomNavItem[] = [
    {
      href: "/cursos",
      icon: School,
      label: "Cursos",
      routes: ["/cursos"],
      feature: "classroom",
    },
    {
      href: "#",
      icon: Help,
      label: "Suporte",
      action: () => setSupportModalOpen(true),
    },
  ].filter((item) => !item.feature || hasFeature(item.feature));

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
          {navItems.map((item) => {
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
                      data-onboarding-target={ONBOARDING_TARGETS[item.href]}
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

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  {(() => {
                    const circumference = 2 * Math.PI * 46;
                    const offset =
                      circumference - (usageStats.pct / 100) * circumference;

                    return (
                      <button
                        type="button"
                        className="relative size-11 flex items-center justify-center rounded-full cursor-pointer hover:opacity-70 transition-opacity my-1 group"
                      >
                        <svg
                          viewBox="0 0 100 100"
                          className="absolute inset-0 size-full"
                        >
                          <title>{`Progresso: ${usageStats.pct}%`}</title>
                          {/* Círculo de fundo (cinza) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="7"
                            className="text-sidebar-ring"
                          />

                          {/* Círculo de progresso (roxo) - inicia no topo, sentido horário */}
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="7"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            className="text-primary transition-all duration-300"
                          />
                        </svg>

                        {/* Texto do percentual */}
                        <span className="text-[11px] font-semibold text-muted-foreground/80">
                          {usageStats.pct}%
                        </span>
                      </button>
                    );
                  })()}
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Limites de uso</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-65" align="end" side="right">
              {(() => {
                const barWidth =
                  usageStats.maxDeals > 0 ? Math.min(usageStats.pct, 100) : 0;
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-xs text-foreground">
                          Oportunidades
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-4 text-muted-foreground-light cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="w-50">
                            <p>
                              Oportunidades são contatos que estão em qualquer
                              etapa de um funil de vendas.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {usageStats.dealsCount.toLocaleString("pt-BR")} de{" "}
                        {usageStats.maxDeals.toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <div className="h-[5px] w-full bg-sidebar-ring rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Você já utilizou {usageStats.pct}% do seu limite de
                      oportunidades.
                    </p>

                    <Button variant="secondary" size="xs">
                      <Moving />
                      Aumentar Limites
                    </Button>
                  </div>
                );
              })()}
            </PopoverContent>
          </Popover>

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
