import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MdPerson } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../../../lib/supabaseClient'
import { getCompanyAdminById } from '../../../../services/companyService'
import {
    getActiveSosAlertsForCompany,
    getSosUrgencyPresentation,
} from '../../../../services/sosService'
import { ShimmerBlock, LoadingStatus } from '../../../../utils/Shimmer'

/** Used when there are no coordinates yet (avoids zooming to ocean at 0,0). */
const FALLBACK_MAP_CENTER = [54.5, -3.0]
const DEFAULT_ZOOM = 6

const formatRelativeTime = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return '—'

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 10) return 'just now'

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
}

const createSosIcon = ({ color = '#ef4444', selected = false } = {}) => {
    const scale = selected ? 1.2 : 1
    const safe = color || '#ef4444'
    return L.divIcon({
        className: '',
        iconSize: [45 * scale, 45 * scale],
        iconAnchor: [25 * scale, 25 * scale],
        html: `
      <div style="
        width: 45px;
        height: 45px;
        border-radius: 9999px;
        background: ${safe};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        border: 3px solid white;
        box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        transform: scale(${scale});
      ">
        !
      </div>
    `,
    })
}

const Admin_SOSPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeSosAlerts, setActiveSosAlerts] = useState([])
    const [selectedSosId, setSelectedSosId] = useState(null)

    const load = useCallback(async () => {
        setError(null)
        setLoading(true)
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            const uid = session?.user?.id
            if (!uid) {
                setError('Not authenticated.')
                setActiveSosAlerts([])
                return
            }
            const admin = await getCompanyAdminById(uid)
            const companyId = admin?.company_id
            if (!companyId) {
                setError('No company linked to your account.')
                setActiveSosAlerts([])
                return
            }
            const data = await getActiveSosAlertsForCompany(companyId)
            setActiveSosAlerts(data || [])
            setSelectedSosId((data && data[0] && data[0].id) || null)
        } catch (e) {
            setError(e?.message || 'Failed to load SOS alerts.')
            setActiveSosAlerts([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    useEffect(() => {
        if (!activeSosAlerts.length) {
            setSelectedSosId(null)
            return
        }
        const stillThere = activeSosAlerts.some((a) => a.id === selectedSosId)
        if (!stillThere) setSelectedSosId(activeSosAlerts[0].id)
    }, [activeSosAlerts, selectedSosId])

    const mapCenter = useMemo(() => {
        if (!activeSosAlerts.length) return FALLBACK_MAP_CENTER

        const avgLat =
            activeSosAlerts.reduce(
                (sum, a) => sum + (Number.isFinite(a.latitude) ? a.latitude : 0),
                0
            ) / activeSosAlerts.length
        const avgLng =
            activeSosAlerts.reduce(
                (sum, a) => sum + (Number.isFinite(a.longitude) ? a.longitude : 0),
                0
            ) / activeSosAlerts.length

        if (!Number.isFinite(avgLat) || !Number.isFinite(avgLng)) return FALLBACK_MAP_CENTER
        return [avgLat, avgLng]
    }, [activeSosAlerts])

    const mapKey = useMemo(() => mapCenter.join(','), [mapCenter])

    const activeCount = activeSosAlerts.length
    const shimmerRows = Array.from({ length: 3 })

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">SOS Monitoring</h1>

            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-0">
                {/* Left Sidebar */}
                <div className="w-full md:w-80 border-r border-gray-100 flex flex-col shrink-0 min-h-0">
                    <div className="p-6 border-b border-gray-50 shrink-0">
                        <h2 className="text-lg font-bold text-gray-900">
                            Active SOS Alerts ({loading ? '…' : activeCount})
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Real-time incidents from your fleet.</p>
                    </div>

                    {error && (
                        <div className="mx-6 mt-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-6">
                                <LoadingStatus label="Loading SOS alerts" className="space-y-6">
                                    {shimmerRows.map((_, index) => (
                                        <div
                                            key={`sos-admin-skeleton-${index}`}
                                            className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <ShimmerBlock className="h-4 w-40 max-w-[70%] rounded-md" />
                                                <ShimmerBlock className="h-3 w-14 rounded-md" />
                                            </div>
                                            <ShimmerBlock className="h-3 w-48 rounded-md mb-3" />
                                            <ShimmerBlock className="h-3 w-full rounded-md mb-2" />
                                            <ShimmerBlock className="h-3 w-[90%] rounded-md mb-4" />
                                            <div className="space-y-2">
                                                <ShimmerBlock className="h-3.5 w-36 rounded-md" />
                                                <ShimmerBlock className="h-3.5 w-44 rounded-md" />
                                                <ShimmerBlock className="h-3.5 w-40 rounded-md" />
                                            </div>
                                        </div>
                                    ))}
                                </LoadingStatus>
                            </div>
                        ) : (
                            activeSosAlerts.map((alert) => {
                                const urgency = getSosUrgencyPresentation(alert.notes)
                                const plate = alert.taxi_license_plate_number || '—'
                                const selected = alert.id === selectedSosId
                                return (
                                    <div
                                        key={alert.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedSosId(alert.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                setSelectedSosId(alert.id)
                                            }
                                        }}
                                        className={`p-5 hover:bg-gray-50 transition-colors cursor-pointer text-left ${
                                            selected ? 'bg-red-50/30' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <h3
                                                className={`text-sm font-bold leading-snug ${urgency.titleClass}`}
                                            >
                                                {urgency.headline}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap shrink-0">
                                                {formatRelativeTime(alert.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-800 font-semibold mb-2">
                                            Vehicle #{plate} — SOS Emergency
                                        </p>
                                        <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                            {alert.notes || '—'}
                                        </p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <MdPerson size={14} className="text-gray-400 shrink-0" />
                                                <span>
                                                    {alert.number_of_passenger} passenger
                                                    {alert.number_of_passenger === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-800">
                                                Driver: {alert.driver_label || '—'}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <MdPerson size={14} className="text-gray-400 shrink-0" />
                                                <span>PA: {alert.passenger_assistant_label || '—'}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigate(`/admin/sos/${alert.id}`)
                                            }}
                                            className="mt-3 text-sm font-medium text-[#005580] hover:text-[#003d5c] hover:underline transition-colors"
                                        >
                                            View details
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {!loading && activeSosAlerts.length === 0 && !error && (
                        <div className="p-8 text-center text-sm text-gray-400">No active SOS alerts.</div>
                    )}
                </div>

                {/* Map */}
                <div className="flex-1 relative bg-[#e8eef3] min-h-[280px]">
                    {loading && (
                        <div
                            className="absolute inset-0 z-20 pointer-events-none"
                            style={{
                                backgroundImage:
                                    'linear-gradient(to bottom right, rgba(255,255,255,0.35), rgba(255,255,255,0.08), transparent)',
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShimmerBlock
                                    className="w-16 h-16 border border-white/90 shadow-lg"
                                    rounded="rounded-full"
                                />
                            </div>
                        </div>
                    )}
                    <MapContainer
                        key={mapKey}
                        center={mapCenter}
                        zoom={DEFAULT_ZOOM}
                        scrollWheelZoom
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {activeSosAlerts.map((alert) => {
                            const urgency = getSosUrgencyPresentation(alert.notes)
                            const plate = alert.taxi_license_plate_number || '—'
                            return (
                                <Marker
                                    key={alert.id}
                                    position={[alert.latitude, alert.longitude]}
                                    icon={createSosIcon({
                                        color: urgency.markerColor,
                                        selected: alert.id === selectedSosId,
                                    })}
                                    eventHandlers={{
                                        click: () => {
                                            setSelectedSosId(alert.id)
                                        },
                                    }}
                                >
                                    <Popup>
                                        <div className="text-xs" style={{ minWidth: 140 }}>
                                            <div className="font-semibold text-gray-900">
                                                Vehicle #{plate}
                                            </div>
                                            <div className="text-gray-500 mt-1">
                                                {formatRelativeTime(alert.created_at)}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        })}
                    </MapContainer>
                    {!loading && activeSosAlerts.length === 0 && (
                        <div className="absolute inset-0 z-[300] flex items-center justify-center pointer-events-none bg-white/55">
                            <p className="text-sm text-gray-500 font-medium px-4 text-center">
                                No active SOS locations to display.
                            </p>
                        </div>
                    )}

                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm pointer-events-none z-[400]">
                        <span className="text-[10px] text-gray-500 font-medium">
                            Live map · OpenStreetMap
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Admin_SOSPage
