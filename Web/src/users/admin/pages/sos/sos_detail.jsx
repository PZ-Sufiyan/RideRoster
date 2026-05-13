import React, { useCallback, useEffect, useMemo, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
    MdClose,
    MdWarning,
    MdLocalPhone,
    MdPerson,
    MdEmail,
} from 'react-icons/md'

import { supabase } from '../../../../lib/supabaseClient'
import { getCompanyAdminById } from '../../../../services/companyService'
import {
    getSosDetailForCompany,
    resolveSosForCompany,
    reverseGeocodeAddress,
    updateSosNotesForCompany,
} from '../../../../services/sosService'
import { LoadingStatus } from '../../../../utils/Shimmer'
import SOSMapView from './components/SOSMapView'
import { useSOSMonitor } from './hooks/useSOSMonitor'

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

const toRadians = (value) => (value * Math.PI) / 180
const distanceKmBetween = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return earthRadiusKm * c
}

const SOSDetail = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { id: sosId } = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [detail, setDetail] = useState(null)
    const [locationLabel, setLocationLabel] = useState(null)
    const [resolving, setResolving] = useState(false)
    const [savingNotes, setSavingNotes] = useState(false)
    const [companyId, setCompanyId] = useState(null)
    const [noteMessage, setNoteMessage] = useState('')

    const { activeSOS, drivers } = useSOSMonitor(companyId)

    const radiusKm = useMemo(() => {
        const params = new URLSearchParams(location.search)
        const raw = Number(params.get('radius'))
        if (!Number.isFinite(raw) || raw <= 0) return 10
        return raw
    }, [location.search])

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
            const admin = await getCompanyAdminById(uid)
            const companyId = admin?.company_id
            if (!companyId) {
                setError('No company linked to your account.')
                return
            }
            setCompanyId(companyId)
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
            setNoteMessage(data.sos?.notes || '')

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
    const sosPoint = detail?.sos || activeSOS || null

    const sosDriverId = detail?.sos?.driver_id || detail?.driver?.id || null
    const isSosActive = detail?.sos?.status === 'active'
    const excludedSosDriverId = isSosActive ? sosDriverId : null

    const nearbyDrivers = useMemo(() => {
        if (!sosPoint) return []
        const sosLat = Number(sosPoint.latitude)
        const sosLng = Number(sosPoint.longitude)
        if (!Number.isFinite(sosLat) || !Number.isFinite(sosLng)) return []

        return drivers
            .map((driver) => {
                if (excludedSosDriverId && driver.driver_id === excludedSosDriverId) return null

                const lat = Number(driver.latitude)
                const lng = Number(driver.longitude)
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

                const distanceKm = distanceKmBetween(sosLat, sosLng, lat, lng)
                if (distanceKm > radiusKm) return null

                return {
                    ...driver,
                    distanceKm,
                }
            })
            .filter(Boolean)
            .sort((a, b) => a.distanceKm - b.distanceKm)
    }, [drivers, radiusKm, sosPoint, excludedSosDriverId])

    const handleResolve = async () => {
        if (!detail?.sos?.id || resolving) return
        const notes = (detail?.sos?.notes || '').trim()
        if (notes.length < 10) {
            setError('Please save notes with at least 10 characters before resolving this alert.')
            return
        }
        if (notes.toLowerCase() === 'SOS triggered from driver app.'.toLowerCase()) {
            setError(
                'Please replace the default note ("SOS triggered from driver app.") with a real resolution note before resolving.'
            )
            return
        }
        setResolving(true)
        setError(null)
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            const uid = session?.user?.id
            if (!uid) throw new Error('Not authenticated.')
            const admin = await getCompanyAdminById(uid)
            const companyId = admin?.company_id
            if (!companyId) throw new Error('No company linked to your account.')

            await resolveSosForCompany(detail.sos.id, companyId)
            navigate('/portal/sos')
        } catch (e) {
            setError(e?.message || 'Could not resolve alert.')
        } finally {
            setResolving(false)
        }
    }

    const handleSaveNotes = async () => {
        if (!detail?.sos?.id || !companyId || savingNotes) return
        setSavingNotes(true)
        setError(null)
        try {
            const updated = await updateSosNotesForCompany(detail.sos.id, companyId, noteMessage)
            setDetail((current) =>
                current
                    ? {
                          ...current,
                          sos: {
                              ...current.sos,
                              notes: updated.notes,
                          },
                      }
                    : current
            )
        } catch (e) {
            setError(e?.message || 'Could not save notes.')
        } finally {
            setSavingNotes(false)
        }
    }

    const status = detail?.sos?.status
    const isResolved = status === 'resolved' || status === 'cancelled'

    const MIN_NOTES_LENGTH = 10
    const DEFAULT_SOS_NOTE = 'SOS triggered from driver app.'
    const savedNotes = (detail?.sos?.notes || '').trim()
    const isDefaultNote = savedNotes.toLowerCase() === DEFAULT_SOS_NOTE.toLowerCase()
    const hasValidNotes = savedNotes.length >= MIN_NOTES_LENGTH && !isDefaultNote
    const canResolve = !resolving && !isResolved && !!detail && hasValidNotes

    return (
        <div className="relative -m-6 mt-1 h-[calc(100vh-64px)] overflow-hidden bg-gray-100 font-sans">
            {/* Map */}
            <div className="absolute inset-0 z-0">
                {!loading && detail && hasValidCoords ? (
                    <SOSMapView activeSOS={sosPoint} drivers={nearbyDrivers} radiusKm={radiusKm} />
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
                        onClick={() => navigate('/portal/sos')}
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
                                            SOS Button Activated by Driver
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Manual Trigger — {formatAlertTime(detail.sos.created_at)} (
                                            {formatRelativeTime(detail.sos.created_at)})
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">
                                    Nearby Drivers ({nearbyDrivers.length}) within {radiusKm.toFixed(1)} km
                                </h3>
                                {nearbyDrivers.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No online drivers are currently inside this radius.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {nearbyDrivers.map((driver) => (
                                            <div
                                                key={driver.driver_id}
                                                className="border border-gray-100 rounded-lg p-3 space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {driver.driver_name}
                                                    </p>
                                                    <p className="text-xs font-semibold text-blue-600 whitespace-nowrap">
                                                        {driver.distanceKm.toFixed(2)} km
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium min-w-0">
                                                    <MdLocalPhone size={13} className="text-gray-400 shrink-0" />
                                                    {driver.driver_phone ? (
                                                        <a
                                                            href={`tel:${driver.driver_phone}`}
                                                            className="truncate hover:text-[#005580] hover:underline"
                                                        >
                                                            {driver.driver_phone}
                                                        </a>
                                                    ) : (
                                                        <span className="truncate text-gray-400">—</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium min-w-0">
                                                    <MdEmail size={13} className="text-gray-400 shrink-0" />
                                                    {driver.driver_email ? (
                                                        <a
                                                            href={`mailto:${driver.driver_email}`}
                                                            className="truncate hover:text-[#005580] hover:underline"
                                                        >
                                                            {driver.driver_email}
                                                        </a>
                                                    ) : (
                                                        <span className="truncate text-gray-400">—</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Vehicle: {driver.vehicle_plate || '—'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Last update: {formatRelativeTime(driver.updated_at)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider text-[11px]">
                                    Note Message
                                </h3>
                                <div className="space-y-2.5">
                                    <textarea
                                        rows={4}
                                        value={noteMessage}
                                        onChange={(e) => setNoteMessage(e.target.value)}
                                        placeholder="Add notes for this SOS alert"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveNotes}
                                        disabled={savingNotes || !detail?.sos?.id}
                                        className="px-4 py-2 bg-[#005580] text-white rounded-lg text-sm font-semibold hover:bg-[#004766] disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {savingNotes ? 'Saving...' : 'Save Notes'}
                                    </button>
                                    {!isResolved && !hasValidNotes && (
                                        <p className="text-xs text-gray-500">
                                            {isDefaultNote
                                                ? `Replace the default note ("${DEFAULT_SOS_NOTE}") with a real resolution note (at least ${MIN_NOTES_LENGTH} characters) to enable resolving this alert.`
                                                : `Save notes with at least ${MIN_NOTES_LENGTH} characters to enable resolving this alert.`}
                                        </p>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        disabled={!detail?.job?.id}
                        onClick={() => detail?.job?.id && navigate(`/portal/jobs/${detail.job.id}`)}
                        className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                    >
                        View Job Details
                    </button>
                    <button
                        type="button"
                        disabled={!canResolve}
                        onClick={handleResolve}
                        title={
                            isResolved
                                ? 'This SOS alert is already resolved.'
                                : isDefaultNote
                                  ? `Replace the default note ("${DEFAULT_SOS_NOTE}") with a real resolution note before resolving.`
                                  : !hasValidNotes
                                    ? `Save notes with at least ${MIN_NOTES_LENGTH} characters before resolving.`
                                    : undefined
                        }
                        className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-shadow shadow-md shadow-red-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isResolved ? 'Already resolved' : resolving ? 'Resolving…' : 'Resolve Alert'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SOSDetail
