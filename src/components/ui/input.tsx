import * as React from "react";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm placeholder:italic placeholder:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    icon: LucideIcon;
  }
>(({ className, type, icon: Icon, ...props }, ref) => {
  return (
    <div className="flex items-center">
      {Icon && (
        <div className="mr-2 opacity-50">
          <Icon />
        </div>
      )}
      <Input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
InputWithIcon.displayName = "InputWithIcon";

export { Input, InputWithIcon };
