"use client";

import {
  CurrencyExchange,
  Domain,
  Group,
  Lock,
  ManageAccounts,
} from "@material-symbols-svg/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: "/perfil",
    label: "Perfil",
    description: "Gerencie seu perfil de usuário",
    icon: ManageAccounts,
  },
  {
    href: "/seguranca",
    label: "Segurança",
    description: "Gerencie a segurança da conta",
    icon: Lock,
  },
  {
    href: "/escritorio",
    label: "Escritório",
    description: "Gerencie as configurações do escritório",
    icon: Domain,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    description: "Gerencie e adicione usuários do sistema",
    icon: Group,
  },
  {
    href: "/assinatura",
    label: "Assinatura",
    description: "Gerencie detalhes da sua assinatura ou altere seu plano",
    icon: CurrencyExchange,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-start gap-3 p-2 md:p-3 rounded-sm transition-colors
                ${
                  isActive
                    ? "bg-muted-foreground/10"
                    : "hover:bg-muted-foreground/5"
                }
            `}
          >
            <Icon
              className={`
              w-8 h-8 md:w-9 md:h-9 mt-0.5 shrink-0 p-1 rounded-sm border border-text-muted bg-background
              ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"} 
            `}
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-base md:text-md truncate">
                {item.label}
              </div>
              <div className="hidden md:block text-sm mt-0.5 line-clamp-2 text-muted-foreground">
                {item.description}
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
