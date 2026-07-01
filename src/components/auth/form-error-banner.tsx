interface FormErrorBannerProps {
  message: string | null;
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}
