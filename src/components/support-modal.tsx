"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { buildSupportWhatsAppUrl } from "@/lib/support/whatsapp";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Modal de suporte — monta mensagem padrão e abre o WhatsApp via wa.me. */
export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const session = useSession();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const url = buildSupportWhatsAppUrl(session, subject, message);
    if (!url) {
      toast.error("WhatsApp de suporte não configurado.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
    setSubject("");
    setMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Suporte</DialogTitle>
        </DialogHeader>

        <DialogBody className="py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto da sua solicitação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva em detalhes sua solicitação"
                className="min-h-[100px]"
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex gap-2 justify-center">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="flex-1 max-w-xs border border-accent-foreground/20 text-muted-foreground"
            >
              Voltar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            className="flex-1 max-w-xs"
            disabled={!subject.trim() || !message.trim()}
          >
            Enviar no WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
