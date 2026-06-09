import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'
import GlassCard from '@/components/GlassCard'
import StatCard from '@/components/StatCard'
import { useStore } from '@/store'
import { mines, provinceCoords } from '@/data/mock'
import { useShallow } from 'zustand/react/shallow'

function getSafetyColor(val: number): string {
  if (val >= 90) return '#22c55e'
  if (val >= 80) return '#eab308'
  if (val >= 70) return '#f97316'
  return '#ef4444'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const selectedProvince = useStore((s) => s.selectedProvince)
  const setSelectedProvince = useStore((s) => s.setSelectedProvince)
  const { userRole, roleMineId } = useStore(useShallow(s => ({ userRole: s.userRole, roleMineId: s.roleMineId })))

  const mapRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const filteredProvinces = useMemo(() => useStore.getState().getFilteredProvinces(), [userRole, roleMineId, selectedProvince])
  const filteredMines = useMemo(() => useStore.getState().getFilteredMines(), [userRole, roleMineId, selectedProvince])
  const stats = useMemo(() => useStore.getState().getComputedStats(), [userRole, roleMineId, selectedProvince])
  const scopeLabel = useMemo(() => useStore.getState().getScopeLabel(), [userRole, roleMineId])
  const isGroup = userRole === 'group'

  useEffect(() => {
    if (!mapRef.current) return
    const chart = echarts.init(mapRef.current)

    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then((r) => r.json())
      .then((geoJson) => {
        echarts.registerMap('china', geoJson)
        const scatterData = filteredProvinces.map((p) => {
          const coord = provinceCoords[p.id]
          return {
            name: p.name,
            value: [coord.lng, coord.lat, p.safetyIndex],
            provinceId: p.id,
            safetyIndex: p.safetyIndex,
          }
        })

        chart.setOption({
          backgroundColor: 'transparent',
          geo: {
            map: 'china',
            roam: true,
            zoom: 1.2,
            label: { show: false },
            itemStyle: { areaColor: '#0d1f3c', borderColor: '#1e3a5f', borderWidth: 1 },
            emphasis: { itemStyle: { areaColor: '#162d50' } },
          },
          series: [
            {
              type: 'scatter',
              coordinateSystem: 'geo',
              data: scatterData,
              symbolSize: (val: number[]) => Math.max(12, (val[2] / 100) * 28),
              itemStyle: {
                color: (params: any) => getSafetyColor(params.data.safetyIndex),
                shadowBlur: 12,
                shadowColor: (params: any) => getSafetyColor(params.data.safetyIndex),
              },
              label: {
                show: true,
                formatter: '{b}',
                position: 'right',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 10,
              },
              tooltip: {
                formatter: (params: any) =>
                  `${params.data.name}<br/>安全指数: ${params.data.safetyIndex}`,
              },
            },
            {
              type: 'effectScatter',
              coordinateSystem: 'geo',
              data: scatterData.filter((d) => d.safetyIndex < 80),
              symbolSize: (val: number[]) => Math.max(14, (val[2] / 100) * 28),
              rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
              itemStyle: {
                color: (params: any) => getSafetyColor(params.data.safetyIndex),
                shadowBlur: 16,
                shadowColor: (params: any) => getSafetyColor(params.data.safetyIndex),
              },
              tooltip: {
                formatter: (params: any) =>
                  `${params.data.name}<br/>安全指数: ${params.data.safetyIndex}`,
              },
            },
          ],
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(10,22,40,0.9)',
            borderColor: 'rgba(255,255,255,0.15)',
            textStyle: { color: '#fff', fontSize: 12 },
          },
        })

        chart.on('click', (params: any) => {
          const provinceId = params.data?.provinceId
          if (!provinceId) return
          const firstMine = mines.find((m) => m.provinceId === provinceId)
          if (firstMine) navigate(`/mine/${firstMine.id}`)
        })
      })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [filteredProvinces, userRole, roleMineId, navigate])

  useEffect(() => {
    if (!barRef.current) return
    const chart = echarts.init(barRef.current)

    const sorted = [...filteredMines].sort(
      (a, b) => b.gasOverlimitDuration - a.gasOverlimitDuration
    )
    const top10 = sorted.slice(0, 10)

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 140, right: 40, top: 20, bottom: 30 },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        type: 'category',
        data: top10.map((m) => m.name),
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: (idx: number) => (idx < 3 ? '#f97316' : 'rgba(255,255,255,0.7)'),
          fontSize: 11,
          formatter: (val: string, idx: number) => (idx < 3 ? `🔴 ${val}` : val),
        },
      },
      series: [
        {
          type: 'bar',
          data: top10.map((m, i) => ({
            value: m.gasOverlimitDuration,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: i < 3 ? '#f97316' : '#3b82f6' },
                { offset: 1, color: i < 3 ? '#ef4444' : '#f97316' },
              ]),
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: 16,
          label: {
            show: true,
            position: 'right',
            formatter: '{c}h',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 11,
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,22,40,0.9)',
        borderColor: 'rgba(255,255,255,0.15)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0]
          return `${p.name}<br/>瓦斯超限时长: ${p.value}h`
        },
      },
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [filteredMines, userRole, roleMineId])

  const mapTitle = isGroup ? '全国矿井安全分布' : '矿区安全分布'

  return (
    <div className="min-h-screen bg-[#0A1628] p-6 flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="安全指数"
          value={stats.safetyIndex}
          trend={stats.safetyIndexTrend}
          unit="分"
          positiveIsGood
        />
        <StatCard
          label="设备开机率"
          value={stats.equipmentUptimeRate}
          trend={stats.equipmentTrend}
          unit="%"
          positiveIsGood
        />
        <StatCard
          label="人员违规率"
          value={stats.violationRate}
          trend={stats.violationTrend}
          unit="%"
          positiveIsGood={false}
        />
        <StatCard
          label="瓦斯超限时长"
          value={stats.gasOverlimitDuration}
          trend={stats.gasTrend}
          unit="h"
          positiveIsGood={false}
        />
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <GlassCard className="flex-[3] flex flex-col p-4 min-h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-base">{mapTitle}</h2>
            {isGroup && (
              <select
                value={selectedProvince ?? ''}
                onChange={(e) => setSelectedProvince(e.target.value || null)}
                className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0A1628]">全部省份</option>
                {filteredProvinces.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0A1628]">
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div ref={mapRef} className="flex-1 min-h-0" />
        </GlassCard>

        <GlassCard className="flex-[2] flex flex-col p-4 min-h-[500px]">
          <h2 className="text-white font-semibold text-base mb-3">
            {scopeLabel}瓦斯超限时长 TOP{Math.min(filteredMines.length, 10)}
          </h2>
          <div ref={barRef} className="flex-1 min-h-0" />
        </GlassCard>
      </div>
    </div>
  )
}
