"use client";

import { AddPhotoAlternate } from "@material-symbols-svg/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Modal de solicitação de suporte técnico — categoria, assunto, mensagem e anexo de imagem. */
export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    toast.success("Solicitação de suporte enviada com sucesso!");
    // Aqui você implementaria a lógica de envio do formulário
    console.log("Enviando solicitação de suporte:", {
      category,
      subject,
      message,
    });
    onClose();
    // Resetar campos
    setCategory("");
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
            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duvida">Dúvida</SelectItem>
                  <SelectItem value="problema">Problema</SelectItem>
                  <SelectItem value="sugestao">Sugestão</SelectItem>
                  <SelectItem value="bug">Reportar Bug</SelectItem>
                  <SelectItem value="melhoria">
                    Solicitação de Melhoria
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assunto */}
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto da sua solicitação"
              />
            </div>

            {/* Mensagem */}
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

            {/* Captura de tela */}
            <div className="space-y-2">
              <Label htmlFor="screenshot">Captura de tela</Label>
              <p className="text-sm text-muted-foreground">
                Envie uma captura de tela relacionada a sua solicitação
                (opcional)
              </p>
              <Button
                variant="outline"
                className="w-full border border-accent-foreground/20 text-muted-foreground"
              >
                <AddPhotoAlternate className="w-4 h-4" />
                Adicionar imagem
              </Button>
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
            disabled={!category || !subject || !message}
          >
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
