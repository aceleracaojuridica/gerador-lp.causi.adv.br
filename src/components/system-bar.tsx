/**
 * Barra de sistema do app: seletor de conta com troca de contexto em tempo real.
 *
 * @remarks
 * Exibida quando `session.hasSharedAccounts === true` ou `accessLevel === 999` (decisão do layout pai).
 * A lógica de fetch, cache, busca e infinite scroll está encapsulada em `useAccountSwitcher`.
 * Ao trocar de conta o hook chama `switchAccountAction`, atualiza o contexto via `setSession`
 * e dispara `router.refresh()` para re-renderizar Server Components com a nova conta.
 */
"use client";

import {
  Domain,
  SettingsAccountBox,
} from "@material-symbols-svg/react/rounded";
import Image from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  EntityCombobox,
  EntityComboboxContent,
  EntityComboboxInputTrigger,
} from "@/components/ui-patterns/entity-combobox";
import {
  EntityItem,
  EntityItemDescription,
  EntityItemTextGroup,
  EntityItemTitle,
} from "@/components/ui-patterns/entity-item";
import {
  type AccountSwitcherItem,
  useAccountSwitcher,
} from "@/hooks/use-account-switcher";
import { useSession } from "@/hooks/use-session";
import { CAUSI_APP_URL } from "@/lib/session/access";

export function SystemBar() {
  const session = useSession();
  const {
    accounts,
    isLoading,
    isSwitching,
    hint,
    open,
    onOpenChange,
    onSearchChange,
    onScrollEnd,
    switchAccount,
  } = useAccountSwitcher();

  // Resolve the actual item object from the loaded list so Base UI can match
  // it by reference for data-selected. Falls back to null (shows placeholder)
  // until the accounts list is populated.
  const currentAccount = React.useMemo(
    () => accounts.find((a) => a.id === session.account.id) ?? null,
    [accounts, session.account.id],
  );

  const isSuperAdmin = session.role.accessLevel === 999;

  return (
    <header className="dark flex items-center justify-between h-12 border-b bg-card shrink-0">
      {isSuperAdmin && (
        <div className="flex justify-center w-15 -mr-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            title="Configurações"
            className="size-9 hover:bg-white/10"
          >
            <a
              href={`${CAUSI_APP_URL}/admin-contas`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SettingsAccountBox className="size-6 text-white hover:text-primary transition-colors" />
            </a>
          </Button>
        </div>
      )}
      <div className="flex flex-1 items-center justify-between px-3">
        <div className="w-70">
          <EntityCombobox
            items={accounts}
            value={currentAccount ?? session.account}
            onValueChange={(account) => account && void switchAccount(account)}
            getLabel={(a) => a.name}
            getKey={(a) => String(a.id)}
            searchPlaceholder="Buscar contas"
            emptyMessage="Nenhuma conta encontrada"
            open={open}
            onOpenChange={onOpenChange}
            onSearchChange={onSearchChange}
            onScrollEnd={onScrollEnd}
            isLoading={isLoading}
            hint={hint}
            disabled={isSwitching}
          >
            <EntityComboboxInputTrigger
              triggerVariant="input"
              size="sm"
              placeholder="Selecione uma conta"
            >
              {(account: AccountSwitcherItem) => (
                <span className="flex items-center gap-2">
                  <Domain className="border border-border rounded bg-muted p-0.5 size-6 text-muted-foreground shrink-0" />
                  <span className="min-w-0 truncate">{account.name}</span>
                </span>
              )}
            </EntityComboboxInputTrigger>
            <EntityComboboxContent>
              {(account: AccountSwitcherItem) => (
                <EntityItem>
                  <EntityItemTextGroup>
                    <EntityItemTitle>{account.name}</EntityItemTitle>
                    <EntityItemDescription>{`ID: ${account.id}`}</EntityItemDescription>
                  </EntityItemTextGroup>
                </EntityItem>
              )}
            </EntityComboboxContent>
          </EntityCombobox>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-white text-sm">Causi</div>
          <Image
            src="/causi-profile.jpg"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      </div>
    </header>
  );
}
