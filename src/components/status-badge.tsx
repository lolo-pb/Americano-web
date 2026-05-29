import { cn } from "@/lib/utils";

const toneMap = {
  pending: "bg-gold/20 text-ink ring-gold/40",
  approved: "bg-forest-soft text-forest ring-forest/20",
  published: "bg-forest-soft text-forest ring-forest/20",
  rejected: "bg-danger/12 text-danger ring-danger/20",
  draft: "bg-surface-strong text-ink ring-line",
} as const;

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof toneMap;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ring-1",
        toneMap[tone],
      )}
    >
      {label}
    </span>
  );
}
