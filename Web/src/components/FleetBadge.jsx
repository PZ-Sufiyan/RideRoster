import React from 'react';
import { formatFleetLabel, formatPaTypeLabel, isPrivateFleet } from '../utils/fleet';

export default function FleetBadge({ fleet, className = '', entity = 'fleet' }) {
    const privateFleet = isPrivateFleet(fleet);
    const label = entity === 'pa' ? formatPaTypeLabel(fleet) : formatFleetLabel(fleet);
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                privateFleet
                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
            } ${className}`}
        >
            {label}
        </span>
    );
}
