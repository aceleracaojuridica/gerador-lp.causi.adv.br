"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type IntegrationProviderCardProps = {
  icon: ReactNode;
  name: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  accountHint?: string;
  children?: ReactNode;
  className?: string;
};

/** Card padronizado para integrações de tracking (conta e editor de LP). */
export function IntegrationProviderCard({
  icon,
  name,
  description,
  enabled,
  onEnabledChange,
  accountHint,
  children,
  className,
}: IntegrationProviderCardProps) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border py-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
            {icon}
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">{name}</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {description}
            </CardDescription>
            {accountHint ? (
              <p className="text-[0.7rem] text-muted-foreground">
                {accountHint}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Label
            htmlFor={`integration-${name}`}
            className="text-xs text-muted-foreground"
          >
            Ativo
          </Label>
          <Switch
            id={`integration-${name}`}
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>
      </CardHeader>
      {enabled && children ? (
        <CardContent className="flex flex-col gap-4 py-4">
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}
