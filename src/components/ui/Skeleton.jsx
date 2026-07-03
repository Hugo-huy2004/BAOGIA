import React from 'react';

/**
 * Reusable Skeleton loader component using Tailwind CSS
 */
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`}
      {...props}
    />
  );
}
