import type { BackendOrganizerScanStats } from '../backend';

export type AttendanceTierCard = {
  key: string;
  name: string;
  total: number;
  checkedIn: number;
  waiting: number;
  cancelled: number;
  scanRate: number;
};

export function buildAttendanceTierCards(stats: BackendOrganizerScanStats): AttendanceTierCard[] {
  return [...stats.byTier]
    .map((tier) => ({
      key: tier.tierKey,
      name: tier.tierName,
      total: tier.totalTickets,
      checkedIn: tier.scannedTickets,
      waiting: tier.pendingTickets,
      cancelled: tier.cancelledTickets,
      scanRate: tier.totalTickets > 0 ? Math.round((tier.scannedTickets / tier.totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}
