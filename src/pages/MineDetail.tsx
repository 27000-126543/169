import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as echarts from 'echarts'
import GlassCard from '@/components/GlassCard'
import {
  mines,
  workingFaces,
  generateGasTrend,
  generatePersonnelTracks,
  generateViolations,
  violationTypes,
} from '@/data/mock'
import { useStore } from '@/store'

const statusColors: Record<string, string> = {
  safe: 'border-green-500/60 shadow-green-500/20',
  warning: 'border-orange-500/60 shadow-orange-500/20',
  stopped: 'border-red-500/60 shadow-red-500/20',
}
const statusLabel: Record<string, string> = {
  safe: '安全',
  warning: '预警',
  stopped: '停工',
}
const statusDot: Record<string, string> = {
  safe: 'bg-green-400',
  warning: 'bg-orange-400',
  stopped: 'bg-red-400',
}

export default function MineDetail() {
  const { mineId } = useParams<{ mineId: string }>()
  const navigate = useNavigate()
  const setSelectedMine = useStore((s) => s.setSelectedMine)

  const mine = mines.find((m) => m.id === mineId)
  const faces = mineId ? workingFaces[mineId] || [] : []

  const [selectedFaceId, setSelectedFaceId] = useState<string>(
    faces[0]?.id || '',
  )

  const gasRef = useRef<HTMLDivElement>(null)
  const heatmapRef = useRef<HTMLDivElement>(null)
  const pieRef = useRef<HTMLDivElement>(null)

  const selectedFace = faces.find((f) => f.id === selectedFaceId)

  useEffect(() => {
    if (mineId) setSelectedMine(mineId)
  }, [mineId, setSelectedMine])

  useEffect(() => {
    if (faces.length > 0 && !faces.find((f) => f.id === selectedFaceId)) {
      setSelectedFaceId(faces[0].id)
    }
  }, [faces, selectedFaceId])

  useEffect(() => {
    if (!gasRef.current || !selectedFaceId) return
    const chart = echarts.init(gasRef.current, 'dark')
    const data = generateGasTrend(selectedFaceId)
    const times = data.map((d) => {
      const dt = new Date(d.timestamp)
      return `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
    })
    const values = data.map((d) => d.gasConcentration)

    chart.setOption({
      backgroundColor: 'transparent',
      title: {
        text: `${selectedFace?.name || ''} - 瓦斯浓度趋势（7天）`,
        left: 'center',
        top: 10,
        textStyle: { color: '#e2e8f0', fontSize: 14 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (p: any) => {
          const v = p[0]
          const color = v.value > 1 ? '#f87171' : '#60a5fa'
          return `${v.axisValue}<br/><span style="color:${color}">●</span> 瓦斯: ${v.value}%`
        },
      },
      grid: { left: 50, right: 20, top: 50, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        axisLabel: {
          color: '#94a3b8',
          interval: Math.floor(times.length / 8),
          fontSize: 10,
        },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      yAxis: {
        type: 'value',
        name: '浓度(%)',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#60a5fa', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(96,165,250,0.35)' },
              { offset: 1, color: 'rgba(96,165,250,0.02)' },
            ]),
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
            data: [{ yAxis: 1.0, label: { formatter: '阈值 1.0%', color: '#f87171' } }],
          },
        },
        {
          type: 'line',
          data: values.map((v) => (v > 1 ? v : null)),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 0 },
          areaStyle: { color: 'rgba(239,68,68,0.25)' },
          connectNulls: false,
        },
      ],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [selectedFaceId, selectedFace])

  useEffect(() => {
    if (!heatmapRef.current || !selectedFaceId) return
    const chart = echarts.init(heatmapRef.current, 'dark')
    const tracks = generatePersonnelTracks(selectedFaceId)

    const gridX = 20,
      gridY = 15
    const heatData: number[][] = []
    for (let i = 0; i < gridX; i++) {
      for (let j = 0; j < gridY; j++) {
        let count = 0
        tracks.forEach((t) => {
          const tx = Math.floor((t.x / 200) * gridX)
          const ty = Math.floor((t.y / 150) * gridY)
          if (tx === i && ty === j) count++
        })
        heatData.push([i, j, count])
      }
    }

    chart.setOption({
      backgroundColor: 'transparent',
      title: {
        text: '人员轨迹热力图',
        left: 'center',
        top: 10,
        textStyle: { color: '#e2e8f0', fontSize: 14 },
      },
      tooltip: {
        formatter: (p: any) =>
          `区域 (${p.data[0]}, ${p.data[1]})<br/>人员数: ${p.data[2]}`,
      },
      grid: { left: 40, right: 40, top: 50, bottom: 40 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: gridX }, (_, i) => i),
        axisLabel: { color: '#64748b', fontSize: 9 },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      yAxis: {
        type: 'category',
        data: Array.from({ length: gridY }, (_, i) => i),
        axisLabel: { color: '#64748b', fontSize: 9 },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      visualMap: {
        min: 0,
        max: Math.max(...heatData.map((d) => d[2]), 1),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: ['#1e3a5f', '#3b82f6', '#f59e0b', '#ef4444'] },
        textStyle: { color: '#94a3b8' },
        itemWidth: 12,
        itemHeight: 100,
      },
      series: [
        {
          type: 'heatmap',
          data: heatData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
        },
      ],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [selectedFaceId])

  useEffect(() => {
    if (!pieRef.current || !selectedFaceId) return
    const chart = echarts.init(pieRef.current, 'dark')
    const violations = generateViolations(selectedFaceId)
    const total = violations.length
    const typeMap: Record<string, number> = {}
    violationTypes.forEach((t) => (typeMap[t] = 0))
    violations.forEach((v) => {
      if (typeMap[v.type] !== undefined) typeMap[v.type]++
    })
    const pieData = Object.entries(typeMap)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))

    chart.setOption({
      backgroundColor: 'transparent',
      title: {
        text: '违规类型分布',
        left: 'center',
        top: 10,
        textStyle: { color: '#e2e8f0', fontSize: 14 },
      },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: `${total}\n违规总数`,
          fill: '#e2e8f0',
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 24,
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '55%'],
          label: { color: '#cbd5e1', fontSize: 11 },
          itemStyle: { borderColor: '#0f172a', borderWidth: 2 },
          data: pieData,
        },
      ],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [selectedFaceId])

  if (!mine) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        未找到该矿井信息
      </div>
    )
  }

  const safetyColor =
    mine.safetyIndex >= 85
      ? 'bg-green-500/20 text-green-400'
      : mine.safetyIndex >= 75
        ? 'bg-orange-500/20 text-orange-400'
        : 'bg-red-500/20 text-red-400'

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/20 transition-colors"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold text-white">{mine.name}</h1>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${safetyColor}`}>
          安全指数 {mine.safetyIndex}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {faces.map((face) => {
          const selected = face.id === selectedFaceId
          return (
            <GlassCard
              key={face.id}
              onClick={() => setSelectedFaceId(face.id)}
              className={`min-w-[200px] shrink-0 p-4 border-2 transition-all ${statusColors[face.status]} ${selected ? 'ring-2 ring-sky-400/50' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2 w-2 rounded-full ${statusDot[face.status]}`} />
                <span className="text-sm font-semibold text-white">
                  {face.name}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>瓦斯浓度</span>
                  <span className={face.gasConcentration > 1 ? 'text-red-400' : 'text-slate-200'}>
                    {face.gasConcentration}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>粉尘</span>
                  <span className="text-slate-200">{face.dustLevel} mg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span>风机</span>
                  <span className="text-slate-200">{face.fanStatus} rpm</span>
                </div>
                <div className="flex justify-between">
                  <span>振动</span>
                  <span className="text-slate-200">{face.vibrationLevel} mm/s</span>
                </div>
                <div className="flex justify-between">
                  <span>人员</span>
                  <span className="text-slate-200">{face.personnelCount} 人</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${statusDot[face.status]} bg-opacity-20 text-${face.status === 'safe' ? 'green' : face.status === 'warning' ? 'orange' : 'red'}-400`}>
                  {statusLabel[face.status]}
                </span>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <GlassCard className="p-2">
        <div ref={gasRef} className="h-72 w-full" />
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-2">
          <div ref={heatmapRef} className="h-72 w-full" />
        </GlassCard>
        <GlassCard className="p-2">
          <div ref={pieRef} className="h-72 w-full" />
        </GlassCard>
      </div>
    </div>
  )
}
