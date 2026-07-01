"use client";

import { CheckCircle, Circle, PlayCircle } from "@material-symbols-svg/react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

/**
 * Sidebar de navegação de um curso com módulos, aulas e indicador de progresso.
 *
 * @remarks
 * Reutilizável tanto como sidebar fixa no desktop quanto dentro de um Sheet no mobile.
 */
export function CourseSidebar() {
  const router = useRouter();

  return (
    <div className="w-80 h-full bg-background border-r border-border flex flex-col overflow-hidden">
      {/* Header: Título + Progresso + Botão Concluir */}
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground line-clamp-2 leading-snug">
          Site para Advogados
        </h2>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">20%</span>
            <span className="text-xs text-muted-foreground">5 aulas</span>
          </div>
          <Progress value={20} className="h-1.5" />
        </div>

        {/* Botão Concluir Aula */}
        <Button size="sm" variant="default" className="w-full">
          <CheckCircle className="size-4" />
          Marcar como concluída
        </Button>
      </div>

      <Separator />

      {/* Lista de Módulos e Aulas */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="single"
          collapsible
          defaultValue="module-1"
          className="w-full"
        >
          <AccordionItem value="module-1" className="border-b border-border">
            <AccordionTrigger className="px-6 py-4 hover:bg-muted/40 hover:no-underline transition-colors">
              <span className="font-medium text-foreground text-left text-sm leading-snug">
                A importância do site para o advogado
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => router.push(`/cursos/123/aulas/1`)}
                  className="flex items-center gap-3 px-6 py-3 text-left transition-colors bg-primary/5 border-l-3 border-primary"
                >
                  <PlayCircle className="size-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 font-medium text-foreground">
                      Introdução ao módulo
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/cursos/123/aulas/2`)}
                  className="flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/40 border-l-3 border-transparent"
                >
                  <Circle className="size-5 text-muted-foreground/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      Escolhendo a plataforma
                    </p>
                  </div>
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="module-2" className="border-b border-border">
            <AccordionTrigger className="px-6 py-4 hover:bg-muted/40 hover:no-underline transition-colors">
              <span className="font-medium text-foreground text-left text-sm leading-snug">
                Conceitos para criação de sites
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => router.push(`/cursos/123/aulas/3`)}
                  className="flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/40 border-l-3 border-transparent"
                >
                  <Circle className="size-5 text-muted-foreground/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      Domínio e hospedagem
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/cursos/123/aulas/4`)}
                  className="flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/40 border-l-3 border-transparent"
                >
                  <Circle className="size-5 text-muted-foreground/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      Design responsivo
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/cursos/123/aulas/5`)}
                  className="flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/40 border-l-3 border-transparent"
                >
                  <Circle className="size-5 text-muted-foreground/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      SEO básico para advogados
                    </p>
                  </div>
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
