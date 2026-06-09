import { create } from 'zustand';
import { mines, provinces, alerts as initialAlerts, workingFaces, type AlertRecord, type RiskPoint } from '@/data/mock';

export type UserRole = 'group' | 'mine' | 'team';

interface AppState {
  selectedProvince: string | null;
  selectedMine: string | null;
  selectedFace: string | null;
  userRole: UserRole;
  roleMineId: string | null;
  roleFaceId: string | null;
  alertFilter: { level: string; status: string; mineId: string; faceId: string };
  alerts: AlertRecord[];
  geologyUploadedPoints: RiskPoint[];
  geologyAnalyzed: boolean;
  lastAlertCheck: number;

  setSelectedProvince: (id: string | null) => void;
  setSelectedMine: (id: string | null) => void;
  setSelectedFace: (id: string | null) => void;
  setUserRole: (role: UserRole) => void;
  setRoleMineId: (id: string | null) => void;
  setRoleFaceId: (id: string | null) => void;
  setAlertFilter: (filter: Partial<AppState['alertFilter']>) => void;
  approveStep: (alertId: string, stepIndex: number) => void;
  closeAlert: (alertId: string, executionRecord?: { executor: string; evacuatedCount: number }) => void;
  disposeAlert: (alertId: string, disposalRecord: { disposer: string; result: string }) => void;
  setGeologyUploadedPoints: (points: RiskPoint[]) => void;
  setGeologyAnalyzed: (v: boolean) => void;
  checkAndGenerateAlerts: () => void;
  checkAlertEscalation: () => void;

  getFilteredAlerts: () => AlertRecord[];
  getFilteredMines: () => typeof mines;
  getFilteredProvinces: () => typeof provinces;
  getFilteredFaces: () => typeof workingFaces[string];
  getFaceLevelRanking: () => { name: string; value: number; id: string }[];
  getDisposalReview: () => {
    faceId: string;
    faceName: string;
    mineName: string;
    totalAlerts: number;
    l1AvgDisposalMin: number;
    l2AvgApprovalMin: number;
    totalEvacuated: number;
    closureRate: number;
    alerts: AlertRecord[];
  }[];
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
  roleFaceId: null,
  alertFilter: { level: '', status: '', mineId: '', faceId: '' },
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
      set({ userRole: role, roleMineId: null, roleFaceId: null, selectedProvince: null, selectedMine: null, alertFilter: { level: '', status: '', mineId: '', faceId: '' } });
    } else if (!state.roleMineId) {
      const firstMine = mines[0];
      const firstFace = workingFaces[firstMine.id]?.[0];
      set({ userRole: role, roleMineId: firstMine.id, roleFaceId: role === 'team' ? firstFace?.id ?? null : null, selectedProvince: null, selectedMine: null, alertFilter: { level: '', status: '', mineId: firstMine.id, faceId: role === 'team' ? (firstFace?.id ?? '') : '' } });
    } else {
      const faces = workingFaces[state.roleMineId] || [];
      set({ userRole: role, roleFaceId: role === 'team' ? (faces[0]?.id ?? null) : null, selectedProvince: null, selectedMine: null, alertFilter: { level: '', status: '', mineId: state.roleMineId, faceId: role === 'team' ? (faces[0]?.id ?? '') : '' } });
    }
  },
  setRoleMineId: (id) => {
    const faces = id ? workingFaces[id] || [] : [];
    const { userRole } = get();
    set({ roleMineId: id, roleFaceId: userRole === 'team' ? (faces[0]?.id ?? null) : null, selectedProvince: null, selectedMine: null, alertFilter: { level: '', status: '', mineId: id || '', faceId: userRole === 'team' ? (faces[0]?.id ?? '') : '' } });
  },
  setRoleFaceId: (id) => set({ roleFaceId: id }),
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

  closeAlert: (alertId, executionRecord) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? {
          ...a,
          status: 'closed' as const,
          executionRecord: executionRecord ? {
            executedAt: new Date().toISOString(),
            executor: executionRecord.executor,
            evacuatedCount: executionRecord.evacuatedCount,
            result: '已执行停产撤人',
          } : a.executionRecord,
        } : a
      ),
    })),

  disposeAlert: (alertId, disposalRecord) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? {
          ...a,
          status: 'closed' as const,
          disposalRecord: {
            disposedAt: new Date().toISOString(),
            disposer: disposalRecord.disposer,
            result: disposalRecord.result,
          },
        } : a
      ),
    })),

  setGeologyUploadedPoints: (points) => set({ geologyUploadedPoints: points }),
  setGeologyAnalyzed: (v) => set({ geologyAnalyzed: v }),

  checkAndGenerateAlerts: () => {
    const { alerts: currentAlerts, roleFaceId } = get();
    const now = Date.now();
    const newAlerts: AlertRecord[] = [];

    const scopedMines = get().getFilteredMines();
    for (const mine of scopedMines) {
      let faces = workingFaces[mine.id] || [];
      if (roleFaceId) {
        faces = faces.filter((f) => f.id === roleFaceId);
      }
      for (const face of faces) {
        const existingGasAlert = currentAlerts.find(
          (a) => a.faceId === face.id && a.type === 'gas' && a.status !== 'closed'
        );
        if (face.gasConcentration > 1.0 && !existingGasAlert) {
          newAlerts.push({
            id: `alert-gas-${now}-${face.id}`,
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
      }

      const existingViolationAlert = currentAlerts.find(
        (a) => a.mineId === mine.id && a.type === 'violation' && a.status !== 'closed'
      );
      if (mine.violationRate > 10 && !existingViolationAlert) {
        const firstFace = faces[0];
        newAlerts.push({
          id: `alert-viol-${now}-${mine.id}`,
          mineId: mine.id,
          faceId: firstFace?.id || `${mine.id}-f1`,
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
    const { alertFilter, alerts: allAlerts, userRole, roleMineId, roleFaceId } = get();
    let filtered = allAlerts;

    if (userRole === 'mine' && roleMineId) {
      filtered = filtered.filter((a) => a.mineId === roleMineId);
    } else if (userRole === 'team' && roleMineId) {
      if (roleFaceId) {
        filtered = filtered.filter((a) => a.faceId === roleFaceId);
      } else {
        const faces = workingFaces[roleMineId] || [];
        const faceIds = faces.map((f) => f.id);
        filtered = filtered.filter((a) => faceIds.includes(a.faceId));
      }
    }

    return filtered.filter((a) => {
      if (alertFilter.level && a.level !== alertFilter.level) return false;
      if (alertFilter.status && a.status !== alertFilter.status) return false;
      if (alertFilter.mineId && a.mineId !== alertFilter.mineId) return false;
      if (alertFilter.faceId && a.faceId !== alertFilter.faceId) return false;
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

  getFilteredFaces: () => {
    const { userRole, roleMineId, roleFaceId } = get();
    const mineId = roleMineId || '';
    const faces = workingFaces[mineId] || [];
    if (userRole === 'team' && roleFaceId) {
      return faces.filter((f) => f.id === roleFaceId);
    }
    return faces;
  },

  getFaceLevelRanking: () => {
    const { userRole, roleMineId, roleFaceId } = get();
    if (userRole === 'team' && roleMineId) {
      const faces = workingFaces[roleMineId] || [];
      if (roleFaceId) {
        const face = faces.find((f) => f.id === roleFaceId);
        if (face) return [{ name: face.name, value: face.gasConcentration > 1 ? Math.round(face.gasConcentration * 10) : 0, id: face.id }];
        return [];
      }
      return faces.map((f) => ({ name: f.name, value: f.gasConcentration > 1 ? Math.round(f.gasConcentration * 10) : 0, id: f.id })).sort((a, b) => b.value - a.value);
    }
    if (userRole === 'mine' && roleMineId) {
      const faces = workingFaces[roleMineId] || [];
      return faces.map((f) => ({ name: f.name, value: f.gasConcentration > 1 ? Math.round(f.gasConcentration * 10) : 0, id: f.id })).sort((a, b) => b.value - a.value);
    }
    return get().getFilteredMines().map((m) => ({ name: m.name, value: m.gasOverlimitDuration, id: m.id })).sort((a, b) => b.value - a.value);
  },

  getDisposalReview: () => {
    const allAlerts = get().getFilteredAlerts();
    const faceMap = new Map<string, AlertRecord[]>();
    allAlerts.forEach((a) => {
      const list = faceMap.get(a.faceId) || [];
      list.push(a);
      faceMap.set(a.faceId, list);
    });
    const result: {
      faceId: string;
      faceName: string;
      mineName: string;
      totalAlerts: number;
      l1AvgDisposalMin: number;
      l2AvgApprovalMin: number;
      totalEvacuated: number;
      closureRate: number;
      alerts: AlertRecord[];
    }[] = [];
    faceMap.forEach((alerts, faceId) => {
      const mine = mines.find((m) => m.id === alerts[0].mineId);
      const faces = workingFaces[alerts[0].mineId] || [];
      const face = faces.find((f) => f.id === faceId);
      const l1Closed = alerts.filter((a) => a.level === '1' && a.status === 'closed' && a.disposalRecord);
      const l1DisposalMins = l1Closed.map((a) => {
        const start = new Date(a.triggeredAt).getTime();
        const end = new Date(a.disposalRecord!.disposedAt).getTime();
        return Math.round((end - start) / 60000);
      });
      const l2WithApproval = alerts.filter((a) => a.level === '2' && a.approvals.some((ap) => ap.status === 'approved'));
      const l2ApprovalMins = l2WithApproval.map((a) => {
        const start = new Date(a.triggeredAt).getTime();
        const lastApproved = a.approvals.filter((ap) => ap.status === 'approved' && ap.approvedAt).sort((x, y) => new Date(y.approvedAt!).getTime() - new Date(x.approvedAt!).getTime())[0];
        if (!lastApproved?.approvedAt) return 0;
        return Math.round((new Date(lastApproved.approvedAt).getTime() - start) / 60000);
      });
      const closedCount = alerts.filter((a) => a.status === 'closed').length;
      const totalEvacuated = alerts.reduce((s, a) => s + (a.executionRecord?.evacuatedCount || 0), 0);
      result.push({
        faceId,
        faceName: face?.name || faceId,
        mineName: mine?.name || alerts[0].mineId,
        totalAlerts: alerts.length,
        l1AvgDisposalMin: l1DisposalMins.length ? Math.round(l1DisposalMins.reduce((s, v) => s + v, 0) / l1DisposalMins.length) : 0,
        l2AvgApprovalMin: l2ApprovalMins.length ? Math.round(l2ApprovalMins.reduce((s, v) => s + v, 0) / l2ApprovalMins.length) : 0,
        totalEvacuated,
        closureRate: alerts.length ? Math.round((closedCount / alerts.length) * 100) : 0,
        alerts: alerts.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()),
      });
    });
    return result.sort((a, b) => b.totalAlerts - a.totalAlerts);
  },

  getScopeLabel: () => {
    const { userRole, roleMineId, roleFaceId } = get();
    if (userRole === 'group') return '全国';
    if (roleMineId) {
      const mine = mines.find((m) => m.id === roleMineId);
      const mineName = mine ? mine.name : '未知矿区';
      if (userRole === 'team' && roleFaceId) {
        const faces = workingFaces[roleMineId] || [];
        const face = faces.find((f) => f.id === roleFaceId);
        return face ? `${mineName} · ${face.name}` : mineName;
      }
      return mineName;
    }
    return userRole === 'mine' ? '单矿区' : '班组';
  },

  getComputedStats: () => {
    const { userRole, roleMineId, roleFaceId } = get();
    if (userRole === 'team' && roleMineId && roleFaceId) {
      const faces = workingFaces[roleMineId] || [];
      const face = faces.find((f) => f.id === roleFaceId);
      const mine = mines.find((m) => m.id === roleMineId);
      if (face && mine) {
        return {
          safetyIndex: mine.safetyIndex,
          equipmentUptimeRate: mine.equipmentUptimeRate,
          violationRate: mine.violationRate,
          gasOverlimitDuration: face.gasConcentration > 1 ? Math.round(face.gasConcentration * 10) : 0,
          safetyIndexTrend: +(1.5 + Math.random() * 1.5).toFixed(1),
          equipmentTrend: +(0.5 + Math.random() * 1).toFixed(1),
          violationTrend: +(-1.5 - Math.random() * 1).toFixed(1),
          gasTrend: +(-3 - Math.random() * 3).toFixed(1),
        };
      }
    }
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
    const { userRole, roleMineId, roleFaceId } = get();
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);

    if ((userRole === 'team' || userRole === 'mine') && roleMineId) {
      const faces = workingFaces[roleMineId] || [];
      const targetFaces = (userRole === 'team' && roleFaceId) ? faces.filter((f) => f.id === roleFaceId) : faces;
      const mine = mines.find((m) => m.id === roleMineId);
      if (!mine) return { week: `第${weekNum}周`, violationRate: 0, violationRateYoy: 0, violationRateQoq: 0, equipmentFaultTypes: [], hazardRectificationRate: 0, totalViolations: 0, totalFaults: 0 };

      const faceCount = targetFaces.length || 1;
      const faceNames = targetFaces.map((f) => f.name);
      const totalViolations = Math.round(mine.violationRate * faceCount * 1.5);
      const totalFaults = Math.round((100 - mine.safetyIndex) * 0.3 * faceCount);
      const violationRate = mine.violationRate;
      const hazardRectificationRate = +(75 + mine.safetyIndex * 0.15 + Math.random() * 5).toFixed(1);
      const faultScale = totalFaults / 30;
      const equipmentFaultTypes = [
        { type: '采煤机故障', count: Math.round(3 * faultScale) },
        { type: '液压支架故障', count: Math.round(2 * faultScale) },
        { type: '输送机故障', count: Math.round(4 * faultScale) },
        { type: '通风设备故障', count: Math.round(1 * faultScale) },
        { type: '排水设备故障', count: Math.round(1 * faultScale) },
        { type: '电气故障', count: Math.round(2 * faultScale) },
      ];
      return {
        week: `第${weekNum}周`,
        violationRate,
        violationRateYoy: +(-2 + Math.random() * 4).toFixed(1),
        violationRateQoq: +(-1.5 + Math.random() * 3).toFixed(1),
        equipmentFaultTypes,
        hazardRectificationRate,
        totalViolations,
        totalFaults,
        faceNames,
      };
    }

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
  const roleMineId = useStore((s) => s.roleMineId);
  const userRole = useStore((s) => s.userRole);
  const effectiveMineId = userRole !== 'group' && roleMineId ? roleMineId : selectedMine;
  const mine = mines.find((m) => m.id === effectiveMineId);
  const faces = effectiveMineId ? workingFaces[effectiveMineId] || [] : [];
  return { mine: mine || null, faces, effectiveMineId };
}
