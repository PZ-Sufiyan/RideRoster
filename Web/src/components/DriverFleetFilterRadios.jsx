import React from 'react';
import { FLEET, normalizeFleet } from '../utils/fleet';

export const DRIVER_FLEET_FILTER = {
    ALL: 'all',
    COMPANY: FLEET.COMPANY,
    PRIVATE: FLEET.PRIVATE,
};

const OPTIONS = [
    { value: DRIVER_FLEET_FILTER.ALL, label: 'All Drivers' },
    { value: DRIVER_FLEET_FILTER.COMPANY, label: 'Company Driver' },
    { value: DRIVER_FLEET_FILTER.PRIVATE, label: 'Private Driver' },
];

export function driverMatchesFleetFilter(driver, filter) {
    if (!filter || filter === DRIVER_FLEET_FILTER.ALL) return true;
    return normalizeFleet(driver?.fleet) === filter;
}

export default function DriverFleetFilterRadios({
    value,
    onChange,
    name = 'driver-fleet-filter',
}) {
    return (
        <div
            className="flex flex-wrap items-center gap-x-6 gap-y-2"
            role="radiogroup"
            aria-label="Filter drivers by fleet"
        >
            {OPTIONS.map((opt) => {
                const checked = value === opt.value;
                return (
                    <label
                        key={opt.value}
                        className="inline-flex items-center gap-2 cursor-pointer select-none"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={checked}
                            onChange={() => onChange(opt.value)}
                            className="h-4 w-4 accent-[#004D6D] cursor-pointer"
                        />
                        <span className={`text-[13px] font-semibold ${checked ? 'text-[#004D6D]' : 'text-gray-600'}`}>
                            {opt.label}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}
