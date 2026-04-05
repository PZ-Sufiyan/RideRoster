import React from 'react';

/**
 * Left-to-right shimmer overlay (uses `animate-shimmer` / `profile-shimmer` in `index.css`).
 * Prefer this over bare `animate-pulse` blocks for clearer loading feedback.
 */
export function ShimmerBlock({ className = '', rounded = 'rounded-lg' }) {
    return (
        <div className={`relative overflow-hidden ${rounded} bg-gray-200/90 ${className}`} aria-hidden>
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/55 to-transparent animate-profile-shimmer" />
        </div>
    );
}

/** Wraps skeleton UIs with accessible busy state + screen-reader text. */
export function LoadingStatus({ label = 'Loading', children, className = '' }) {
    return (
        <div className={className} role="status" aria-busy="true" aria-label={label}>
            <span className="sr-only">{label}</span>
            {children}
        </div>
    );
}
