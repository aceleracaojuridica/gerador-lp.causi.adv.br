"use client";

import { Close } from "@material-symbols-svg/react/rounded/w600";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DialogPortalContainerContext = React.createContext<HTMLElement | null>(
  null,
);

function useDialogPortalContainer() {
  return React.useContext(DialogPortalContainerContext);
}

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const dialogPortalContainer = useDialogPortalContainer();

  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      container={container ?? dialogPortalContainer ?? undefined}
      {...props}
    />
  );
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-card-foreground/70 dark:bg-background/70 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(function DialogContent(
  { className, children, showCloseButton = true, ...props },
  forwardedRef,
) {
  const parentPortalContainer = useDialogPortalContainer();
  const isStacked = Boolean(parentPortalContainer);
  const [portalContainer, setPortalContainer] =
    React.useState<HTMLElement | null>(null);

  const handleRef = React.useCallback(
    (node: React.ElementRef<typeof DialogPrimitive.Content> | null) => {
      setPortalContainer(node);

      if (typeof forwardedRef === "function") {
        forwardedRef(node);
        return;
      }

      if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay
        className={
          isStacked
            ? "m-[-1px] rounded-xl bg-card-foreground/50 dark:bg-background/50"
            : undefined
        }
      />
      <DialogPrimitive.Content
        ref={handleRef}
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 flex flex-col w-full max-w-[calc(100%-2rem)] max-h-[calc(100dvh-40px)] translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-card shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className,
          isStacked &&
            "w-[calc(100%-36px)] max-w-[calc(100%-36px)] sm:max-w-[calc(100%-36px)]",
        )}
        {...props}
      >
        <DialogPortalContainerContext.Provider value={portalContainer}>
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className="absolute top-3 md:top-4 right-2 md:right-3.5 text-muted-foreground-light rounded-xs transition-colors hover:text-muted-foreground focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <Close className="size-6" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          )}
        </DialogPortalContainerContext.Provider>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1 p-4 md:p-5 border-b", className)}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("flex-1 overflow-y-auto p-4 md:p-5", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex px-4 py-3 md:px-5 md:py-4 gap-3 *:flex-1 sm:justify-end border-t",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline" size="lg">
            Cancelar
          </Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogBody,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  useDialogPortalContainer,
};
