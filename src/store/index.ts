import { create } from 'zustand';
import { mines, provinces, alerts as initialAlerts, workingFaces, type AlertRecord, type RiskPoint } from '@/data/mock';

export type UserRole = 'group' | 'mine' | 'team';

interface AppState {
  selectedProvince: string | null;
  selectedMine: string | null;
  selectedFace: string | null;
  userRole: UserRole;
  roleMineId: string | null;
  alertFilter: { level: string; status: string; mineId: string };
  alerts: AlertRecord[];
  geologyUploadedPoints: RiskPoint[];
  geologyAnalyzed: boolean;
  lastAlertCheck: number;

  setSelectedProvince: (id: string | null) => void;
  setSelectedMine: (id: string | null) => void;
  setSelectedFace: (id: string | null) => void;
  setUserRole: (role: UserRole) => void;
  setRoleMineId: (id: string | null) => void;
  setAlertFilter: (filter: Partial<AppState['alertFilter']>) => void;
  approveStep: (alertId: string, stepIndex: number) => void;
  closeAlert: (alertId: string) => void;
  setGeologyUploadedPoints: (points: RiskPoint[]) => void;
  setGeologyAnalyzed: (v: boolean) => void;
  checkAndGenerateAlerts: () => void;
  checkAlertEscalation: () => void;

  getFilteredAlerts: () => AlertRecord[];
  getFilteredMines: () => typeof mines;
  getFilteredProvinces: () => typeof provinces;
  getScopeLabel: () => string;
  getComputedStats: () => {
    safetyIndex: number;
    equipmentUptimeRate: number;
    violationRate: number;
    gasOverlimitDuration: number;
    safetyIndexTrend: number;
    equipmentTrend: number;
    violationTrend: number;
    gasTrend: number;
  };
  getComputedWeeklyReport: () => {
    week: string;
    violationRate: number;
    violationRateYoy: number;
    violationRateQoq: number;
    equipmentFaultTypes: { type: string; count: number }[];
    hazardRectificationRate: number;
    totalViolations: number;
    totalFaults: number;
  };
  getComputedPrevWeeklyReport: () => {
    week: string;
    violationRate: number;
    totalViolations: number;
    totalFaults: number;
    hazardRectificationRate: number;
    equipmentFaultTypes: { type: string; count: number }[];
  };
}

export const useStore = create<AppState>((set, get) => ({
  selectedProvince: null,
  selectedMine: null,
  selectedFace: null,
  userRole: 'group',
  roleMineId: null,
  alertFilter: { level: '', status: '', mineId: '' },
  alerts: initialAlerts,
  geologyUploadedPoints: [],
  geologyAnalyzed: false,
  lastAlertCheck: Date.now(),

  setSelectedProvince: (id) => set({ selectedProvince: id, selectedMine: null }),
  setSelectedMine: (id) => set({ selectedMine: id }),
  setSelectedFace: (id) => set({ selectedFace: id }),
  setUserRole: (role) => {
    const state = get();
    if (role === 'group') {
      set({ userRole: role, roleMineId: null, selectedProvince: null, selectedMine: null });
    } else if (!state.roleMineId && role !== 'group') {
      set({ userRole: role, roleMineId: mines[0].id, selectedProvince: null, selectedMine: null });
    } else {
      set({ userRole: role, selectedProvince: null, selectedMine: null });
    }
  },
  setRoleMineId: (id) => set({ roleMineId: id, selectedProvince: null, selectedMine: null }),
  setAlertFilter: (filter) => set((state) => ({ alertFilter: { ...state.alertFilter, ...filter } })),

  approveStep: (alertId, stepIndex) =>
    set((state) => ({
      alerts: state.alerts.map((alert) => {
        if (alert.id !== alertId) return alert;
        const newApprovals = [...alert.approvals];
        newApprovals[stepIndex] = {
          ...newApprovals[stepIndex],
          status: 'approved' as const,
          approver: newApprovals[stepIndex].approver === '待指派'
            ? '当前用户'
            : newApprovals[stepIndex].approver,
          approvedAt: new Date().toISOString(),
        };
        const allApproved = newApprovals.every((a) => a.status === 'approved');
        return {
          ...alert,
          approvals: newApprovals,
          status: allApproved ? ('approved' as const) : ('processing' as const),
        };
      }),
    })),

  closeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'closed' as const } : a
      ),
    })),

  setGeologyUploadedPoints: (points) => set({ geologyUploadedPoints: points }),
  setGeologyAnalyzed: (v) => set({ geologyAnalyzed: v }),

  checkAndGenerateAlerts: () => {
    const { alerts: currentAlerts, lastAlertCheck } = get();
    const now = Date.now();
    const newAlerts: AlertRecord[] = [];

    const scopedMines = get().getFilteredMines();
    for (const mine of scopedMines) {
      const faces = workingFaces[mine.id] || [];
      for (const face of faces) {
        const existingGasAlert = currentAlerts.find(
          (a) => a.faceId === face.id && a.type === 'gas' && a.status !== 'closed'
        );
        if (face.gasConcentration > 1.0 && !existingGasAlert) {
          newAlerts.push({
            id: `alert-auto-${now}-${face.id}`,
            mineId: mine.id,
            faceId: face.id,
            level: '1',
            type: 'gas',
            status: 'pending',
            triggeredAt: new Date(now).toISOString(),
            description: `${face.name}瓦斯浓度连续10分钟超过1.0%阈值，当前值${face.gasConcentration}%`,
            approvals: [
              { role: '班组长', approver: '待指派', status: 'pending' },
              { role: '矿总工程师', approver: '待指派', status: 'pending' },
              { role: '集团安监局长', approver: '待指派', status: 'pending' },
            ],
          });
        }

        const existingViolationAlert = currentAlerts.find(
          (a) => a.faceId === face.id && a.type === 'violation' && a.status !== 'closed'
        );
        if (mine.violationRate > 10 && !existingViolationAlert) {
          newAlerts.push({
            id: `alert-auto-v-${now}-${mine.id}`,
            mineId: mine.id,
            faceId: face.id,
            level: '1',
            type: 'violation',
            status: 'pending',
            triggeredAt: new Date(now).toISOString(),
            description: `${mine.name}人员违规率连续2天超过10%，当前违规率${mine.violationRate}%`,
            approvals: [
              { role: '班组长', approver: '待指派', status: 'pending' },
              { role: '矿总工程师', approver: '待指派', status: 'pending' },
              { role: '集团安监局长', approver: '待指派', status: 'pending' },
            ],
          });
        }
      }
    }

    if (newAlerts.length > 0) {
      set((state) => ({
        alerts: [...newAlerts, ...state.alerts],
        lastAlertCheck: now,
      }));
    } else {
      set({ lastAlertCheck: now });
    }
  },

  checkAlertEscalation: () => {
    const now = Date.now();
    set((state) => ({
      alerts: state.alerts.map((alert) => {
        if (alert.level === '1' && alert.status === 'pending') {
          const elapsed = now - new Date(alert.triggeredAt).getTime();
          if (elapsed >= 60 * 60 * 1000) {
            return {
              ...alert,
              level: '2' as const,
              status: 'processing' as const,
              description: `[升级] ${alert.description}`,
              approvals: alert.approvals.map((a, i) =>
                i === 0
                  ? { ...a, approver: a.approver === '待指派' ? '系统指派' : a.approver, status: 'pending' as const }
                  : a
              ),
            };
          }
        }
        return alert;
      }),
    }));
  },

  getFilteredAlerts: () => {
    const { alertFilter, alerts: allAlerts, userRole, roleMineId } = get();
    let filtered = allAlerts;

    if (userRole === 'mine' && roleMineId) {
      filtered = filtered.filter((a) => a.mineId === roleMineId);
    } else if (userRole === 'team' && roleMineId) {
      const faces = workingFaces[roleMineId] || [];
      const faceIds = faces.map((f) => f.id);
      filtered = filtered.filter((a) => faceIds.includes(a.faceId));
    }

    return filtered.filter((a) => {
      if (alertFilter.level && a.level !== alertFilter.level) return false;
      if (alertFilter.status && a.status !== alertFilter.status) return false;
      if (alertFilter.mineId && a.mineId !== alertFilter.mineId) return false;
      return true;
    });
  },

  getFilteredMines: () => {
    const { userRole, roleMineId, selectedProvince } = get();
    if (userRole !== 'group' && roleMineId) {
      return mines.filter((m) => m.id === roleMineId);
    }
    if (selectedProvince) {
      return mines.filter((m) => m.provinceId === selectedProvince);
    }
    return mines;
  },

  getFilteredProvinces: () => {
    const { userRole, roleMineId } = get();
    if (userRole !== 'group' && roleMineId) {
      const mine = mines.find((m) => m.id === roleMineId);
      if (mine) return provinces.filter((p) => p.id === mine.provinceId);
      return [];
    }
    return provinces;
  },

  getScopeLabel: () => {
    const { userRole, roleMineId } = get();
    if (userRole === 'group') return '全国';
    if (roleMineId) {
      const mine = mines.find((m) => m.id === roleMineId);
      return mine ? mine.name : '未知矿区';
    }
    return userRole === 'mine' ? '单矿区' : '班组';
  },

  getComputedStats: () => {
    const filteredMines = get().getFilteredMines();
    const count = filteredMines.length || 1;
    const safetyIndex = +(filteredMines.reduce((s, m) => s + m.safetyIndex, 0) / count).toFixed(1);
    const equipmentUptimeRate = +(filteredMines.reduce((s, m) => s + m.equipmentUptimeRate, 0) / count).toFixed(1);
    const violationRate = +(filteredMines.reduce((s, m) => s + m.violationRate, 0) / count).toFixed(1);
    const gasOverlimitDuration = Math.round(filteredMines.reduce((s, m) => s + m.gasOverlimitDuration, 0) / count);
    return {
      safetyIndex,
      equipmentUptimeRate,
      violationRate,
      gasOverlimitDuration,
      safetyIndexTrend: +(1.5 + Math.random() * 1.5).toFixed(1),
      equipmentTrend: +(0.5 + Math.random() * 1).toFixed(1),
      violationTrend: +(-1.5 - Math.random() * 1).toFixed(1),
      gasTrend: +(-3 - Math.random() * 3).toFixed(1),
    };
  },

  getComputedWeeklyReport: () => {
    const filteredMines = get().getFilteredMines();
    const count = filteredMines.length || 1;
    const violationRate = +(filteredMines.reduce((s, m) => s + m.violationRate, 0) / count).toFixed(1);
    const totalViolations = Math.round(filteredMines.reduce((s, m) => s + m.violationRate, 0) * 10);
    const avgSafety = filteredMines.reduce((s, m) => s + m.safetyIndex, 0) / count;
    const totalFaults = Math.round(30 + (100 - avgSafety) * 1.5);
    const hazardRectificationRate = +(75 + avgSafety * 0.15 + Math.random() * 5).toFixed(1);
    const faultScale = totalFaults / 60;
    const equipmentFaultTypes = [
      { type: '采煤机故障', count: Math.round(12 * faultScale) },
      { type: '液压支架故障', count: Math.round(8 * faultScale) },
      { type: '输送机故障', count: Math.round(15 * faultScale) },
      { type: '通风设备故障', count: Math.round(5 * faultScale) },
      { type: '排水设备故障', count: Math.round(3 * faultScale) },
      { type: '电气故障', count: Math.round(10 * faultScale) },
    ];
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
    return {
      week: `第${weekNum}周`,
      violationRate,
      violationRateYoy: +(-2 + Math.random() * 4).toFixed(1),
      violationRateQoq: +(-1.5 + Math.random() * 3).toFixed(1),
      equipmentFaultTypes,
      hazardRectificationRate,
      totalViolations,
      totalFaults,
    };
  },

  getComputedPrevWeeklyReport: () => {
    const filteredMines = get().getFilteredMines();
    const count = filteredMines.length || 1;
    const violationRate = +(filteredMines.reduce((s, m) => s + m.violationRate, 0) / count + 1 + Math.random() * 2).toFixed(1);
    const totalViolations = Math.round(filteredMines.reduce((s, m) => s + m.violationRate, 0) * 12);
    const avgSafety = filteredMines.reduce((s, m) => s + m.safetyIndex, 0) / count;
    const totalFaults = Math.round(40 + (100 - avgSafety) * 1.8);
    const hazardRectificationRate = +(70 + avgSafety * 0.14 + Math.random() * 5).toFixed(1);
    const faultScale = totalFaults / 70;
    const equipmentFaultTypes = [
      { type: '采煤机故障', count: Math.round(15 * faultScale) },
      { type: '液压支架故障', count: Math.round(11 * faultScale) },
      { type: '输送机故障', count: Math.round(18 * faultScale) },
      { type: '通风设备故障', count: Math.round(7 * faultScale) },
      { type: '排水设备故障', count: Math.round(4 * faultScale) },
      { type: '电气故障', count: Math.round(13 * faultScale) },
    ];
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
    return {
      week: `第${weekNum - 1}周`,
      violationRate,
      totalViolations,
      totalFaults,
      hazardRectificationRate,
      equipmentFaultTypes,
    };
  },
}));

export function useMineDetail() {
  const selectedMine = useStore((s) => s.selectedMine);
  const mine = mines.find((m) => m.id === selectedMine);
  const faces = selectedMine ? workingFaces[selectedMine] || [] : [];
  return { mine: mine || null, faces };
}
