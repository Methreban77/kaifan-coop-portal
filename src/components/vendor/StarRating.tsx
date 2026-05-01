import { Star } from "lucide-react";

interface Props {
  value: number;          // 0..5
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
}

const sizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

export function StarRating({ value, size = "md", showValue, count }: Props) {
  const rounded = Math.round(value * 2) / 2; // half-step
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rounded >= i;
          const half = !filled && rounded >= i - 0.5;
          return (
            <Star
              key={i}
              className={`${sizes[size]} ${filled ? "fill-accent text-accent" : half ? "fill-accent/50 text-accent" : "text-muted-foreground/40"}`}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium tabular-nums">
          {value.toFixed(2)}
          {typeof count === "number" && (
            <span className="text-muted-foreground font-normal"> ({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
