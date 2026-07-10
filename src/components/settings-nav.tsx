"use client";

import {
  AdsClick,
  Analytics,
  Code,
  Palette,
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
    href: "/configuracoes",
    label: "Visual",
    description: "Fontes e subdominio padrao das landing pages",
    icon: Palette,
  },
  {
    href: "/configuracoes/trackeamento",
    label: "Trackeamento",
    description: "GA4 e Google Tag Manager das landing pages",
    icon: Analytics,
  },
  {
    href: "/configuracoes/pixels",
    label: "Pixels",
    description: "Meta Pixel e Google Ads das landing pages",
    icon: AdsClick,
  },
  {
    href: "/configuracoes/scripts",
    label: "Scripts avancados",
    description: "HTML/JS customizado das landing pages",
    icon: Code,
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
