"use client";

import { GridView, Group, Image } from "@material-symbols-svg/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type WorkspaceNavItem = {
  href: string;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
};

const ITEMS: WorkspaceNavItem[] = [
  {
    href: "/",
    label: "Geral",
    description: "Páginas já criadas",
    Icon: GridView,
    isActive: (p) => p === "/",
  },
  {
    href: "/galeria",
    label: "Imagens",
    description: "Galeria de imagens",
    Icon: Image,
    isActive: (p) => p.startsWith("/galeria"),
  },
  {
    href: "/contatos",
    label: "Leads",
    description: "WhatsApp, e-mail, endereço e redes",
    Icon: Group,
    isActive: (p) => p.startsWith("/contatos"),
  },
];

/** Sub-navegação da área de landing pages (Landing pages · Imagens · Contatos). */
export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 flex-col overflow-y-auto border-r border-border md:flex md:w-80">
      {/* Cabeçalho: mesmo bloco do cabeçalho do wizard multi-step
          (px-[30px] py-5), para ficarem idênticos. */}
      <div className="border-b border-border px-[30px] py-5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Landing Pages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suas páginas, imagens e contatos
        </p>
      </div>
      <nav aria-label="Seções" className="space-y-1 px-[30px] py-4">
        {ITEMS.map(({ href, label, description, Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors",
                active ? "bg-[#808c97]/8" : "hover:bg-[#808c97]/8",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm border border-[#808c97]/10 bg-background",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-foreground">
                  {label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
