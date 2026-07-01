"use client";

import { Add, Inbox } from "@material-symbols-svg/react";
import Link from "next/link";
import { LpCard } from "@/components/Builder/lp-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Container } from "@/components/ui-patterns/container";
import {
  Header,
  HeaderContent,
  HeaderHeading,
} from "@/components/ui-patterns/header";
import type { LpListItem } from "@/lib/landing-pages/lp-store";

type HomePageClientProps = {
  lps: (LpListItem & {
    createdByLabel: string;
    isOwnLp: boolean;
  })[];
};

export function HomePageClient({ lps }: HomePageClientProps) {
  return (
    <Container orientation="vertical" overflow="hidden">
      <Header>
        <HeaderContent>
          <HeaderHeading>
            <h1>Suas landing pages</h1>
            <Badge variant="secondary" size="sm" className="font-medium">
              {lps.length}
            </Badge>
          </HeaderHeading>
        </HeaderContent>
      </Header>

      {lps.length === 0 ? (
        <div className="flex flex-1 items-center justify-center animate-in fade-in duration-300">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>Nenhuma landing page ainda</EmptyTitle>
              <EmptyDescription>
                Crie sua primeira página e ela é gerada na hora. Depois você
                ajusta e publica por aqui.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-3">
              <Button asChild>
                <Link href="/nova">
                  <Add />
                  Criar minha primeira página
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-wrap justify-center gap-3 sm:justify-start sm:gap-4">
            {lps.map((lp) => (
              <LpCard
                key={lp.slug}
                slug={lp.slug}
                officeSubdomain={lp.officeSubdomain}
                name={lp.name}
                tema={lp.tema}
                status={lp.status}
                preview={lp.preview}
                createdByUserId={lp.createdByUserId}
                createdByLabel={lp.createdByLabel}
                isOwnLp={lp.isOwnLp}
              />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
