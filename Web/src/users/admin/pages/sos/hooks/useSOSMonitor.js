import { useEffect, useState } from 'react'
import { supabase } from '../../../../../lib/supabaseClient'

const formatDriverName = (driver) => {
    const first = (driver?.first_name || '').trim()
    const last = (driver?.last_name || '').trim()
    return [first, last].filter(Boolean).join(' ') || 'Driver'
}

const enrichDriverLocations = async (rows) => {
    if (!rows.length) return []

    const driverIds = [...new Set(rows.map((row) => row.driver_id).filter(Boolean))]
    if (!driverIds.length) {
        return rows.map((row) => ({
            driver_id: row.driver_id,
            company_id: row.company_id,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            is_online: Boolean(row.is_online),
            updated_at: row.updated_at,
            driver_name: 'Driver',
            vehicle_plate: null,
            vehicle_name: null,
        }))
    }

    const [driversRes, vehiclesRes] = await Promise.all([
        supabase.from('drivers').select('id, first_name, last_name').in('id', driverIds),
        supabase
            .from('vehicles')
            .select('id, driver_id, name, taxi_license_plate_number')
            .in('driver_id', driverIds),
    ])

    const drivers = driversRes.error ? [] : driversRes.data || []
    const vehicles = vehiclesRes.error ? [] : vehiclesRes.data || []

    const driverMap = new Map((drivers || []).map((driver) => [driver.id, driver]))
    const vehicleMap = new Map()
    ;(vehicles || []).forEach((vehicle) => {
        if (!vehicleMap.has(vehicle.driver_id)) vehicleMap.set(vehicle.driver_id, vehicle)
    })

    return rows.map((row) => {
        const driver = driverMap.get(row.driver_id)
        const vehicle = vehicleMap.get(row.driver_id)
        return {
            driver_id: row.driver_id,
            company_id: row.company_id,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            is_online: Boolean(row.is_online),
            updated_at: row.updated_at,
            driver_name: formatDriverName(driver),
            vehicle_plate: vehicle?.taxi_license_plate_number || null,
            vehicle_name: vehicle?.name || null,
        }
    })
}

export const useSOSMonitor = (companyId) => {
    const [activeSOS, setActiveSOS] = useState(null)
    const [drivers, setDrivers] = useState([])

    useEffect(() => {
        if (!companyId) {
            setActiveSOS(null)
            setDrivers([])
            return undefined
        }

        let cancelled = false

        const fetchInitial = async () => {
            const [{ data: sosRows, error: sosError }, { data: locationRows, error: locationError }] =
                await Promise.all([
                    supabase
                        .from('sos')
                        .select('id, company_id, latitude, longitude, status, created_at, driver_id')
                        .eq('company_id', companyId)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false })
                        .limit(1),
                    supabase
                        .from('driver_locations')
                        .select('driver_id, company_id, latitude, longitude, is_online, updated_at')
                        .eq('company_id', companyId)
                        .eq('is_online', true),
                ])

            if (sosError) throw sosError
            if (locationError) throw locationError

            const active = sosRows && sosRows[0] ? sosRows[0] : null
            const enrichedDrivers = await enrichDriverLocations(locationRows || [])

            if (cancelled) return
            setActiveSOS(active)
            setDrivers(enrichedDrivers.filter((driver) => driver.is_online))
        }

        fetchInitial().catch(() => {
            if (cancelled) return
            setActiveSOS(null)
            setDrivers([])
        })

        const channel = supabase.channel(`sos-monitor-${companyId}`)

        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'sos',
                filter: `company_id=eq.${companyId}`,
            },
            ({ new: nextSos }) => {
                if (!nextSos || nextSos.status !== 'active') return
                setActiveSOS(nextSos)
            }
        )

        channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sos',
                filter: `company_id=eq.${companyId}`,
            },
            ({ new: nextSos }) => {
                if (!nextSos) return
                if (nextSos.status !== 'active') {
                    setActiveSOS((current) => (current?.id === nextSos.id ? null : current))
                    return
                }
                setActiveSOS((current) => (current?.id === nextSos.id ? nextSos : current))
            }
        )

        channel.on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'driver_locations',
                filter: `company_id=eq.${companyId}`,
            },
            async (payload) => {
                const incoming = payload.new
                if (!incoming || !incoming.driver_id) return

                if (!incoming.is_online) {
                    setDrivers((current) =>
                        current.filter((driver) => driver.driver_id !== incoming.driver_id)
                    )
                    return
                }

                try {
                    const [enriched] = await enrichDriverLocations([incoming])
                    if (!enriched) return
                    setDrivers((current) => {
                        const filtered = current.filter(
                            (driver) => driver.driver_id !== enriched.driver_id
                        )
                        return [enriched, ...filtered]
                    })
                } catch {
                    const fallback = {
                        driver_id: incoming.driver_id,
                        company_id: incoming.company_id,
                        latitude: Number(incoming.latitude),
                        longitude: Number(incoming.longitude),
                        is_online: Boolean(incoming.is_online),
                        updated_at: incoming.updated_at,
                        driver_name: 'Driver',
                        vehicle_plate: null,
                        vehicle_name: null,
                    }
                    setDrivers((current) => {
                        const filtered = current.filter(
                            (driver) => driver.driver_id !== fallback.driver_id
                        )
                        return [fallback, ...filtered]
                    })
                }
            }
        )

        channel.subscribe()

        return () => {
            cancelled = true
            supabase.removeChannel(channel)
        }
    }, [companyId])

    return { activeSOS, drivers }
}
