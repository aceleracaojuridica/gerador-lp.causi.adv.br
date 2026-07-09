"use client";

import { KeyboardArrowDown } from "@material-symbols-svg/react/rounded";
import type { LeadDto } from "@/app/actions/leads";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fmtData, hasCustomAnswers, lpLabelFromUrl } from "@/lib/leads/format";
import { cn } from "@/lib/utils";

type LeadAnswersSheetProps = {
  lead: LeadDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function buildAnswerRows(lead: LeadDto) {
  const rows: { label: string; value: string }[] = [];

  for (const [label, value] of Object.entries(lead.answers ?? {})) {
    if (value.trim()) rows.push({ label, value: value.trim() });
  }

  rows.push({
    label: "Página",
    value: lpLabelFromUrl(lead.page_url),
  });
  if (lead.telefone?.trim()) {
    rows.push({ label: "Telefone", value: lead.telefone.trim() });
  }

  return rows;
}

export function LeadAnswersSheet({
  lead,
  open,
  onOpenChange,
}: LeadAnswersSheetProps) {
  if (!lead || !hasCustomAnswers(lead.answers)) return null;

  const rows = buildAnswerRows(lead);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{lead.nome?.trim() || "Contato"}</SheetTitle>
          <SheetDescription>
            Respostas do formulário · {fmtData(lead.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-hidden rounded-lg border">
          {rows.map((row, i) => (
            <Collapsible key={`${row.label}-${i}`}>
              <div
                className={cn(
                  "text-sm",
                  i % 2 === 0 ? "bg-muted/40" : "bg-background",
                )}
              >
                <CollapsibleTrigger className="group grid w-full grid-cols-12 items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 [&[data-state=open]>svg]:rotate-180">
                  <span className="col-span-4 font-medium text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="col-span-7 truncate text-foreground group-data-[state=open]:hidden">
                    {row.value}
                  </span>
                  <KeyboardArrowDown className="col-span-1 size-4 shrink-0 justify-self-end text-muted-foreground transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-12 gap-3 px-4 pb-3">
                    <span className="col-span-4" aria-hidden />
                    <span className="col-span-8 whitespace-pre-wrap text-foreground">
                      {row.value}
                    </span>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
