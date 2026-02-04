"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type AnimatedCheckboxProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function AnimatedCheckbox({
  id,
  checked,
  onCheckedChange,
  className,
}: AnimatedCheckboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!checked) {
      setIsAnimating(true);
    }
    onCheckedChange(!checked);
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={handleClick}
      className={cn(
        "relative h-5 w-5 shrink-0 rounded-md border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked
          ? "border-primary bg-primary"
          : "border-muted-foreground/50 hover:border-primary/50",
        isAnimating && "animate-checkbox-pop",
        className
      )}
    >
      {/* Checkmark SVG */}
      <svg
        className={cn(
          "absolute inset-0 h-full w-full p-0.5 text-primary-foreground transition-all duration-200",
          checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M5 12l5 5L20 7"
          className={cn(
            checked && isAnimating && "animate-checkmark-draw"
          )}
          style={{
            strokeDasharray: 24,
            strokeDashoffset: checked ? 0 : 24,
          }}
        />
      </svg>

      {/* Ripple effect */}
      {isAnimating && (
        <span className="absolute inset-0 -z-10 animate-checkbox-ripple rounded-full bg-primary/30" />
      )}
    </button>
  );
}
