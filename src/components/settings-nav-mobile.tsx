"use client";

import {
  CurrencyExchange,
  Domain,
  Group,
  Lock,
  ManageAccounts,
  Palette,
} from "@material-symbols-svg/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { Button } from "./ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: "/perfil",
    label: "Perfil",
    icon: ManageAccounts,
  },
  {
    href: "/seguranca",
    label: "Segurança",
    icon: Lock,
  },
  {
    href: "/escritorio",
    label: "Escritório",
    icon: Domain,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Group,
  },
  {
    href: "/assinatura",
    label: "Assinatura",
    icon: CurrencyExchange,
  },
  {
    href: "/preferencias",
    label: "Preferências",
    icon: Palette,
  },
];

export function SettingsNavMobile() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-center gap-4 py-2 px-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Button
              key={`${item.href}-${index}`}
              asChild
              variant="secondary"
              size="icon-lg"
            >
              <Link href={item.href}>
                <Icon
                  className={` size-4
                  shrink-0
                  ${isActive ? "text-primary" : "text-muted-foreground"}
                `}
                />
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
