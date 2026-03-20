import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MdPerson } from 'react-icons/md'

import { getActiveSosAlerts } from '../../../../services/sosService'

const DEFAULT_CENTER = [0, 0]
const DEFAULT_ZOOM = 12
const NEARBY_DRIVERS_AVAILABLE = 2

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
    iconSize: [30 * scale, 30 * scale],
    iconAnchor: [15 * scale, 15 * scale],
    html: `
      <div style="
        width: 30px;
        height: 30px;
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

  const mapCenter = useMemo(() => {
    if (!activeSosAlerts.length) return DEFAULT_CENTER

    const avgLat =
      activeSosAlerts.reduce((sum, a) => sum + (Number.isFinite(a.latitude) ? a.latitude : 0), 0) /
      activeSosAlerts.length
    const avgLng =
      activeSosAlerts.reduce((sum, a) => sum + (Number.isFinite(a.longitude) ? a.longitude : 0), 0) /
      activeSosAlerts.length

    if (!Number.isFinite(avgLat) || !Number.isFinite(avgLng)) return DEFAULT_CENTER
    return [avgLat, avgLng]
  }, [activeSosAlerts])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Global SOS Monitoring</h1>
        <p className="text-sm text-gray-500">Live view of all active SOS alerts across the platform.</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative bg-[#9BCFF5] overflow-hidden">
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

            {activeSosAlerts.map((alert) => (
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

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
              <div className="bg-white/90 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 shadow-sm">
                Loading SOS alerts...
              </div>
            </div>
          )}
        </div>

        <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-20 shadow-xl">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Active SOS Alerts</h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Loading...' : `${activeSosAlerts.length} incidents require attention.`}
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeSosAlerts.map((alert) => {
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

                  <button className="text-sm font-medium text-[#0088CC] hover:text-[#006699] hover:underline transition-colors block">
                    View nearby drivers ({NEARBY_DRIVERS_AVAILABLE} available)
                  </button>
                </div>
              )
            })}

            {!loading && activeSosAlerts.length === 0 && (
              <div className="pt-8 text-center">
                <p className="text-sm text-gray-400">No active SOS alerts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SOSPage
