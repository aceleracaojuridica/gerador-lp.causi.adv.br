"use client";

import type React from "react";

export function ChevronUpIcon({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-labelledby="chevron-up-title"
      {...props}
    >
      <title id="chevron-up-title">Chevron Up</title>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
