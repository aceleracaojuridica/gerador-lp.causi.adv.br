export interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "warning";
  label: string;
}

/**
 * @param {StatusBadgeProps} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusColors = {
    active:
      "bg-success-foreground text-success dark:bg-success/20 dark:text-success",
    inactive:
      "bg-destructive-foreground text-destructive dark:bg-destructive/20 dark:text-destructive",
    pending:
      "bg-warning-foreground text-warning dark:bg-warning/20 dark:text-warning",
    warning:
      "bg-[#FEF3C6] text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-1 rounded-xs text-xs font-medium ${statusColors[status]}`}
    >
      {label}
    </span>
  );
}
