"use client";

import { Add } from "@material-symbols-svg/react/rounded";
import Link from "next/link";
import { LpCarousel } from "@/components/Builder/lp-carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui-patterns/container";
import {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderDescription,
  HeaderHeading,
} from "@/components/ui-patterns/header";
import { PageContent } from "@/components/ui-patterns/page-content";
import type { LpListItem } from "@/lib/landing-pages/lp-store";

type HomePageClientProps = {
  lps: LpListItem[];
};

export function HomePageClient({ lps }: HomePageClientProps) {
  return (
    <Container orientation="vertical" overflow="hidden" className="min-h-0 flex-1">
      <Header>
        <HeaderContent>
          <HeaderHeading>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Suas landing pages
            </h1>
          </HeaderHeading>
          <HeaderDescription>
            Cadastre uma página e ela é gerada na hora. Depois você ajusta e
            aprova por aqui.
          </HeaderDescription>
        </HeaderContent>
        <HeaderActions>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/nova">
              <Add size={16} /> Nova landing page
            </Link>
          </Button>
        </HeaderActions>
      </Header>

      <PageContent>
        {lps.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-8 text-center sm:py-12">
              <p className="text-sm font-medium text-foreground">
                Nenhuma página ainda
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Clique em &quot;Nova landing page&quot; para começar.
              </p>
              <Button asChild className="mt-5" size="lg">
                <Link href="/nova">
                  <Add size={16} /> Criar minha primeira página
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <LpCarousel lps={lps} />
        )}
      </PageContent>
    </Container>
  );
}
