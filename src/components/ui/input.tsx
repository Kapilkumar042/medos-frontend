import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onKeyDown, onWheel, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);

      if (type === "number" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
      }
    };

    const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
      onWheel?.(event);

      if (type === "number") {
        event.currentTarget.blur();
      }
    };

    return (
      <input
        {...props}
        ref={ref}
        type={type}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        className={cn(
          "flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };