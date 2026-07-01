"use client";

import {
  DarkMode,
  DataObject,
  LightMode,
  Logout,
  ManageAccounts,
  School,
  Settings,
} from "@material-symbols-svg/react/rounded";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invalidateAccountCache } from "@/hooks/use-account-switcher";
import { useSession } from "@/hooks/use-session";
import { logoutAction } from "@/lib/auth/actions";
import { env } from "@/lib/env";

export default function AvatarDropdown() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isLoggingOut, startTransition] = useTransition();
  const session = useSession();

  const isSuperAdmin = session.role.accessLevel === 999;
  const showDebug = isSuperAdmin || env.NODE_ENV === "development";
  const avatarFallback = session.user.name.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    startTransition(() => {
      void (async () => {
        const res = await logoutAction();
        if (res?.error) {
          toast.error(res.error);
        } else {
          invalidateAccountCache(session.user.id);
          toast.success("Desconectado com sucesso");
          router.replace("/login");
          router.refresh();
        }
      })();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xl"
          className="rounded-full hover:opacity-70 transition-opacity"
        >
          <Avatar className="size-11">
            {session.user.photo && (
              <AvatarImage src={session.user.photo} alt={session.user.name} />
            )}
            <AvatarFallback className="bg-background-primary border-2 border-primary-foreground/20 text-primary-foreground font-semibold text-lg">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-65" side="right" align="end">
        <div className="flex items-center justify-between gap-3 px-2 py-1 overflow-hidden">
          <div className="ml-1 flex flex-col min-w-0 overflow-hidden">
            <p className="font-semibold text-xs truncate">
              {session.user.name}
            </p>
            <p className="text-muted-foreground text-xs truncate">
              {session.user.email}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            onClick={() => {
              const newTheme = theme === "dark" ? "light" : "dark";
              setTheme(newTheme);
              toast.success(
                `Tema ${newTheme === "dark" ? "escuro" : "claro"} ativado`,
              );
            }}
          >
            {theme === "dark" ? <LightMode /> : <DarkMode />}
            <span className="sr-only">Alternar tema</span>
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {showDebug && (
            <DropdownMenuItem className="text-muted-foreground text-xs" asChild>
              <Link href="/debug">
                <DataObject />
                Debug
              </Link>
            </DropdownMenuItem>
          )}
          {isSuperAdmin && (
            <DropdownMenuItem className="text-muted-foreground text-xs" asChild>
              <Link href="/admin-cursos">
                <School />
                Administrar Cursos
              </Link>
            </DropdownMenuItem>
          )}
          {isSuperAdmin && (
            <DropdownMenuItem className="text-muted-foreground text-xs" asChild>
              <Link href="/admin-contas">
                <ManageAccounts />
                Administrar Contas
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-muted-foreground text-xs" asChild>
            <Link href="/perfil">
              <Settings />
              Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-muted-foreground text-xs"
            onSelect={handleLogout}
            disabled={isLoggingOut}
          >
            <Logout />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
