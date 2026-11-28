import { useSyncExternalStore } from 'react'
import { fetchMaintenance, setMaintenanceValue } from './supabaseData'

let enabled = false
const listeners = new Set<() => void>()

export function subscribeMaintenance(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMaintenanceSnapshot() {
  return enabled
}

export function setMaintenanceSnapshot(value: boolean) {
  enabled = value
  listeners.forEach((listener) => listener())
}

export function useMaintenance() {
  return useSyncExternalStore(subscribeMaintenance, getMaintenanceSnapshot, () => false)
}

export { fetchMaintenance, setMaintenanceValue }
