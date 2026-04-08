import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MdPerson } from 'react-icons/md'

import { getActiveSosAlerts } from '../../../../services/sosService'
import { ShimmerBlock, LoadingStatus } from '../../../../utils/Shimmer'

// UK default (rough geographic center) so the map doesn't open on the ocean.
const DEFAULT_CENTER = [54.5, -3.0]
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

const createSosIcon = ({ selected = false } = {}) => {
  const scale = selected ? 1.2 : 1
  return L.divIcon({
    className: '',
    iconSize: [45 * scale, 45 * scale],
    iconAnchor: [25 * scale, 25 * scale],
    html: `
      <div style="
        width: 45px;
        height: 45px;
        border-radius: 9999px;
        background: #ef4444;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        border: 3px solid white;
        box-shadow: 0 6px 18px rgba(239,68,68,0.35);
        transform: scale(${scale});
      ">
        !
      </div>
    `,
  })
}

const SOSPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSosAlerts, setActiveSosAlerts] = useState([])
  const [selectedSosId, setSelectedSosId] = useState(null)

  // View/filter state
  const [showAllSos, setShowAllSos] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('')
  const [driverFilter, setDriverFilter] = useState('')
  const [paFilter, setPaFilter] = useState('')

  const normalizeQuery = (value) =>
    (value ?? '').toString().trim().toLowerCase()

  const visibleSosAlerts = useMemo(() => {
    if (showAllSos) return activeSosAlerts

    const companyQuery = normalizeQuery(companyFilter)
    const driverQuery = normalizeQuery(driverFilter)
    const paQuery = normalizeQuery(paFilter)

    return activeSosAlerts.filter((alert) => {
      const company = normalizeQuery(alert.company_name)
      const driver = normalizeQuery(alert.driver_label)
      const pa = normalizeQuery(alert.passenger_assistant_label)

      const matchesCompany = !companyQuery || company.includes(companyQuery)
      const matchesDriver = !driverQuery || driver.includes(driverQuery)
      const matchesPa = !paQuery || pa.includes(paQuery)

      return matchesCompany && matchesDriver && matchesPa
    })
  }, [activeSosAlerts, showAllSos, companyFilter, driverFilter, paFilter])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await getActiveSosAlerts()
        if (!isMounted) return

        setActiveSosAlerts(data || [])
        setSelectedSosId((data && data[0] && data[0].id) || null)
      } catch (e) {
        if (!isMounted) return
        setError(e?.message || 'Failed to load SOS alerts.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  // Keep selection valid when filtering changes.
  useEffect(() => {
    if (!visibleSosAlerts.length) {
      setSelectedSosId(null)
      return
    }

    const isSelectedVisible = visibleSosAlerts.some((a) => a.id === selectedSosId)
    if (!isSelectedVisible) setSelectedSosId(visibleSosAlerts[0].id)
  }, [visibleSosAlerts, selectedSosId])

  const mapCenter = useMemo(() => {
    if (!visibleSosAlerts.length) return DEFAULT_CENTER

    const avgLat =
      visibleSosAlerts.reduce((sum, a) => sum + (Number.isFinite(a.latitude) ? a.latitude : 0), 0) /
      visibleSosAlerts.length
    const avgLng =
      visibleSosAlerts.reduce((sum, a) => sum + (Number.isFinite(a.longitude) ? a.longitude : 0), 0) /
      visibleSosAlerts.length

    if (!Number.isFinite(avgLat) || !Number.isFinite(avgLng)) return DEFAULT_CENTER
    return [avgLat, avgLng]
  }, [visibleSosAlerts])

  const shimmerRows = Array.from({ length: 4 })

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Global SOS Monitoring</h1>
        <p className="text-sm text-gray-500">Live view of all active SOS alerts across the platform.</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative bg-[#9BCFF5] overflow-hidden">
          {loading && (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.30), rgba(255,255,255,0.10), transparent)' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <ShimmerBlock className="w-16 h-16 border border-white/90 shadow-lg" rounded="rounded-full" />
              </div>
            </div>
          )}
          <MapContainer
            center={mapCenter}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {visibleSosAlerts.map((alert) => (
              <Marker
                key={alert.id}
                position={[alert.latitude, alert.longitude]}
                icon={createSosIcon({ selected: alert.id === selectedSosId })}
                eventHandlers={{
                  click: () => setSelectedSosId(alert.id),
                }}
              >
                <Popup>
                  <div className="text-xs" style={{ minWidth: 160 }}>
                    <div className="font-semibold text-gray-900">{`Vehicle #${alert.vehicle_id}`}</div>
                    <div className="text-gray-600">{alert.company_name || '—'}</div>
                    <div className="text-gray-500 mt-1">{formatRelativeTime(alert.created_at)}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

        </div>

        <div className="bg-white border-l border-gray-200 flex flex-col shrink-0 z-20 shadow-xl" style={{ width: '400px' }}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Active SOS Alerts</h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading
                ? 'Loading live incidents...'
                : showAllSos
                  ? `${activeSosAlerts.length} incidents require attention.`
                  : `${visibleSosAlerts.length} incidents match your filter.`}
            </p>

            <div className="mt-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="sosView"
                    checked={showAllSos}
                    onChange={() => setShowAllSos(true)}
                  />
                  All SOS
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="sosView"
                    checked={!showAllSos}
                    onChange={() => setShowAllSos(false)}
                  />
                  Filtered
                </label>
              </div>

              <div className={`mt-4 grid grid-cols-1 gap-3 ${showAllSos ? 'opacity-60' : ''}`}>
                <input
                  type="text"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  disabled={showAllSos}
                  placeholder="Company name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0088CC]/20 focus:border-[#0088CC]"
                />

                <input
                  type="text"
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  disabled={showAllSos}
                  placeholder="Driver name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0088CC]/20 focus:border-[#0088CC]"
                />

                <input
                  type="text"
                  value={paFilter}
                  onChange={(e) => setPaFilter(e.target.value)}
                  disabled={showAllSos}
                  placeholder="PA name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0088CC]/20 focus:border-[#0088CC]"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyFilter('')
                      setDriverFilter('')
                      setPaFilter('')
                    }}
                    disabled={showAllSos}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:hover:text-gray-600 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <LoadingStatus label="Loading SOS alerts" className="space-y-6">
                {shimmerRows.map((_, index) => (
                  <div key={`sos-side-skeleton-${index}`} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-3">
                      <ShimmerBlock className="h-4 w-44 max-w-[70%] rounded-md" />
                      <ShimmerBlock className="h-3 w-16 rounded-md" />
                    </div>
                    <ShimmerBlock className="h-3 w-28 rounded-md mb-4" />
                    <div className="space-y-2 mb-4">
                      <ShimmerBlock className="h-3.5 w-full rounded-md" />
                      <ShimmerBlock className="h-3.5 w-[83%] rounded-md" />
                    </div>
                    <div className="flex flex-wrap gap-y-2 gap-x-4 mb-4">
                      <ShimmerBlock className="h-5 w-28 rounded-md" />
                      <ShimmerBlock className="h-5 w-24 rounded-md" />
                      <ShimmerBlock className="h-5 w-20 rounded-md" />
                    </div>
                    <ShimmerBlock className="h-4 w-44 rounded-md" />
                  </div>
                ))}
              </LoadingStatus>
            ) : visibleSosAlerts.map((alert) => {
              const driverLabel = alert.driver_label || '—'
              const paLabel = alert.passenger_assistant_label || '—'

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedSosId(alert.id)}
                  className={`border-b border-gray-100 pb-6 last:border-0 last:pb-0 cursor-pointer transition-colors ${
                    alert.id === selectedSosId ? 'bg-red-50/40 border-red-200' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{`Vehicle #${alert.vehicle_id} - SOS Emergency`}</h3>
                    <span className="text-xs font-medium text-red-500 whitespace-nowrap">
                      {formatRelativeTime(alert.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 font-medium mb-3">{alert.company_name || '—'}</p>

                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{alert.notes || '—'}</p>

                  <div className="flex flex-wrap gap-y-2 gap-x-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MdPerson size={14} className="text-gray-400" />
                      <span>{alert.number_of_passenger} passengers</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MdPerson size={14} className="text-gray-400" />
                      <span>Driver: {driverLabel}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MdPerson size={14} className="text-gray-400" />
                      <span>PA: {paLabel}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {!loading && visibleSosAlerts.length === 0 && (
              <div className="pt-8 text-center">
                <p className="text-sm text-gray-400">
                  {showAllSos ? 'No active SOS alerts.' : 'No SOS alerts match your filter.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SOSPage
