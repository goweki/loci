// ─── Divider ──────────────────────────────────────────────────────────────────

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Icon Input ───────────────────────────────────────────────────────────────

export interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  suffix?: React.ReactNode;
}

export function IconInput({
  icon: Icon,
  suffix,
  className,
  ...props
}: IconInputProps) {
  return (
    <div className="relative flex items-center">
      <Icon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input className={cn("pl-9", suffix && "pr-10", className)} {...props} />
      {suffix && (
        <div className="absolute right-0 flex h-full items-center">
          {suffix}
        </div>
      )}
    </div>
  );
}
