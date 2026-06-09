export interface Province {
  id: string;
  name: string;
  safetyIndex: number;
  mineCount: number;
}

export interface Mine {
  id: string;
  name: string;
  provinceId: string;
  safetyIndex: number;
  equipmentUptimeRate: number;
  violationRate: number;
  gasOverlimitDuration: number;
  location: { lng: number; lat: number };
}

export interface WorkingFace {
  id: string;
  name: string;
  mineId: string;
  status: 'safe' | 'warning' | 'stopped';
  gasConcentration: number;
  dustLevel: number;
  fanStatus: number;
  vibrationLevel: number;
  personnelCount: number;
}

export interface MonitoringPoint {
  timestamp: string;
  gasConcentration: number;
  dustLevel: number;
  fanSpeed: number;
  vibration: number;
}

export interface PersonnelTrack {
  personId: string;
  x: number;
  y: number;
  timestamp: string;
}

export interface Violation {
  id: string;
  faceId: string;
  type: string;
  personName: string;
  timestamp: string;
}

export interface AlertRecord {
  id: string;
  mineId: string;
  faceId: string;
  level: '1' | '2';
  type: 'gas' | 'violation';
  status: 'pending' | 'processing' | 'approved' | 'closed';
  triggeredAt: string;
  description: string;
  approvals: ApprovalStep[];
}

export interface ApprovalStep {
  role: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
}

export interface RiskPoint {
  id: string;
  type: string;
  x: number;
  y: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface WeeklyReport {
  week: string;
  violationRate: number;
  violationRateYoy: number;
  violationRateQoq: number;
  equipmentFaultTypes: { type: string; count: number }[];
  hazardRectificationRate: number;
  totalViolations: number;
  totalFaults: number;
}

export const provinces: Province[] = [
  { id: 'sx', name: '山西省', safetyIndex: 87.2, mineCount: 3 },
  { id: 'sn', name: '陕西省', safetyIndex: 82.5, mineCount: 2 },
  { id: 'nmg', name: '内蒙古自治区', safetyIndex: 91.3, mineCount: 2 },
  { id: 'gz', name: '贵州省', safetyIndex: 74.8, mineCount: 2 },
  { id: 'hn', name: '河南省', safetyIndex: 85.1, mineCount: 2 },
  { id: 'ah', name: '安徽省', safetyIndex: 88.6, mineCount: 2 },
  { id: 'sd', name: '山东省', safetyIndex: 90.2, mineCount: 2 },
  { id: 'xj', name: '新疆维吾尔自治区', safetyIndex: 78.4, mineCount: 2 },
  { id: 'ln', name: '辽宁省', safetyIndex: 83.7, mineCount: 2 },
  { id: 'hlj', name: '黑龙江省', safetyIndex: 80.9, mineCount: 2 },
  { id: 'hb', name: '河北省', safetyIndex: 86.4, mineCount: 2 },
  { id: 'yn', name: '云南省', safetyIndex: 76.1, mineCount: 2 },
  { id: 'sc', name: '四川省', safetyIndex: 79.5, mineCount: 2 },
  { id: 'gs', name: '甘肃省', safetyIndex: 77.3, mineCount: 2 },
  { id: 'nx', name: '宁夏回族自治区', safetyIndex: 84.2, mineCount: 2 },
];

export const mines: Mine[] = [
  { id: 'sx-1', name: '大同煤矿集团塔山矿', provinceId: 'sx', safetyIndex: 89.5, equipmentUptimeRate: 94.2, violationRate: 5.3, gasOverlimitDuration: 12, location: { lng: 113.3, lat: 40.08 } },
  { id: 'sx-2', name: '山西焦煤西山煤电杜儿坪矿', provinceId: 'sx', safetyIndex: 85.1, equipmentUptimeRate: 91.8, violationRate: 7.8, gasOverlimitDuration: 28, location: { lng: 112.5, lat: 37.87 } },
  { id: 'sx-3', name: '阳泉煤业新元矿', provinceId: 'sx', safetyIndex: 87.0, equipmentUptimeRate: 93.5, violationRate: 6.1, gasOverlimitDuration: 15, location: { lng: 113.58, lat: 37.87 } },
  { id: 'sn-1', name: '陕煤集团红柳林矿', provinceId: 'sn', safetyIndex: 83.2, equipmentUptimeRate: 89.7, violationRate: 9.2, gasOverlimitDuration: 35, location: { lng: 110.2, lat: 38.27 } },
  { id: 'sn-2', name: '陕煤集团张家峁矿', provinceId: 'sn', safetyIndex: 81.8, equipmentUptimeRate: 88.4, violationRate: 10.5, gasOverlimitDuration: 42, location: { lng: 110.4, lat: 38.5 } },
  { id: 'nmg-1', name: '神东煤炭布尔台矿', provinceId: 'nmg', safetyIndex: 92.8, equipmentUptimeRate: 96.1, violationRate: 3.2, gasOverlimitDuration: 5, location: { lng: 111.1, lat: 39.6 } },
  { id: 'nmg-2', name: '神东煤炭上湾矿', provinceId: 'nmg', safetyIndex: 89.9, equipmentUptimeRate: 94.8, violationRate: 4.5, gasOverlimitDuration: 8, location: { lng: 110.9, lat: 39.5 } },
  { id: 'gz-1', name: '盘江精煤土城矿', provinceId: 'gz', safetyIndex: 72.5, equipmentUptimeRate: 85.3, violationRate: 12.8, gasOverlimitDuration: 68, location: { lng: 104.5, lat: 25.8 } },
  { id: 'gz-2', name: '贵州水城矿业汪家寨矿', provinceId: 'gz', safetyIndex: 77.1, equipmentUptimeRate: 87.6, violationRate: 11.2, gasOverlimitDuration: 55, location: { lng: 104.8, lat: 26.6 } },
  { id: 'hn-1', name: '河南能源化工集团赵固一矿', provinceId: 'hn', safetyIndex: 86.3, equipmentUptimeRate: 92.1, violationRate: 6.8, gasOverlimitDuration: 18, location: { lng: 113.9, lat: 35.3 } },
  { id: 'hn-2', name: '平煤神马集团一矿', provinceId: 'hn', safetyIndex: 83.9, equipmentUptimeRate: 90.2, violationRate: 8.5, gasOverlimitDuration: 25, location: { lng: 113.2, lat: 33.8 } },
  { id: 'ah-1', name: '淮南矿业集团张集矿', provinceId: 'ah', safetyIndex: 89.2, equipmentUptimeRate: 93.8, violationRate: 5.1, gasOverlimitDuration: 10, location: { lng: 116.7, lat: 32.6 } },
  { id: 'ah-2', name: '淮北矿业集团朱仙庄矿', provinceId: 'ah', safetyIndex: 88.0, equipmentUptimeRate: 92.5, violationRate: 5.9, gasOverlimitDuration: 14, location: { lng: 116.8, lat: 33.9 } },
  { id: 'sd-1', name: '兖矿集团兴隆庄矿', provinceId: 'sd', safetyIndex: 91.5, equipmentUptimeRate: 95.3, violationRate: 3.8, gasOverlimitDuration: 6, location: { lng: 116.8, lat: 35.5 } },
  { id: 'sd-2', name: '新汶矿业集团孙村矿', provinceId: 'sd', safetyIndex: 88.9, equipmentUptimeRate: 93.1, violationRate: 5.5, gasOverlimitDuration: 11, location: { lng: 117.7, lat: 35.9 } },
  { id: 'xj-1', name: '新疆焦煤集团1890矿', provinceId: 'xj', safetyIndex: 76.8, equipmentUptimeRate: 84.2, violationRate: 13.5, gasOverlimitDuration: 72, location: { lng: 87.6, lat: 43.8 } },
  { id: 'xj-2', name: '潞安新疆煤化工砂墩子矿', provinceId: 'xj', safetyIndex: 80.0, equipmentUptimeRate: 86.9, violationRate: 10.8, gasOverlimitDuration: 48, location: { lng: 89.2, lat: 42.8 } },
  { id: 'ln-1', name: '铁法能源公司大兴矿', provinceId: 'ln', safetyIndex: 84.5, equipmentUptimeRate: 90.8, violationRate: 7.5, gasOverlimitDuration: 20, location: { lng: 123.8, lat: 42.3 } },
  { id: 'ln-2', name: '抚顺矿业集团老虎台矿', provinceId: 'ln', safetyIndex: 82.9, equipmentUptimeRate: 89.1, violationRate: 8.9, gasOverlimitDuration: 30, location: { lng: 123.9, lat: 41.9 } },
  { id: 'hlj-1', name: '龙煤集团鸡西滴道矿', provinceId: 'hlj', safetyIndex: 81.5, equipmentUptimeRate: 88.6, violationRate: 9.8, gasOverlimitDuration: 38, location: { lng: 131.0, lat: 45.3 } },
  { id: 'hlj-2', name: '龙煤集团鹤岗峻德矿', provinceId: 'hlj', safetyIndex: 80.3, equipmentUptimeRate: 87.3, violationRate: 10.2, gasOverlimitDuration: 44, location: { lng: 130.3, lat: 47.3 } },
  { id: 'hb-1', name: '开滦集团东欢坨矿', provinceId: 'hb', safetyIndex: 87.1, equipmentUptimeRate: 91.5, violationRate: 6.3, gasOverlimitDuration: 16, location: { lng: 118.2, lat: 39.6 } },
  { id: 'hb-2', name: '冀中能源邢东矿', provinceId: 'hb', safetyIndex: 85.7, equipmentUptimeRate: 90.3, violationRate: 7.2, gasOverlimitDuration: 22, location: { lng: 114.5, lat: 37.1 } },
  { id: 'yn-1', name: '云南东源镇雄矿', provinceId: 'yn', safetyIndex: 74.5, equipmentUptimeRate: 83.8, violationRate: 13.2, gasOverlimitDuration: 65, location: { lng: 104.9, lat: 27.4 } },
  { id: 'yn-2', name: '云南后所煤矿庆云矿', provinceId: 'yn', safetyIndex: 77.7, equipmentUptimeRate: 86.1, violationRate: 11.5, gasOverlimitDuration: 52, location: { lng: 104.2, lat: 25.6 } },
  { id: 'sc-1', name: '川煤集团达竹柏林矿', provinceId: 'sc', safetyIndex: 78.2, equipmentUptimeRate: 86.5, violationRate: 11.8, gasOverlimitDuration: 50, location: { lng: 107.5, lat: 31.2 } },
  { id: 'sc-2', name: '川煤集团广旺代池坝矿', provinceId: 'sc', safetyIndex: 80.8, equipmentUptimeRate: 88.3, violationRate: 9.5, gasOverlimitDuration: 36, location: { lng: 105.8, lat: 32.4 } },
  { id: 'gs-1', name: '靖远煤业魏家地矿', provinceId: 'gs', safetyIndex: 76.0, equipmentUptimeRate: 84.8, violationRate: 12.5, gasOverlimitDuration: 60, location: { lng: 104.2, lat: 36.5 } },
  { id: 'gs-2', name: '窑街煤电海石湾矿', provinceId: 'gs', safetyIndex: 78.6, equipmentUptimeRate: 86.2, violationRate: 10.9, gasOverlimitDuration: 46, location: { lng: 103.3, lat: 36.3 } },
  { id: 'nx-1', name: '神华宁煤羊场湾矿', provinceId: 'nx', safetyIndex: 85.8, equipmentUptimeRate: 91.2, violationRate: 6.8, gasOverlimitDuration: 17, location: { lng: 106.3, lat: 38.5 } },
  { id: 'nx-2', name: '神华宁煤灵新矿', provinceId: 'nx', safetyIndex: 82.6, equipmentUptimeRate: 89.5, violationRate: 8.3, gasOverlimitDuration: 26, location: { lng: 106.5, lat: 38.1 } },
];

function generateWorkingFaces(mineId: string): WorkingFace[] {
  const faceNames = ['1301综采工作面', '2502综采工作面', '3201掘进工作面', '4102掘进工作面', '5301备采工作面'];
  const count = 3 + Math.floor(Math.random() * 3);
  const faces: WorkingFace[] = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let status: WorkingFace['status'] = 'safe';
    if (rand > 0.85) status = 'warning';
    else if (rand > 0.93) status = 'stopped';
    faces.push({
      id: `${mineId}-f${i + 1}`,
      name: faceNames[i],
      mineId,
      status,
      gasConcentration: +(0.2 + Math.random() * 0.9).toFixed(2),
      dustLevel: +(2 + Math.random() * 6).toFixed(1),
      fanStatus: +(1400 + Math.random() * 600).toFixed(0),
      vibrationLevel: +(0.5 + Math.random() * 4.5).toFixed(2),
      personnelCount: Math.floor(8 + Math.random() * 25),
    });
  }
  return faces;
}

export const workingFaces: Record<string, WorkingFace[]> = {};
mines.forEach(mine => {
  workingFaces[mine.id] = generateWorkingFaces(mine.id);
});

export function generateGasTrend(faceId: string): MonitoringPoint[] {
  const points: MonitoringPoint[] = [];
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  let baseGas = 0.3 + Math.random() * 0.3;
  for (let t = now - sevenDays; t <= now; t += 10 * 60 * 1000) {
    baseGas += (Math.random() - 0.48) * 0.05;
    baseGas = Math.max(0.1, Math.min(1.5, baseGas));
    const spike = Math.random() > 0.97 ? 0.3 + Math.random() * 0.4 : 0;
    points.push({
      timestamp: new Date(t).toISOString(),
      gasConcentration: +(baseGas + spike).toFixed(3),
      dustLevel: +(2 + Math.random() * 6).toFixed(1),
      fanSpeed: +(1400 + Math.random() * 600).toFixed(0),
      vibration: +(0.5 + Math.random() * 4.5).toFixed(2),
    });
  }
  return points;
}

export function generatePersonnelTracks(faceId: string): PersonnelTrack[] {
  const tracks: PersonnelTrack[] = [];
  const names = ['张建国', '李明远', '王志强', '赵德才', '刘红伟', '陈永刚', '杨学军', '周国庆'];
  for (let i = 0; i < 120; i++) {
    tracks.push({
      personId: names[Math.floor(Math.random() * names.length)],
      x: +(Math.random() * 200).toFixed(1),
      y: +(Math.random() * 150).toFixed(1),
      timestamp: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000).toISOString(),
    });
  }
  return tracks;
}

export const violationTypes = ['超时滞留', '越界作业', '未佩戴安全帽', '未携带自救器', '违规操作设备', '进入盲巷'];

export function generateViolations(faceId: string): Violation[] {
  const violations: Violation[] = [];
  const names = ['张建国', '李明远', '王志强', '赵德才', '刘红伟', '陈永刚', '杨学军', '周国庆'];
  const count = 5 + Math.floor(Math.random() * 15);
  for (let i = 0; i < count; i++) {
    violations.push({
      id: `v-${faceId}-${i}`,
      faceId,
      type: violationTypes[Math.floor(Math.random() * violationTypes.length)],
      personName: names[Math.floor(Math.random() * names.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return violations;
}

export const alerts: AlertRecord[] = [
  {
    id: 'alert-1',
    mineId: 'sn-1',
    faceId: 'sn-1-f1',
    level: '2',
    type: 'gas',
    status: 'processing',
    triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    description: '2502综采工作面瓦斯浓度连续10分钟超过1.0%阈值，当前值1.35%',
    approvals: [
      { role: '班组长', approver: '马志强', status: 'approved', approvedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString() },
      { role: '矿总工程师', approver: '林建明', status: 'approved', approvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      { role: '集团安监局长', approver: '郑卫东', status: 'pending' },
    ],
  },
  {
    id: 'alert-2',
    mineId: 'gz-1',
    faceId: 'gz-1-f2',
    level: '2',
    type: 'violation',
    status: 'processing',
    triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    description: '土城矿人员违规率连续2天超过10%，当前违规率14.2%',
    approvals: [
      { role: '班组长', approver: '何大海', status: 'approved', approvedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
      { role: '矿总工程师', approver: '罗建文', status: 'pending' },
      { role: '集团安监局长', approver: '郑卫东', status: 'pending' },
    ],
  },
  {
    id: 'alert-3',
    mineId: 'xj-1',
    faceId: 'xj-1-f1',
    level: '1',
    type: 'gas',
    status: 'pending',
    triggeredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    description: '1301综采工作面瓦斯浓度连续10分钟超过1.0%阈值，当前值1.28%',
    approvals: [
      { role: '班组长', approver: '待指派', status: 'pending' },
      { role: '矿总工程师', approver: '待指派', status: 'pending' },
      { role: '集团安监局长', approver: '待指派', status: 'pending' },
    ],
  },
  {
    id: 'alert-4',
    mineId: 'gs-1',
    faceId: 'gs-1-f1',
    level: '1',
    type: 'violation',
    status: 'pending',
    triggeredAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    description: '魏家地矿人员违规率连续2天超过10%，当前违规率13.8%',
    approvals: [
      { role: '班组长', approver: '待指派', status: 'pending' },
      { role: '矿总工程师', approver: '待指派', status: 'pending' },
      { role: '集团安监局长', approver: '待指派', status: 'pending' },
    ],
  },
  {
    id: 'alert-5',
    mineId: 'sn-2',
    faceId: 'sn-2-f1',
    level: '2',
    type: 'gas',
    status: 'approved',
    triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    description: '张家峁矿3201掘进工作面瓦斯浓度连续10分钟超过1.0%阈值',
    approvals: [
      { role: '班组长', approver: '王大勇', status: 'approved', approvedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() },
      { role: '矿总工程师', approver: '孙建平', status: 'approved', approvedAt: new Date(Date.now() - 22.5 * 60 * 60 * 1000).toISOString() },
      { role: '集团安监局长', approver: '郑卫东', status: 'approved', approvedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'alert-6',
    mineId: 'yn-1',
    faceId: 'yn-1-f2',
    level: '1',
    type: 'gas',
    status: 'closed',
    triggeredAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    description: '镇雄矿2502综采工作面瓦斯浓度连续10分钟超标，已处置',
    approvals: [
      { role: '班组长', approver: '黄建文', status: 'approved', approvedAt: new Date(Date.now() - 47.5 * 60 * 60 * 1000).toISOString() },
      { role: '矿总工程师', approver: '未升级', status: 'approved', approvedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString() },
      { role: '集团安监局长', approver: '未升级', status: 'approved', approvedAt: '' },
    ],
  },
];

export const riskPoints: RiskPoint[] = [
  { id: 'rp-1', type: '断层', x: 60, y: 80, description: 'F12断层，落差2.3m，走向NE45°', severity: 'high' },
  { id: 'rp-2', type: '断层', x: 140, y: 45, description: 'F8断层，落差1.5m，走向NW30°', severity: 'medium' },
  { id: 'rp-3', type: '水患', x: 100, y: 120, description: '采空区积水区，预计积水量3500m³', severity: 'high' },
  { id: 'rp-4', type: '水患', x: 170, y: 95, description: '底板含水层，距开采层12m', severity: 'medium' },
  { id: 'rp-5', type: '瓦斯', x: 80, y: 55, description: '瓦斯富集区，含量8.2m³/t', severity: 'high' },
  { id: 'rp-6', type: '顶板', x: 130, y: 110, description: '复合顶板，易冒落', severity: 'medium' },
  { id: 'rp-7', type: '断层', x: 45, y: 130, description: 'F3断层，落差0.8m，走向NE60°', severity: 'low' },
  { id: 'rp-8', type: '水患', x: 155, y: 30, description: '老空水威胁区', severity: 'high' },
];

export const weeklyReports: WeeklyReport[] = [
  {
    week: '第22周',
    violationRate: 7.8,
    violationRateYoy: -2.1,
    violationRateQoq: -1.3,
    equipmentFaultTypes: [
      { type: '采煤机故障', count: 12 },
      { type: '液压支架故障', count: 8 },
      { type: '输送机故障', count: 15 },
      { type: '通风设备故障', count: 5 },
      { type: '排水设备故障', count: 3 },
      { type: '电气故障', count: 10 },
    ],
    hazardRectificationRate: 87.5,
    totalViolations: 156,
    totalFaults: 53,
  },
  {
    week: '第21周',
    violationRate: 9.1,
    violationRateYoy: 1.5,
    violationRateQoq: 0.8,
    equipmentFaultTypes: [
      { type: '采煤机故障', count: 15 },
      { type: '液压支架故障', count: 11 },
      { type: '输送机故障', count: 18 },
      { type: '通风设备故障', count: 7 },
      { type: '排水设备故障', count: 4 },
      { type: '电气故障', count: 13 },
    ],
    hazardRectificationRate: 82.3,
    totalViolations: 189,
    totalFaults: 68,
  },
  {
    week: '第20周',
    violationRate: 8.3,
    violationRateYoy: -0.5,
    violationRateQoq: -2.2,
    equipmentFaultTypes: [
      { type: '采煤机故障', count: 13 },
      { type: '液压支架故障', count: 9 },
      { type: '输送机故障', count: 16 },
      { type: '通风设备故障', count: 6 },
      { type: '排水设备故障', count: 5 },
      { type: '电气故障', count: 11 },
    ],
    hazardRectificationRate: 85.1,
    totalViolations: 168,
    totalFaults: 60,
  },
  {
    week: '第19周',
    violationRate: 10.5,
    violationRateYoy: 3.2,
    violationRateQoq: 1.8,
    equipmentFaultTypes: [
      { type: '采煤机故障', count: 18 },
      { type: '液压支架故障', count: 14 },
      { type: '输送机故障', count: 22 },
      { type: '通风设备故障', count: 9 },
      { type: '排水设备故障', count: 6 },
      { type: '电气故障', count: 16 },
    ],
    hazardRectificationRate: 78.9,
    totalViolations: 215,
    totalFaults: 85,
  },
];

export const provinceCoords: Record<string, { lng: number; lat: number }> = {
  'sx': { lng: 112.5, lat: 37.87 },
  'sn': { lng: 108.9, lat: 34.27 },
  'nmg': { lng: 111.7, lat: 40.82 },
  'gz': { lng: 106.7, lat: 26.6 },
  'hn': { lng: 113.7, lat: 34.8 },
  'ah': { lng: 117.3, lat: 31.86 },
  'sd': { lng: 117.0, lat: 36.67 },
  'xj': { lng: 87.6, lat: 43.8 },
  'ln': { lng: 123.4, lat: 41.8 },
  'hlj': { lng: 126.6, lat: 45.75 },
  'hb': { lng: 114.5, lat: 38.04 },
  'yn': { lng: 102.7, lat: 25.04 },
  'sc': { lng: 104.1, lat: 30.57 },
  'gs': { lng: 103.8, lat: 36.06 },
  'nx': { lng: 106.3, lat: 38.47 },
};
