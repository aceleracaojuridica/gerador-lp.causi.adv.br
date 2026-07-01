"use client";

import { Add, Remove } from "@material-symbols-svg/react/rounded/w600";
import { useEffect, useRef, useState } from "react";
import AvatarEditor, { type AvatarEditorRef } from "react-avatar-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { optimizeAvatarImage } from "@/lib/media/image-client";

const DEFAULT_SCALE = 1;
const MIN_SCALE = 1;
const MAX_SCALE = 2;
const SCALE_STEP = 0.01;
const EDITOR_SIZE = 240;
const EDITOR_BORDER = 10;

type AvatarImageProcessor = (args: {
  canvas: HTMLCanvasElement;
  sourceFile: File;
}) => Promise<File>;

type AvatarImageEditorDialogProps = {
  open: boolean;
  file: File | null;
  onApply: (file: File) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  applyLabel?: string;
  cancelLabel?: string;
  processImage?: AvatarImageProcessor;
};

/**
 * Dialog reutilizável para crop/zoom de avatars com guia circular.
 */
export function AvatarImageEditorDialog({
  open,
  file,
  onApply,
  onCancel,
  title = "Ajustar Imagem",
  description = "Enquadre a foto dentro da área circular e ajuste o zoom.",
  applyLabel = "Concluir",
  cancelLabel = "Cancelar",
  processImage = optimizeAvatarImage,
}: AvatarImageEditorDialogProps) {
  const editorRef = useRef<AvatarEditorRef>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setScale(DEFAULT_SCALE);
    setErrorMessage(null);
    setIsApplying(false);
  }, [open]);

  async function handleApply() {
    if (!file) {
      setErrorMessage("Nenhuma imagem foi selecionada para edição.");
      return;
    }

    const canvas = editorRef.current?.getImage();

    if (!canvas) {
      setErrorMessage("Não foi possível preparar a imagem editada.");
      return;
    }

    setIsApplying(true);
    setErrorMessage(null);

    try {
      const optimizedFile = await processImage({
        canvas,
        sourceFile: file,
      });

      onApply(optimizedFile);
    } catch {
      setErrorMessage("Falha ao processar a imagem selecionada.");
    } finally {
      setIsApplying(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isApplying) {
      onCancel();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (isApplying) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isApplying) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="flex justify-center overflow-hidden rounded-lg border bg-muted">
            <AvatarEditor
              ref={editorRef}
              image={file ?? ""}
              width={EDITOR_SIZE}
              height={EDITOR_SIZE}
              border={EDITOR_BORDER}
              borderRadius={EDITOR_SIZE / 2}
              color={[0, 0, 0, 0.55]}
              scale={scale}
              rotate={0}
              backgroundColor="transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Zoom</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {scale.toFixed(2)}x
                </span>
                <ButtonGroup>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      setScale((prev) => Math.max(MIN_SCALE, prev - 0.05))
                    }
                    disabled={isApplying}
                  >
                    <Remove className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      setScale((prev) => Math.min(MAX_SCALE, prev + 0.05))
                    }
                    disabled={isApplying}
                  >
                    <Add className="size-4" />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
            <Slider
              value={[scale]}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={SCALE_STEP}
              onValueChange={([value]) => setScale(value ?? DEFAULT_SCALE)}
              className="w-full"
              disabled={isApplying}
            />
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={isApplying}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={() => void handleApply()}
            disabled={isApplying || !file}
          >
            {isApplying ? "Processando..." : applyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
