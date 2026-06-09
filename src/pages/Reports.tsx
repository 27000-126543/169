import { useEffect, useRef, useMemo, useState } from 'react'
import * as echarts from 'echarts'
import GlassCard from '@/components/GlassCard'
import { useStore } from '@/store'
import { workingFaces, mines, type AlertRecord } from '@/data/mock'
import { useShallow } from 'zustand/react/shallow'
import { TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, Wrench, MapPin, ChevronDown, FileText, ClipboardList } from 'lucide-react'

function getRectColor(rate: number) {
  if (rate > 85) return '#22c55e'
  if (rate >= 70) return '#eab308'
  return '#ef4444'
}

function CompareBadge({ value, inverse }: { value: number; inverse?: boolean }) {
  const down = value < 0
  const good = inverse ? !down : down
  const pct = Math.abs(value).toFixed(1)
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${good ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {down ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
      {pct}%
    </span>
  )
}

function CircleProgress({ rate, size = 120, stroke = 10 }: { rate: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - rate / 100)
  const color = getRectColor(rate)
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
    </svg>
  )
}

function getWeekPeriod() {
  const now = new Date()
  const day = now.getDay() || 7
  const mon = new Date(now)
  mon.setDate(now.getDate() - day + 1)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${fmt(mon)} ~ ${fmt(sun)}`
}

interface WeekData { week: string; violationRate: number; violationRateYoy: number; violationRateQoq: number }

function buildSyntheticWeeks(current: { week: string; violationRate: number; violationRateYoy: number; violationRateQoq: number }) {
  const weekNum = parseInt(current.week.replace(/[^\d]/g, ''), 10)
  const weeks = []
  for (let i = 3; i >= 0; i--) {
    const wk = weekNum - i
    const vr = +(current.violationRate + (Math.random() - 0.5) * 4).toFixed(1)
    const yoy = +(current.violationRateYoy + (Math.random() - 0.5) * 3).toFixed(1)
    const qoq = +(current.violationRateQoq + (Math.random() - 0.5) * 2).toFixed(1)
    weeks.push({ week: `第${wk}周`, violationRate: vr, violationRateYoy: yoy, violationRateQoq: qoq })
  }
  return weeks
}

function buildPrevRectRates(currentRate: number) {
  const rates: { week: string; rate: number }[] = []
  const weekNum = parseInt(new Date().toLocaleDateString('zh-CN', { weekday: 'narrow' }) ? String(Math.ceil(new Date().getDate() / 7)) : '22', 10)
  for (let i = 3; i >= 1; i--) {
    const wk = weekNum - i
    rates.push({ week: `第${wk}周`, rate: +(currentRate - 3 - Math.random() * 8).toFixed(1) })
  }
  return rates
}

const priorityBg: Record<string, string> = { 高: 'bg-red-500/20 text-red-400', 中: 'bg-yellow-500/20 text-yellow-400', 低: 'bg-green-500/20 text-green-400' }

function FaceReportPreview() {
  const { roleMineId, roleFaceId } = useStore(useShallow(s => ({ roleMineId: s.roleMineId, roleFaceId: s.roleFaceId })))
  const getDisposalReview = useStore((s) => s.getDisposalReview)
  const [expandedFace, setExpandedFace] = useState<string | null>(roleFaceId)

  const faces = useMemo(() => {
    if (!roleMineId) return []
    const all = workingFaces[roleMineId] || []
    if (roleFaceId) return all.filter(f => f.id === roleFaceId)
    return all
  }, [roleMineId, roleFaceId])

  const mine = mines.find(m => m.id === roleMineId)
  const reviewData = useMemo(() => getDisposalReview(), [getDisposalReview])

  const faceReports = useMemo(() => {
    return faces.map(face => {
      const faceReview = reviewData.find(r => r.faceId === face.id)
      const faults = [
        { type: '采煤机故障', count: Math.round((100 - mine!.safetyIndex) * 0.01 * (face.gasConcentration > 1 ? 2 : 1)) },
        { type: '液压支架故障', count: Math.round((100 - mine!.safetyIndex) * 0.007) },
        { type: '输送机故障', count: Math.round((100 - mine!.safetyIndex) * 0.012) },
        { type: '通风设备故障', count: Math.round((100 - mine!.safetyIndex) * 0.004) },
      ].filter(f => f.count > 0)
      const riskSummary = face.gasConcentration > 1
        ? `瓦斯浓度${face.gasConcentration}%超限，属于高风险工作面`
        : face.status === 'warning'
          ? `状态预警，需重点关注粉尘和振动指标`
          : `当前安全指标正常，建议持续监控`
      return { face, faceReview, faults, riskSummary }
    })
  }, [faces, reviewData, mine])

  if (faces.length === 0) return <p className="text-white/40 text-sm text-center py-6">暂无工作面数据</p>

  return (
    <div className="space-y-3">
      {faceReports.map(({ face, faceReview, faults, riskSummary }) => (
        <div key={face.id} className="rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setExpandedFace(expandedFace === face.id ? null : face.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${face.status === 'safe' ? 'bg-green-400' : face.status === 'warning' ? 'bg-orange-400' : 'bg-red-400'}`} />
              <span className="text-white text-sm font-medium">{face.name}</span>
              <span className="text-white/30 text-xs">{riskSummary.slice(0, 20)}...</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expandedFace === face.id ? 'rotate-180' : ''}`} />
          </button>
          {expandedFace === face.id && (
            <div className="px-4 py-3 space-y-3 border-t border-white/5">
              <div>
                <h5 className="text-white/50 text-xs font-semibold mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-400" />风险摘要</h5>
                <p className="text-white/80 text-sm">{riskSummary}</p>
                <div className="flex gap-4 mt-1 text-xs text-white/40">
                  <span>瓦斯: <span className={face.gasConcentration > 1 ? 'text-red-400' : 'text-white/60'}>{face.gasConcentration}%</span></span>
                  <span>粉尘: <span className="text-white/60">{face.dustLevel}mg/m³</span></span>
                  <span>振动: <span className="text-white/60">{face.vibrationLevel}mm/s</span></span>
                </div>
              </div>
              {faceReview && faceReview.totalAlerts > 0 && (
                <div>
                  <h5 className="text-white/50 text-xs font-semibold mb-1 flex items-center gap-1"><ClipboardList className="w-3 h-3 text-blue-400" />处置复盘</h5>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-white/5 text-center"><span className="text-white/40 block">预警数</span><span className="text-white font-bold">{faceReview.totalAlerts}</span></div>
                    <div className="p-2 rounded bg-white/5 text-center"><span className="text-white/40 block">处置耗时</span><span className="text-yellow-400 font-bold">{faceReview.l1AvgDisposalMin}min</span></div>
                    <div className="p-2 rounded bg-white/5 text-center"><span className="text-white/40 block">撤离人数</span><span className="text-red-400 font-bold">{faceReview.totalEvacuated}</span></div>
                    <div className="p-2 rounded bg-white/5 text-center"><span className="text-white/40 block">闭环率</span><span className={`font-bold ${faceReview.closureRate >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{faceReview.closureRate}%</span></div>
                  </div>
                </div>
              )}
              {faults.length > 0 && (
                <div>
                  <h5 className="text-white/50 text-xs font-semibold mb-1 flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-400" />设备故障分布</h5>
                  <div className="flex gap-2 flex-wrap">
                    {faults.map(f => (
                      <span key={f.type} className="text-xs px-2 py-1 rounded bg-white/5 text-white/60">{f.type} <span className="text-white font-bold">{f.count}</span></span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h5 className="text-white/50 text-xs font-semibold mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-green-400" />下周巡检重点</h5>
                <p className="text-white/70 text-sm">建议重点关注 {face.name} 的{face.gasConcentration > 1 ? '瓦斯浓度变化趋势' : '设备运行状态和粉尘指标'}，{faceReview && faceReview.totalAlerts > 0 ? `本周已发生${faceReview.totalAlerts}次预警需跟踪整改` : '本周无预警，保持常规巡检频率'}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Reports() {
  const { userRole, roleMineId, roleFaceId } = useStore(useShallow(s => ({ userRole: s.userRole, roleMineId: s.roleMineId, roleFaceId: s.roleFaceId })))
  const current = useMemo(() => useStore.getState().getComputedWeeklyReport(), [userRole, roleMineId, roleFaceId])
  const prev = useMemo(() => useStore.getState().getComputedPrevWeeklyReport(), [userRole, roleMineId, roleFaceId])
  const scopeLabel = useMemo(() => useStore.getState().getScopeLabel(), [userRole, roleMineId, roleFaceId])
  const filteredMines = useMemo(() => useStore.getState().getFilteredMines(), [userRole, roleMineId, roleFaceId])

  const lineRef = useRef<HTMLDivElement>(null)
  const doughnutRef = useRef<HTMLDivElement>(null)

  const faultTotal = current.equipmentFaultTypes.reduce((s, f) => s + f.count, 0)

  const synWeeks = useMemo(() => buildSyntheticWeeks(current), [current])
  const prevRectRates = useMemo(() => buildPrevRectRates(current.hazardRectificationRate), [current.hazardRectificationRate])

  const recommendations = useMemo(() => {
    const recs: { icon: typeof ShieldCheck; text: string; priority: string; color: string }[] = []
    if (current.violationRate > 10) {
      recs.push({ icon: ShieldCheck, text: '违规率偏高，建议加强安全培训和现场监管', priority: '高', color: 'text-red-400' })
    } else if (current.violationRate < 8) {
      recs.push({ icon: ShieldCheck, text: '违规率呈下降趋势，建议持续加强安全培训', priority: '低', color: 'text-green-400' })
    }
    const maxFault = current.equipmentFaultTypes.reduce((a, b) => a.count > b.count ? a : b, current.equipmentFaultTypes[0])
    if (maxFault?.type === '输送机故障') {
      recs.push({ icon: Wrench, text: '输送机故障占比最高，建议加强日常维护', priority: '高', color: 'text-red-400' })
    }
    if (current.hazardRectificationRate > 85) {
      recs.push({ icon: TrendingUp, text: '隐患整改率良好，建议保持当前力度', priority: '低', color: 'text-green-400' })
    }
    const faceNames = (current as any).faceNames as string[] | undefined
    if (faceNames && faceNames.length > 0) {
      const topFaces = faceNames.slice(0, 3).join('、')
      recs.push({ icon: MapPin, text: `推荐下周重点巡检区域：${topFaces}`, priority: '中', color: 'text-yellow-400' })
    } else {
      const allFaces: string[] = []
      filteredMines.forEach(m => {
        (workingFaces[m.id] || []).forEach(f => allFaces.push(f.name))
      })
      const topFaces = allFaces.slice(0, 3).join('、')
      recs.push({ icon: MapPin, text: `推荐下周重点巡检区域：${topFaces}`, priority: '中', color: 'text-yellow-400' })
    }
    return recs
  }, [current, filteredMines])

  useEffect(() => {
    if (!lineRef.current) return
    const chart = echarts.init(lineRef.current)
    chart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,22,40,0.9)', borderColor: 'rgba(255,255,255,0.15)', textStyle: { color: '#fff', fontSize: 12 } },
      legend: { data: ['违规率', '同比', '环比'], textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 }, top: 5, right: 10 },
      xAxis: { type: 'category', data: synWeeks.map(w => w.week), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } }, axisLabel: { color: 'rgba(255,255,255,0.6)' } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: '{value}%' } },
      series: [
        {
          name: '违规率', type: 'line', data: synWeeks.map(w => w.violationRate),
          smooth: true, symbol: 'circle', symbolSize: 8,
          lineStyle: { color: '#00D4FF', width: 3 },
          itemStyle: { color: '#00D4FF' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,212,255,0.35)' }, { offset: 1, color: 'rgba(0,212,255,0.02)' }]) },
        },
        {
          name: '同比', type: 'line', data: synWeeks.map(w => w.violationRateYoy),
          smooth: true, symbol: 'diamond', symbolSize: 6,
          lineStyle: { color: '#FF6B35', width: 2, type: 'dashed' },
          itemStyle: { color: '#FF6B35' },
        },
        {
          name: '环比', type: 'line', data: synWeeks.map(w => w.violationRateQoq),
          smooth: true, symbol: 'triangle', symbolSize: 6,
          lineStyle: { color: '#FFB300', width: 2, type: 'dashed' },
          itemStyle: { color: '#FFB300' },
        },
      ],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [synWeeks, userRole, roleMineId, roleFaceId])

  useEffect(() => {
    if (!doughnutRef.current) return
    const chart = echarts.init(doughnutRef.current)
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e']
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: 'rgba(10,22,40,0.9)', borderColor: 'rgba(255,255,255,0.15)', textStyle: { color: '#fff', fontSize: 12 } },
      legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 } },
      graphic: [{ type: 'text', left: 'center', top: '45%', style: { text: `${faultTotal}`, fill: '#fff', fontSize: 28, fontWeight: 700, textAlign: 'center' } }, { type: 'text', left: 'center', top: '58%', style: { text: '故障总数', fill: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' } }],
      series: [{
        type: 'pie', radius: ['50%', '72%'], center: ['50%', '50%'],
        label: { show: false },
        data: current.equipmentFaultTypes.map((f, i) => ({ value: f.count, name: f.type, itemStyle: { color: colors[i] } })),
        emphasis: { itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,0.4)' } },
        itemStyle: { borderColor: '#0A1628', borderWidth: 2 },
      }],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [faultTotal, current.equipmentFaultTypes, userRole, roleMineId, roleFaceId])

  const violationDelta = ((prev.totalViolations - current.totalViolations) / (prev.totalViolations || 1) * 100).toFixed(1)
  const faultDelta = ((prev.totalFaults - current.totalFaults) / (prev.totalFaults || 1) * 100).toFixed(1)
  const rectDelta = (current.hazardRectificationRate - prev.hazardRectificationRate).toFixed(1)

  return (
    <div className="min-h-screen bg-[#0A1628] p-6 flex flex-col gap-5">
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-lg font-semibold">{current.week} 安全生产诊断报告 — {scopeLabel}</h1>
          <span className="text-xs text-white/40">报告周期：{getWeekPeriod()}</span>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/50 text-xs">总违章数</span>
            <span className="text-white text-2xl font-bold">{current.totalViolations}</span>
            <CompareBadge value={-parseFloat(violationDelta)} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/50 text-xs">总设备故障</span>
            <span className="text-white text-2xl font-bold">{current.totalFaults}</span>
            <CompareBadge value={-parseFloat(faultDelta)} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/50 text-xs">隐患整改率</span>
            <span className="text-2xl font-bold" style={{ color: getRectColor(current.hazardRectificationRate) }}>{current.hazardRectificationRate}%</span>
            <CompareBadge value={parseFloat(rectDelta)} />
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-4">
        <GlassCard className="w-1/2 flex flex-col" style={{ minHeight: 340 }}>
          <h2 className="text-white font-semibold text-sm mb-2">违规率趋势</h2>
          <div ref={lineRef} className="flex-1 min-h-0" />
        </GlassCard>
        <GlassCard className="w-1/2 flex flex-col" style={{ minHeight: 340 }}>
          <h2 className="text-white font-semibold text-sm mb-2">设备故障分布</h2>
          <div ref={doughnutRef} className="flex-1 min-h-0" />
        </GlassCard>
      </div>

      <div className="flex gap-4">
        <GlassCard className="w-1/2 flex flex-col items-center justify-center py-6" style={{ minHeight: 300 }}>
          <h2 className="text-white font-semibold text-sm mb-4 self-start">隐患整改率</h2>
          <div className="relative">
            <CircleProgress rate={current.hazardRectificationRate} size={140} stroke={12} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-xl font-bold">{current.hazardRectificationRate}%</span>
              <span className="text-white/40 text-xs">本周</span>
            </div>
          </div>
          <div className="flex gap-6 mt-5">
            {prevRectRates.map((w) => (
              <div key={w.week} className="flex flex-col items-center gap-1">
                <CircleProgress rate={w.rate} size={48} stroke={4} />
                <span className="text-white/40 text-[10px]">{w.week}</span>
                <span className="text-xs font-medium" style={{ color: getRectColor(w.rate) }}>{w.rate}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="w-1/2 flex flex-col" style={{ minHeight: 300 }}>
          <h2 className="text-white font-semibold text-sm mb-3">
            <AlertTriangle size={14} className="inline mr-1.5 text-yellow-400" />
            优化建议
          </h2>
          <div className="flex flex-col gap-3 flex-1">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3">
                <rec.icon size={18} className={rec.color + ' mt-0.5 shrink-0'} />
                <p className="text-white/80 text-sm leading-relaxed flex-1">{rec.text}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${priorityBg[rec.priority]}`}>{rec.priority}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {(userRole === 'mine' || userRole === 'team') && roleMineId && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              班组周报预览
            </h2>
            <span className="text-white/30 text-xs">导出前预览</span>
          </div>
          <FaceReportPreview />
        </GlassCard>
      )}
    </div>
  )
}
