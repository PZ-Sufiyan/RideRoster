import React from 'react';
import { formatVehicleStatusLabel, isVehicleInactive, isVehicleOffRoad } from '../utils/vehicleStatus';

export default function VehicleStatusBadge({ status, className = '' }) {
    const offRoad = isVehicleOffRoad(status);
    const inactive = isVehicleInactive(status);
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                inactive
                    ? 'bg-gray-100 text-gray-600 border border-gray-200'
                    : offRoad
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            } ${className}`}
        >
            {formatVehicleStatusLabel(status)}
        </span>
    );
}
