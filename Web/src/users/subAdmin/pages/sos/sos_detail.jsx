import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate, useParams } from 'react-router-dom'
import {
    MdClose,
    MdWarning,
    MdLocalPhone,
    MdPerson,
} from 'react-icons/md'

import { supabase } from '../../../../lib/supabaseClient'
import { getCompanyAdminById } from '../../../../services/companyService'
import {
    getSosDetailForCompany,
    getSosUrgencyPresentation,
    resolveSosForCompany,
    reverseGeocodeAddress,
} from '../../../../services/sosService'
import { LoadingStatus } from '../../../../utils/Shimmer'

const DEFAULT_MAP_ZOOM = 15

const formatRelativeTime = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return '—'

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 10) return 'just now'

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
}

const formatAlertTime = (isoString) => {
    if (!isoString) return '—'
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const driverDisplayName = (driver) => {
    if (!driver) return '—'
    const first = (driver.first_name || '').trim()
    const last = (driver.last_name || '').trim()
    const name = [first, last].filter(Boolean).join(' ')
    return name || '—'
}

const jobIdLabel = (job) => {
    if (!job) return '—'
    if (job.internal_job_id && String(job.internal_job_id).trim()) return String(job.internal_job_id).trim()
    const id = job.id
    if (typeof id === 'string' && id.length > 8) return `Job ${id.slice(0, 8)}…`
    return job.job_name || '—'
}

const sosTriggeredByLabel = (sos) =>
    sos?.passenger_assistant_id
        ? 'SOS Button Activated by Passenger Assistant'
        : 'SOS Button Activated by Driver'

const createSosIcon = ({ color = '#ef4444' } = {}) => {
    const safe = color || '#ef4444'
    return L.divIcon({
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        html: `
      <div style="
        min-width: 36px;
        height: 36px;
        padding: 0 8px;
        border-radius: 9999px;
        background: ${safe};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 11px;
        border: 3px solid white;
        box-shadow: 0 6px 18px rgba(0,0,0,0.25);
      ">
        SOS
      </div>
    `,
    })
}

const SubAdmin_SOSDetail = () => {
    const navigate = useNavigate()
    const { id: sosId } = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [detail, setDetail] = useState(null)
    const [locationLabel, setLocationLabel] = useState(null)
    const [resolving, setResolving] = useState(false)

    const load = useCallback(async () => {
        setError(null)
        setLoading(true)
        setDetail(null)
        setLocationLabel(null)

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            const uid = session?.user?.id
            if (!uid) {
                setError('Not authenticated.')
                return
            }
            const scope = await getCompanyAdminById(uid)
            const companyId = scope?.company_id
            if (!companyId) {
                setError('No company linked to your account.')
                return
            }
            if (!sosId) {
                setError('Missing SOS id.')
                return
            }

            const data = await getSosDetailForCompany(sosId, companyId)
            if (!data) {
                setError('SOS alert not found or you do not have access.')
                return
            }
            setDetail(data)

            const lat = Number(data.sos?.latitude)
            const lng = Number(data.sos?.longitude)
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                reverseGeocodeAddress(lat, lng).then((addr) => {
                    if (addr) setLocationLabel(addr)
                })
            }
        } catch (e) {
            setError(e?.message || 'Failed to load SOS details.')
        } finally {
            setLoading(false)
        }
    }, [sosId])

    useEffect(() => {
        load()
    }, [load])

    const mapCenter = useMemo(() => {
        if (!detail?.sos) return [37.7749, -122.4194]
        const lat = Number(detail.sos.latitude)
        const lng = Number(detail.sos.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [37.7749, -122.4194]
        return [lat, lng]
    }, [detail])

    const mapKey = mapCenter.join(',')

    const urgency = detail ? getSosUrgencyPresentation(detail.sos?.notes) : null

    const hasValidCoords =
        detail &&
        Number.isFinite(Number(detail.sos.latitude)) &&
        Number.isFinite(Number(detail.sos.longitude))

    const vehicleLine = useMemo(() => {
        if (!detail) return '—'
        const v = detail.vehicle
        const name = (v?.name && v.name.trim()) || 'Vehicle'
        const plate = v?.taxi_license_plate_number || '—'
        return `${name} (${plate})`
    }, [detail])

    const timeLine = useMemo(() => {
        if (!detail?.sos?.created_at) return '—'
        const t = formatAlertTime(detail.sos.created_at)
        const rel = formatRelativeTime(detail.sos.created_at)
        return `${t} (${rel})`
    }, [detail])

    const locationDisplay =
        locationLabel ||
        (detail?.sos &&
        Number.isFinite(Number(detail.sos.latitude)) &&
        Number.isFinite(Number(detail.sos.longitude))
            ? `${Number(detail.sos.latitude).toFixed(5)}, ${Number(detail.sos.longitude).toFixed(5)}`
            : '—')

    const manifestCount =
        detail?.passengers?.length > 0 ? detail.passengers.length : detail?.sos?.number_of_passenger ?? 0

    const paLabel = detail?.passengerAssistant
        ? [detail.passengerAssistant.first_name, detail.passengerAssistant.surname].filter(Boolean).join(' ')
        : null

    const handleResolve = async () => {
        if (!detail?.sos?.id || resolving) return
        setResolving(true)
        setError(null)
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            const uid = session?.user?.id
            if (!uid) throw new Error('Not authenticated.')
            const scope = await getCompanyAdminById(uid)
            const companyId = scope?.company_id
            if (!companyId) throw new Error('No company linked to your account.')

            await resolveSosForCompany(detail.sos.id, companyId)
            navigate('/team/sos')
        } catch (e) {
            setError(e?.message || 'Could not resolve alert.')
        } finally {
            setResolving(false)
        }
    }

    const status = detail?.sos?.status
    const isResolved = status === 'resolved' || status === 'cancelled'

    return (
        <div className="relative -m-6 mt-1 h-[calc(100vh-64px)] overflow-hidden bg-gray-100 font-sans">
            {/* Map */}
            <div className="absolute inset-0 z-0">
                {!loading && detail && hasValidCoords ? (
                    <MapContainer
                        key={mapKey}
                        center={mapCenter}
                        zoom={DEFAULT_MAP_ZOOM}
                        scrollWheelZoom
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                            position={[Number(detail.sos.latitude), Number(detail.sos.longitude)]}
                            icon={createSosIcon({ color: urgency?.markerColor })}
                        />
                    </MapContainer>
                ) : (
                    <div className="w-full h-full bg-[#e8eef3] flex items-center justify-center px-6">
                        {loading ? (
                            <LoadingStatus label="Loading map">
                                <div className="h-10 w-10 rounded-full bg-gray-300/80 animate-pulse mx-auto" />
                            </LoadingStatus>
                        ) : detail && !hasValidCoords ? (
                            <p className="text-sm text-gray-500 text-center">No valid coordinates for this alert.</p>
                        ) : (
                            <p className="text-sm text-gray-500 text-center">Map unavailable.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Detail panel */}
            <div className="absolute top-0 right-0 h-full w-[450px] max-w-[100vw] bg-white shadow-2xl z-10 flex flex-col border-l border-gray-100">
                <div className="p-5 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex gap-4 min-w-0">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                            <MdWarning size={28} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-gray-900">SOS Alert Details</h2>
                            <p className="text-sm font-medium text-gray-500 mt-0.5 truncate">
                                Job ID: {detail ? jobIdLabel(detail.job) : '—'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/team/sos')}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors shrink-0"
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    {loading && (
                        <LoadingStatus label="Loading alert details">
                            <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                            <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                        </LoadingStatus>
                    )}

                    {!loading && detail && (
                        <>
                            <div className="bg-red-50/40 border border-red-100 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-red-600 mb-3">Alert Summary</h3>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-start gap-3 text-sm">
                                        <span className="text-gray-500 shrink-0">Time of Alert:</span>
                                        <span className="font-bold text-gray-900 text-right">{timeLine}</span>
                                    </div>
                                    <div className="flex justify-between items-start gap-3 text-sm">
                                        <span className="text-gray-500 shrink-0">Location:</span>
                                        <span className="font-bold text-gray-900 text-right break-words max-w-[240px]">
                                            {locationDisplay}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Vehicle:</span>
                                        <span className="font-bold text-gray-900 text-right">{vehicleLine}</span>
                                    </div>
                                    {paLabel && (
                                        <div className="flex justify-between items-start gap-3 text-sm">
                                            <span className="text-gray-500 shrink-0">Passenger assistant:</span>
                                            <span className="font-bold text-gray-900 text-right">{paLabel}</span>
                                        </div>
                                    )}
                                    {detail.sos?.notes && (
                                        <div className="pt-2 border-t border-red-100/80">
                                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                                            <p className="text-sm text-gray-800">{detail.sos.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <section>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">
                                    Driver Information
                                </h3>
                                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                                    <div className="w-14 h-14 rounded-xl bg-[#005580]/10 flex items-center justify-center text-[#005580] font-bold text-lg shrink-0">
                                        {detail.driver
                                            ? `${(detail.driver.first_name || '?')[0] || '?'}${(detail.driver.last_name || '?')[0] || '?'}`
                                            : '—'}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-gray-900">{driverDisplayName(detail.driver)}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            ID: {detail.driver?.license_no?.trim() || '—'}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1.5 font-medium">
                                            <MdLocalPhone size={14} className="text-gray-400 shrink-0" />
                                            {detail.driver?.phone?.trim() || '—'}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">
                                    Passenger Manifest ({manifestCount})
                                </h3>
                                {!detail.job?.id && (
                                    <p className="text-sm text-gray-500 mb-3">
                                        No job linked to this SOS. Passenger list is unavailable; expected passengers
                                        (count): {detail.sos?.number_of_passenger ?? 0}.
                                    </p>
                                )}
                                {detail.job?.id && detail.passengers.length === 0 && (
                                    <p className="text-sm text-gray-500">No passengers assigned to this job in routes.</p>
                                )}
                                <div className="space-y-3">
                                    {detail.passengers.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex flex-col p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#005580] shrink-0">
                                                    <MdPerson size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900">{p.displayName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{p.subtitle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">
                                    Action Log
                                </h3>
                                <div className="relative pl-6 py-1">
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-100" />
                                    <div className="relative">
                                        <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-red-400 border-2 border-white" />
                                        <h4 className="text-sm font-bold text-gray-900 leading-tight">
                                            {sosTriggeredByLabel(detail.sos)}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Manual Trigger — {formatAlertTime(detail.sos.created_at)} (
                                            {formatRelativeTime(detail.sos.created_at)})
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        disabled={!detail?.job?.id}
                        onClick={() => detail?.job?.id && navigate(`/team/jobs/${detail.job.id}`)}
                        className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                    >
                        View Job Details
                    </button>
                    <button
                        type="button"
                        disabled={resolving || isResolved || !detail}
                        onClick={handleResolve}
                        className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-shadow shadow-md shadow-red-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isResolved ? 'Already resolved' : resolving ? 'Resolving…' : 'Resolve Alert'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SubAdmin_SOSDetail
