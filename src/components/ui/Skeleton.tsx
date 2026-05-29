import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tailwind sizing/shape utilities, e.g. "h-4 w-32" or "h-24 w-full rounded-2xl". */
  className?: string;
}

/**
 * Base skeleton primitive (#155).
 *
 * Renders an animated shimmer block using the shared `.skeleton-cell` style
 * (defined in globals.css), so loading placeholders match the design system and
 * stay consistent across the app. Compose with width/height/rounded utilities:
 *
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-24 w-full rounded-2xl" />
 *
 * Decorative by default (`aria-hidden`) — screen readers should be told the
 * region is loading via the surrounding container, not each shimmer block.
 */
export default function Skeleton({ className = "", ...rest }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton-cell ${className}`} {...rest} />;
}
