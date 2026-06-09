import { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts'
import GlassCard from '@/components/GlassCard'
import { useStore } from '@/store'
import { workingFaces } from '@/data/mock'
import { useShallow } from 'zustand/react/shallow'
import { TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, Wrench, MapPin } from 'lucide-react'

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

export default function Reports() {
  const { userRole, roleMineId } = useStore(useShallow(s => ({ userRole: s.userRole, roleMineId: s.roleMineId })))
  const current = useMemo(() => useStore.getState().getComputedWeeklyReport(), [userRole, roleMineId])
  const prev = useMemo(() => useStore.getState().getComputedPrevWeeklyReport(), [userRole, roleMineId])
  const scopeLabel = useMemo(() => useStore.getState().getScopeLabel(), [userRole, roleMineId])
  const filteredMines = useMemo(() => useStore.getState().getFilteredMines(), [userRole, roleMineId])

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
    const faceNames: string[] = []
    filteredMines.forEach(m => {
      (workingFaces[m.id] || []).forEach(f => faceNames.push(f.name))
    })
    const topFaces = faceNames.slice(0, 3).join('、')
    recs.push({ icon: MapPin, text: `推荐下周重点巡检区域：${topFaces}`, priority: '中', color: 'text-yellow-400' })
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
  }, [synWeeks, userRole, roleMineId])

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
  }, [faultTotal, current.equipmentFaultTypes, userRole, roleMineId])

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
    </div>
  )
}
