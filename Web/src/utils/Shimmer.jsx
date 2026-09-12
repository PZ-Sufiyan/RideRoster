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

/**
 * Skeleton for portal notification lists (admin + sub-admin).
 * Mirrors a date header + unread-dot / icon / title / body / timestamp rows.
 */
export function NotificationListSkeleton({
    rows = 8,
    iconRounded = 'rounded-full',
    groups = ['Today', 'Yesterday'],
}) {
    const firstGroupCount = Math.max(1, Math.ceil(rows / 2));
    const counts = groups.length === 1
        ? [rows]
        : [firstGroupCount, Math.max(0, rows - firstGroupCount)];

    return (
        <LoadingStatus label="Loading notifications">
            {groups.map((label, groupIndex) => {
                const count = counts[groupIndex] || 0;
                if (count === 0) return null;
                return (
                    <div key={label}>
                        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                            <ShimmerBlock className="h-3 w-16 rounded-md" />
                        </div>
                        {Array.from({ length: count }).map((_, index) => (
                            <div
                                key={`${label}-${index}`}
                                className="flex items-start px-5 py-4 border-b border-gray-100 last:border-0"
                            >
                                <ShimmerBlock
                                    className="w-2 h-2 mt-3.5 mr-3 shrink-0"
                                    rounded="rounded-full"
                                />
                                <ShimmerBlock
                                    className={`w-9 h-9 shrink-0 mr-4 mt-0.5 ${iconRounded}`}
                                    rounded={iconRounded}
                                />
                                <div className="flex-1 mt-0.5 pr-4 min-w-0 space-y-2">
                                    <ShimmerBlock
                                        className={`h-3.5 max-w-md rounded-md ${
                                            index % 3 === 0 ? 'w-3/4' : index % 3 === 1 ? 'w-2/3' : 'w-4/5'
                                        }`}
                                    />
                                    <ShimmerBlock
                                        className={`h-3.5 max-w-xl rounded-md ${
                                            index % 2 === 0 ? 'w-full' : 'w-5/6'
                                        }`}
                                    />
                                    <ShimmerBlock className="h-3 w-24 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </LoadingStatus>
    );
}
