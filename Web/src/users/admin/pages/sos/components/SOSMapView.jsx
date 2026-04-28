import { useEffect, useMemo } from 'react'
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'

const DEFAULT_MAP_ZOOM = 15
const FALLBACK_CENTER = [37.7749, -122.4194]

const createSosIcon = () =>
    L.divIcon({
        className: '',
        iconSize: [45, 45],
        iconAnchor: [25, 25],
        html: `
      <div style="
        width: 45px;
        height: 45px;
        border-radius: 9999px;
        background: #dc2626;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        border: 3px solid white;
        box-shadow: 0 6px 18px rgba(0,0,0,0.25);
      ">
        SOS
      </div>
    `,
    })

const createDriverIcon = () =>
    L.divIcon({
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 9999px;
        background: #2563eb;
        border: 2px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    })

const FitBounds = ({ activeSOS, drivers }) => {
    const map = useMap()

    useEffect(() => {
        if (!activeSOS) return

        const points = [[Number(activeSOS.latitude), Number(activeSOS.longitude)]]
        drivers.forEach((driver) => {
            points.push([Number(driver.latitude), Number(driver.longitude)])
        })
        map.fitBounds(points, { padding: [40, 40], maxZoom: 15 })
    }, [map, activeSOS, drivers])

    return null
}

const SOSMapView = ({ activeSOS, drivers, radiusKm = 10 }) => {
    const hasValidActiveSos =
        activeSOS &&
        Number.isFinite(Number(activeSOS.latitude)) &&
        Number.isFinite(Number(activeSOS.longitude))

    const center = hasValidActiveSos
        ? [Number(activeSOS.latitude), Number(activeSOS.longitude)]
        : FALLBACK_CENTER

    const visibleDrivers = useMemo(
        () =>
            (drivers || []).filter(
                (driver) =>
                    driver.is_online &&
                    Number.isFinite(Number(driver.latitude)) &&
                    Number.isFinite(Number(driver.longitude))
            ),
        [drivers]
    )

    return (
        <MapContainer center={center} zoom={DEFAULT_MAP_ZOOM} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {hasValidActiveSos && (
                <>
                    <Marker position={center} icon={createSosIcon()} />
                    <Circle
                        center={center}
                        radius={Number(radiusKm) * 1000}
                        pathOptions={{
                            color: '#3b82f6',
                            fillColor: '#60a5fa',
                            fillOpacity: 0.15,
                            weight: 2,
                        }}
                    />
                </>
            )}

            {visibleDrivers.map((driver) => (
                <Marker
                    key={driver.driver_id}
                    position={[Number(driver.latitude), Number(driver.longitude)]}
                    icon={createDriverIcon()}
                >
                    <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent>
                        {driver.driver_name || 'Driver'}
                    </Tooltip>
                </Marker>
            ))}

            {hasValidActiveSos && <FitBounds activeSOS={activeSOS} drivers={visibleDrivers} />}
        </MapContainer>
    )
}

export default SOSMapView
