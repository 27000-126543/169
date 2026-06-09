import { useState } from 'react';
import { AlertTriangle, Flame, UserX, CheckCircle, Clock, ChevronDown, Filter } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useStore } from '@/store';
import { mines, workingFaces, type AlertRecord, type ApprovalStep } from '@/data/mock';

const levelOptions = [
  { value: '', label: '全部' },
  { value: '1', label: '一级' },
  { value: '2', label: '二级' },
];

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'approved', label: '已批准' },
  { value: 'closed', label: '已关闭' },
];

const statusLabels: Record<AlertRecord['status'], string> = {
  pending: '待处理',
  processing: '处理中',
  approved: '已批准',
  closed: '已关闭',
};

const statusColors: Record<AlertRecord['status'], string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-green-500/20 text-green-400',
  closed: 'bg-gray-500/20 text-gray-400',
};

const levelColors: Record<AlertRecord['level'], string> = {
  '1': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  '2': 'bg-red-500/20 text-red-400 border-red-500/40',
};

function formatTime(iso: string) {
  if (!iso) return '--';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getFaceName(alert: AlertRecord) {
  const faces = workingFaces[alert.mineId] || [];
  return faces.find((f) => f.id === alert.faceId)?.name ?? alert.faceId;
}

function getMineName(alert: AlertRecord) {
  return mines.find((m) => m.id === alert.mineId)?.name ?? alert.mineId;
}

function StepIcon({ step, isCurrent }: { step: ApprovalStep; isCurrent: boolean }) {
  if (step.status === 'approved') {
    return (
      <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (isCurrent) {
    return (
      <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center shrink-0 animate-pulse">
        <Clock className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
      <Clock className="w-5 h-5 text-gray-300" />
    </div>
  );
}

function ApprovalFlow({ alert }: { alert: AlertRecord }) {
  const approveStep = useStore((s) => s.approveStep);
  const currentStepIndex = alert.approvals.findIndex((a) => a.status === 'pending');

  return (
    <div className="mt-4">
      <h4 className="text-white/70 text-sm mb-3">审批流程</h4>
      <div className="flex items-start gap-0">
        {alert.approvals.map((step, i) => (
          <div key={i} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <StepIcon step={step} isCurrent={i === currentStepIndex} />
              <p className="text-white text-xs mt-1.5 font-medium">{step.role}</p>
              <p className="text-white/50 text-xs mt-0.5">{step.approver}</p>
              {step.status === 'approved' && step.approvedAt && (
                <p className="text-green-400/60 text-[10px] mt-0.5">{formatTime(step.approvedAt)}</p>
              )}
              {i === currentStepIndex && (
                <button
                  onClick={() => approveStep(alert.id, i)}
                  className="mt-2 px-3 py-1 text-xs rounded-md bg-blue-500/30 text-blue-300 border border-blue-500/40 hover:bg-blue-500/50 transition-colors"
                >
                  确认审批
                </button>
              )}
            </div>
            {i < alert.approvals.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[18px] mx-1 rounded ${alert.approvals[i].status === 'approved' ? 'bg-green-500' : 'bg-gray-600'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Alerts() {
  const alertFilter = useStore((s) => s.alertFilter);
  const setAlertFilter = useStore((s) => s.setAlertFilter);
  const getFilteredAlerts = useStore((s) => s.getFilteredAlerts);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = getFilteredAlerts();
  const selected = filtered.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-[#0A1628] p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-white/50" />
        <select
          value={alertFilter.level}
          onChange={(e) => setAlertFilter({ level: e.target.value })}
          className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer"
        >
          {levelOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#0A1628]">预警级别：{o.label}</option>)}
        </select>
        <select
          value={alertFilter.status}
          onChange={(e) => setAlertFilter({ status: e.target.value })}
          className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer"
        >
          {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#0A1628]">预警状态：{o.label}</option>)}
        </select>
        <select
          value={alertFilter.mineId}
          onChange={(e) => setAlertFilter({ mineId: e.target.value })}
          className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer"
        >
          <option value="" className="bg-[#0A1628]">所属矿区：全部</option>
          {mines.map((m) => <option key={m.id} value={m.id} className="bg-[#0A1628]">{m.name}</option>)}
        </select>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {filtered.length === 0 && (
            <p className="text-white/40 text-center py-20">暂无预警记录</p>
          )}
          {filtered.map((alert) => (
            <GlassCard
              key={alert.id}
              glow={selectedId === alert.id}
              onClick={() => setSelectedId(selectedId === alert.id ? null : alert.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 px-2 py-1 rounded text-xs font-bold border ${levelColors[alert.level]} ${alert.status === 'pending' ? 'animate-pulse' : ''}`}>
                  {alert.level}级
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {alert.type === 'gas' ? <Flame className="w-4 h-4 text-orange-400" /> : <UserX className="w-4 h-4 text-purple-400" />}
                    <span className="text-white text-sm font-medium truncate">{getMineName(alert)}</span>
                    <span className="text-white/40 text-xs">{getFaceName(alert)}</span>
                  </div>
                  <p className="text-white/60 text-xs mt-1 line-clamp-1">{alert.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white/30 text-xs">{formatTime(alert.triggeredAt)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[alert.status]}`}>{statusLabels[alert.status]}</span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${selectedId === alert.id ? 'rotate-180' : ''}`} />
              </div>
              {selectedId === alert.id && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/70 text-sm">{alert.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-white/40">
                    <span>预警类型：{alert.type === 'gas' ? '瓦斯超限' : '人员违规'}</span>
                    <span>级别：{alert.level}级</span>
                  </div>
                  <ApprovalFlow alert={alert} />
                </div>
              )}
            </GlassCard>
          ))}
        </div>

        {selected && (
          <div className="w-[380px] shrink-0">
            <GlassCard className="sticky top-0">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`w-5 h-5 ${selected.level === '2' ? 'text-red-400' : 'text-orange-400'}`} />
                <h3 className="text-white font-semibold">预警详情</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/40">所属矿区</span><span className="text-white">{getMineName(selected)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">工作面</span><span className="text-white">{getFaceName(selected)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">预警级别</span><span className={selected.level === '2' ? 'text-red-400' : 'text-orange-400'}>{selected.level}级</span></div>
                <div className="flex justify-between"><span className="text-white/40">预警类型</span><span className="text-white">{selected.type === 'gas' ? '瓦斯超限' : '人员违规'}</span></div>
                <div className="flex justify-between"><span className="text-white/40">触发时间</span><span className="text-white">{formatTime(selected.triggeredAt)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">当前状态</span><span className={`px-2 py-0.5 rounded text-xs ${statusColors[selected.status]}`}>{statusLabels[selected.status]}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-white/50 text-xs mb-1">描述</p>
                <p className="text-white/80 text-sm leading-relaxed">{selected.description}</p>
              </div>
              <ApprovalFlow alert={selected} />
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
