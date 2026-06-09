import { create } from 'zustand';
import { mines, provinces, alerts, workingFaces, type AlertRecord } from '@/data/mock';

interface AppState {
  selectedProvince: string | null;
  selectedMine: string | null;
  userRole: 'group' | 'mine' | 'team';
  alertFilter: { level: string; status: string; mineId: string };
  alerts: AlertRecord[];
  setSelectedProvince: (id: string | null) => void;
  setSelectedMine: (id: string | null) => void;
  setUserRole: (role: 'group' | 'mine' | 'team') => void;
  setAlertFilter: (filter: Partial<AppState['alertFilter']>) => void;
  approveStep: (alertId: string, stepIndex: number) => void;
  getFilteredAlerts: () => AlertRecord[];
  getFilteredMines: () => typeof mines;
}

export const useStore = create<AppState>((set, get) => ({
  selectedProvince: null,
  selectedMine: null,
  userRole: 'group',
  alertFilter: { level: '', status: '', mineId: '' },
  alerts,
  setSelectedProvince: (id) => set({ selectedProvince: id, selectedMine: null }),
  setSelectedMine: (id) => set({ selectedMine: id }),
  setUserRole: (role) => set({ userRole: role }),
  setAlertFilter: (filter) => set((state) => ({ alertFilter: { ...state.alertFilter, ...filter } })),
  approveStep: (alertId, stepIndex) =>
    set((state) => ({
      alerts: state.alerts.map((alert) => {
        if (alert.id !== alertId) return alert;
        const newApprovals = [...alert.approvals];
        newApprovals[stepIndex] = {
          ...newApprovals[stepIndex],
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
        };
        const allApproved = newApprovals.every((a) => a.status === 'approved');
        return {
          ...alert,
          approvals: newApprovals,
          status: allApproved ? ('approved' as const) : alert.status,
        };
      }),
    })),
  getFilteredAlerts: () => {
    const { alertFilter, alerts: allAlerts, selectedProvince } = get();
    return allAlerts.filter((a) => {
      if (alertFilter.level && a.level !== alertFilter.level) return false;
      if (alertFilter.status && a.status !== alertFilter.status) return false;
      if (alertFilter.mineId && a.mineId !== alertFilter.mineId) return false;
      if (selectedProvince) {
        const mine = mines.find((m) => m.id === a.mineId);
        if (mine && mine.provinceId !== selectedProvince) return false;
      }
      return true;
    });
  },
  getFilteredMines: () => {
    const { selectedProvince, userRole, selectedMine } = get();
    if (userRole === 'mine' && selectedMine) {
      return mines.filter((m) => m.id === selectedMine);
    }
    if (userRole === 'team' && selectedMine) {
      return mines.filter((m) => m.id === selectedMine);
    }
    if (selectedProvince) {
      return mines.filter((m) => m.provinceId === selectedProvince);
    }
    return mines;
  },
}));

export function useMineDetail() {
  const selectedMine = useStore((s) => s.selectedMine);
  const mine = mines.find((m) => m.id === selectedMine);
  const faces = selectedMine ? workingFaces[selectedMine] || [] : [];
  return { mine: mine || null, faces };
}
