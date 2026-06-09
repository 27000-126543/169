import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Flame, UserX, CheckCircle, Clock, ChevronDown, Filter, Bell, FileText, UserMinus, ArrowRight, BarChart3, ClipboardList } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useStore } from '@/store';
import { workingFaces, mines, type AlertRecord, type ApprovalStep } from '@/data/mock';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

function formatTimeSec(iso: string) {
  if (!iso) return '--';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function getMineName(alert: AlertRecord) {
  return mines.find((m) => m.id === alert.mineId)?.name ?? alert.mineId;
}

function getFaceName(alert: AlertRecord) {
  const faces = workingFaces[alert.mineId] || [];
  return faces.find((f) => f.id === alert.faceId)?.name ?? alert.faceId;
}

function StepIcon({ step, isCurrent }: { step: ApprovalStep; isCurrent: boolean }) {
  if (step.status === 'approved') {
    return <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4 text-white" /></div>;
  }
  if (isCurrent) {
    return <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 animate-pulse"><Clock className="w-4 h-4 text-white" /></div>;
  }
  return <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-gray-300" /></div>;
}

function ExecutionRecord({ record }: { record: NonNullable<AlertRecord['executionRecord']> }) {
  return (
    <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
      <h5 className="text-red-400 text-xs font-semibold mb-1.5 flex items-center gap-1"><UserMinus className="w-3 h-3" />停产撤人执行记录</h5>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div><span className="text-white/40">执行时间</span><p className="text-white/80">{formatTimeSec(record.executedAt)}</p></div>
        <div><span className="text-white/40">执行人</span><p className="text-white/80">{record.executor}</p></div>
        <div><span className="text-white/40">撤离人数</span><p className="text-white/80">{record.evacuatedCount} 人</p></div>
        <div><span className="text-white/40">执行结果</span><p className="text-green-400">{record.result}</p></div>
      </div>
    </div>
  );
}

function DisposalRecord({ record }: { record: NonNullable<AlertRecord['disposalRecord']> }) {
  return (
    <div className="mt-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
      <h5 className="text-yellow-400 text-xs font-semibold mb-1.5 flex items-center gap-1"><FileText className="w-3 h-3" />现场处置记录</h5>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div><span className="text-white/40">处置时间</span><p className="text-white/80">{formatTimeSec(record.disposedAt)}</p></div>
        <div><span className="text-white/40">处置人</span><p className="text-white/80">{record.disposer}</p></div>
        <div className="col-span-2"><span className="text-white/40">处置结果</span><p className="text-white/80">{record.result}</p></div>
      </div>
    </div>
  );
}

function AlertTimeline({ alert }: { alert: AlertRecord }) {
  const steps: { label: string; time: string; detail?: string; color: string }[] = [
    { label: '预警触发', time: formatTimeSec(alert.triggeredAt), color: 'text-red-400' },
  ];
  if (alert.disposalRecord) {
    steps.push({ label: '现场处置', time: formatTimeSec(alert.disposalRecord.disposedAt), detail: `${alert.disposalRecord.disposer}: ${alert.disposalRecord.result}`, color: 'text-yellow-400' });
  }
  if (alert.level === '2') {
    steps.push({ label: '升级为二级', time: '', color: 'text-red-400' });
    alert.approvals.forEach((a, i) => {
      steps.push({
        label: `${a.role}审批`,
        time: a.approvedAt ? formatTimeSec(a.approvedAt) : '待审批',
        detail: a.approver !== '待指派' ? a.approver : undefined,
        color: a.status === 'approved' ? 'text-green-400' : 'text-gray-400',
      });
    });
  }
  if (alert.executionRecord) {
    steps.push({ label: '执行停产撤人', time: formatTimeSec(alert.executionRecord.executedAt), detail: `${alert.executionRecord.executor} 撤离${alert.executionRecord.evacuatedCount}人`, color: 'text-red-400' });
  }
  if (alert.status === 'closed' && !alert.executionRecord && !alert.disposalRecord) {
    steps.push({ label: '已关闭', time: '', color: 'text-gray-400' });
  }

  return (
    <div className="mt-2 pl-3 border-l-2 border-white/10">
      {steps.map((step, i) => (
        <div key={i} className="relative pb-3 last:pb-0">
          <div className={`absolute -left-[13px] top-0.5 w-2 h-2 rounded-full ${step.color === 'text-green-400' ? 'bg-green-400' : step.color === 'text-red-400' ? 'bg-red-400' : step.color === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
          <div className="ml-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${step.color}`}>{step.label}</span>
              {step.time && <span className="text-white/30 text-[10px]">{step.time}</span>}
            </div>
            {step.detail && <p className="text-white/50 text-[10px]">{step.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ApprovalFlow({ alert }: { alert: AlertRecord }) {
  const approveStep = useStore((s) => s.approveStep);
  const closeAlert = useStore((s) => s.closeAlert);
  const [showExecForm, setShowExecForm] = useState(false);
  const [executor, setExecutor] = useState('');
  const [evacuatedCount, setEvacuatedCount] = useState('');
  const currentStepIndex = alert.approvals.findIndex((a) => a.status === 'pending');
  const allApproved = alert.approvals.every((a) => a.status === 'approved');

  const handleExecute = () => {
    if (!executor || !evacuatedCount) return;
    closeAlert(alert.id, { executor, evacuatedCount: parseInt(evacuatedCount) || 0 });
    setShowExecForm(false);
  };

  return (
    <div className="mt-3">
      <h4 className="text-white/70 text-xs mb-2">审批流程</h4>
      <div className="flex items-start gap-0">
        {alert.approvals.map((step, i) => (
          <div key={i} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <StepIcon step={step} isCurrent={i === currentStepIndex} />
              <p className="text-white text-[10px] mt-1 font-medium">{step.role}</p>
              <p className="text-white/50 text-[10px]">{step.approver}</p>
              {step.status === 'approved' && step.approvedAt && <p className="text-green-400/60 text-[9px]">{formatTime(step.approvedAt)}</p>}
              {i === currentStepIndex && alert.status !== 'closed' && (
                <button onClick={() => approveStep(alert.id, i)} className="mt-1 px-2 py-0.5 text-[10px] rounded bg-blue-500/30 text-blue-300 border border-blue-500/40 hover:bg-blue-500/50 transition-colors">确认审批</button>
              )}
            </div>
            {i < alert.approvals.length - 1 && <div className={`flex-1 h-0.5 mt-[16px] mx-0.5 rounded ${alert.approvals[i].status === 'approved' ? 'bg-green-500' : 'bg-gray-600'}`} />}
          </div>
        ))}
      </div>
      {alert.executionRecord && <ExecutionRecord record={alert.executionRecord} />}
      {allApproved && alert.level === '2' && alert.status === 'approved' && !alert.executionRecord && (
        showExecForm ? (
          <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <h5 className="text-red-400 text-xs font-semibold mb-1.5">执行停产撤人</h5>
            <div className="space-y-1.5">
              <input value={executor} onChange={(e) => setExecutor(e.target.value)} placeholder="执行人姓名" className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none" />
              <input value={evacuatedCount} onChange={(e) => setEvacuatedCount(e.target.value)} placeholder="撤离人数" type="number" className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none" />
              <div className="flex gap-2">
                <button onClick={handleExecute} className="px-2 py-1 text-[10px] rounded bg-red-500/40 text-red-200 border border-red-500/40 hover:bg-red-500/60 transition-colors">确认执行</button>
                <button onClick={() => setShowExecForm(false)} className="px-2 py-1 text-[10px] rounded bg-white/10 text-white/50 border border-white/10 hover:bg-white/20 transition-colors">取消</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowExecForm(true)} className="mt-2 px-3 py-1.5 text-xs rounded-md bg-red-500/30 text-red-300 border border-red-500/40 hover:bg-red-500/50 transition-colors font-medium">执行停产撤人</button>
        )
      )}
    </div>
  );
}

function LevelOneActions({ alert }: { alert: AlertRecord }) {
  const disposeAlert = useStore((s) => s.disposeAlert);
  const [showForm, setShowForm] = useState(false);
  const [disposer, setDisposer] = useState('');
  const [result, setResult] = useState('');

  if (alert.status === 'closed' && alert.disposalRecord) {
    return <DisposalRecord record={alert.disposalRecord} />;
  }
  if (alert.status === 'closed') {
    return <div className="mt-2 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-400 text-xs">已关闭</span></div>;
  }
  return showForm ? (
    <div className="mt-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
      <h5 className="text-yellow-400 text-xs font-semibold mb-1.5">现场处置</h5>
      <div className="space-y-1.5">
        <input value={disposer} onChange={(e) => setDisposer(e.target.value)} placeholder="处置人姓名" className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none" />
        <input value={result} onChange={(e) => setResult(e.target.value)} placeholder="处置结果" className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none" />
        <div className="flex gap-2">
          <button onClick={() => { if (!disposer || !result) return; disposeAlert(alert.id, { disposer, result }); setShowForm(false); }} className="px-2 py-1 text-[10px] rounded bg-yellow-500/30 text-yellow-200 border border-yellow-500/40 hover:bg-yellow-500/50 transition-colors">确认处置</button>
          <button onClick={() => setShowForm(false)} className="px-2 py-1 text-[10px] rounded bg-white/10 text-white/50 border border-white/10 hover:bg-white/20 transition-colors">取消</button>
        </div>
      </div>
    </div>
  ) : (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-yellow-400/70 text-[10px]">一级预警 · 待现场处置</span>
      <button onClick={() => setShowForm(true)} className="px-2 py-1 text-[10px] rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors">立即处理</button>
    </div>
  );
}

function DisposalReviewView() {
  const getDisposalReview = useStore((s) => s.getDisposalReview);
  const [expandedFace, setExpandedFace] = useState<string | null>(null);
  const reviewData = useMemo(() => getDisposalReview(), [getDisposalReview]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-4 h-4 text-blue-400" />
        <h3 className="text-white text-sm font-semibold">处置复盘 · 按工作面汇总</h3>
      </div>
      {reviewData.length === 0 && <p className="text-white/40 text-center py-10 text-sm">暂无预警数据</p>}
      {reviewData.map((item) => (
        <GlassCard key={item.faceId} onClick={() => setExpandedFace(expandedFace === item.faceId ? null : item.faceId)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">{item.faceName}</span>
              <span className="text-white/30 text-xs">{item.mineName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="text-center"><span className="text-white/40 block">预警数</span><span className="text-white font-bold">{item.totalAlerts}</span></div>
              <div className="text-center"><span className="text-white/40 block">处置耗时</span><span className="text-yellow-400 font-bold">{item.l1AvgDisposalMin}min</span></div>
              <div className="text-center"><span className="text-white/40 block">审批耗时</span><span className="text-blue-400 font-bold">{item.l2AvgApprovalMin}min</span></div>
              <div className="text-center"><span className="text-white/40 block">撤离人数</span><span className="text-red-400 font-bold">{item.totalEvacuated}</span></div>
              <div className="text-center"><span className="text-white/40 block">闭环率</span><span className={`font-bold ${item.closureRate >= 80 ? 'text-green-400' : item.closureRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{item.closureRate}%</span></div>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expandedFace === item.faceId ? 'rotate-180' : ''}`} />
          </div>
          {expandedFace === item.faceId && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              {item.alerts.map((alert) => (
                <div key={alert.id} className="p-2.5 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${levelColors[alert.level]}`}>{alert.level}级</span>
                    {alert.type === 'gas' ? <Flame className="w-3 h-3 text-orange-400" /> : <UserX className="w-3 h-3 text-purple-400" />}
                    <span className="text-white/60 text-xs">{alert.type === 'gas' ? '瓦斯超限' : '人员违规'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[alert.status]}`}>{statusLabels[alert.status]}</span>
                    <span className="text-white/30 text-[10px] ml-auto">{formatTime(alert.triggeredAt)}</span>
                  </div>
                  <p className="text-white/50 text-[10px] mb-1">{alert.description}</p>
                  <AlertTimeline alert={alert} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

export default function Alerts() {
  const alertFilter = useStore((s) => s.alertFilter);
  const setAlertFilter = useStore((s) => s.setAlertFilter);
  const getFilteredAlerts = useStore((s) => s.getFilteredAlerts);
  const checkAndGenerateAlerts = useStore((s) => s.checkAndGenerateAlerts);
  const checkAlertEscalation = useStore((s) => s.checkAlertEscalation);
  const userRole = useStore((s) => s.userRole);
  const roleMineId = useStore((s) => s.roleMineId);
  const roleFaceId = useStore((s) => s.roleFaceId);
  const getFilteredMines = useStore((s) => s.getFilteredMines);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list');

  useEffect(() => {
    const faceIdParam = searchParams.get('faceId');
    const mineIdParam = searchParams.get('mineId');
    if (faceIdParam || mineIdParam) {
      setAlertFilter({ faceId: faceIdParam || '', mineId: mineIdParam || '' });
    }
  }, [searchParams]);

  useEffect(() => {
    const prev = useStore.getState().alerts.length;
    checkAndGenerateAlerts();
    const after = useStore.getState().alerts.length;
    const created = Math.max(0, after - prev);
    if (created > 0) setNewCount(created);
  }, [userRole, roleMineId, roleFaceId]);

  useEffect(() => {
    const escalationInterval = setInterval(() => checkAlertEscalation(), 30000);
    const generateInterval = setInterval(() => {
      const prev = useStore.getState().alerts.length;
      checkAndGenerateAlerts();
      const after = useStore.getState().alerts.length;
      const created = Math.max(0, after - prev);
      if (created > 0) setNewCount((c) => c + created);
    }, 60000);
    return () => { clearInterval(escalationInterval); clearInterval(generateInterval); };
  }, []);

  const scopedMines = getFilteredMines();
  const filtered = getFilteredAlerts();
  const selected = filtered.find((a) => a.id === selectedId) ?? null;
  const isMineFilterLocked = userRole === 'mine' || userRole === 'team';

  const currentMineFaces = useMemo(() => {
    const mid = alertFilter.mineId || roleMineId;
    if (!mid) return [];
    return workingFaces[mid] || [];
  }, [alertFilter.mineId, roleMineId]);

  return (
    <div className="min-h-screen bg-[#0A1628] p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-white/50" />
        <select value={alertFilter.level} onChange={(e) => setAlertFilter({ level: e.target.value })} className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer">
          {levelOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#0A1628]">预警级别：{o.label}</option>)}
        </select>
        <select value={alertFilter.status} onChange={(e) => setAlertFilter({ status: e.target.value })} className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer">
          {statusOptions.map((o) => <option key={o.value} value={o.value} className="bg-[#0A1628]">预警状态：{o.label}</option>)}
        </select>
        <select value={alertFilter.mineId} onChange={(e) => setAlertFilter({ mineId: e.target.value, faceId: '' })} className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer" disabled={isMineFilterLocked}>
          <option value="" className="bg-[#0A1628]">所属矿区：全部</option>
          {scopedMines.map((m) => <option key={m.id} value={m.id} className="bg-[#0A1628]">{m.name}</option>)}
        </select>
        {currentMineFaces.length > 0 && (
          <select value={alertFilter.faceId} onChange={(e) => setAlertFilter({ faceId: e.target.value })} className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer">
            <option value="" className="bg-[#0A1628]">工作面：全部</option>
            {currentMineFaces.map((f) => <option key={f.id} value={f.id} className="bg-[#0A1628]">{f.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' : 'bg-white/5 text-white/40 border border-white/5'}`}>预警列表</button>
          <button onClick={() => setViewMode('review')} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${viewMode === 'review' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' : 'bg-white/5 text-white/40 border border-white/5'}`}>处置复盘</button>
        </div>
        {newCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm animate-pulse">
            <Bell className="w-4 h-4" />
            <span>系统自动检测到 {newCount} 条新预警</span>
            <button onClick={() => setNewCount(0)} className="ml-1 text-amber-400/60 hover:text-amber-300 text-xs">✕</button>
          </div>
        )}
      </div>

      {viewMode === 'review' ? (
        <DisposalReviewView />
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filtered.length === 0 && <p className="text-white/40 text-center py-20">暂无预警记录</p>}
            {filtered.map((alert) => (
              <GlassCard key={alert.id} glow={selectedId === alert.id} onClick={() => setSelectedId(selectedId === alert.id ? null : alert.id)}>
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 px-2 py-1 rounded text-xs font-bold border ${levelColors[alert.level]} ${alert.status === 'pending' ? 'animate-pulse' : ''}`}>{alert.level}级</div>
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
                    {alert.level === '1' ? <LevelOneActions alert={alert} /> : <ApprovalFlow alert={alert} />}
                    {alert.status === 'closed' && <AlertTimeline alert={alert} />}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
          {selected && (
            <div className="w-[360px] shrink-0">
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
                <div className="mt-3 pt-3 border-t border-white/10">
                  <button onClick={() => navigate(`/mine/${selected.mineId}`)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowRight className="w-3 h-3" />查看矿区详情
                  </button>
                </div>
                {selected.level === '1' ? <LevelOneActions alert={selected} /> : <ApprovalFlow alert={selected} />}
                {selected.status === 'closed' && <AlertTimeline alert={selected} />}
              </GlassCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
