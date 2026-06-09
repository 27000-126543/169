import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'
import * as echarts from 'echarts'
import { Upload, Play, Pause, Route, ShieldAlert } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import { riskPoints } from '@/data/mock'
import type { RiskPoint } from '@/data/mock'
import { useStore } from '@/store'

const TYPE_CFG: Record<string, { symbol: string; color: string }> = {
  '断层': { symbol: 'triangle', color: '#ef4444' },
  '水患': { symbol: 'circle', color: '#3b82f6' },
  '瓦斯': { symbol: 'diamond', color: '#f97316' },
  '顶板': { symbol: 'rect', color: '#eab308' },
}
const SEV_SIZE: Record<string, number> = { high: 18, medium: 12, low: 8 }
const INSPECT_BASE = [[20,20],[50,35],[50,55],[80,70],[80,90],[110,90],[110,70],[140,70],[140,50],[180,50]]
const EVAC_BASE = [[100,75],[100,50],[80,30],[50,15],[20,10]]

const X_CATS = Array.from({ length: 41 }, (_, i) => i * 5)
const Y_CATS = Array.from({ length: 31 }, (_, i) => i * 5)

function genHeatmap(hour: number, points: RiskPoint[]): [number, number, number][] {
  const d: [number, number, number][] = []
  for (let xi = 0; xi < X_CATS.length; xi++)
    for (let yi = 0; yi < Y_CATS.length; yi++) {
      const x = X_CATS[xi], y = Y_CATS[yi]
      let v = 0
      for (const rp of points) {
        const dx = x - rp.x, dy = y - rp.y
        const sf = rp.severity === 'high' ? 1 : rp.severity === 'medium' ? 0.6 : 0.3
        const tf = 0.5 + 0.5 * Math.sin((hour / 24) * Math.PI * 2 + rp.x * 0.05)
        v += sf * tf * Math.exp(-(dx * dx + dy * dy) / 800)
      }
      if (v > 0.01) d.push([xi, yi, +v.toFixed(3)])
    }
  return d
}

function deflectRoute(base: number[][], highPts: RiskPoint[], threshold = 25): number[][] {
  if (highPts.length === 0) return base
  return base.map(([bx, by]) => {
    let nx = bx, ny = by
    for (const rp of highPts) {
      const dx = bx - rp.x, dy = by - rp.y, dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < threshold && dist > 0) {
        const push = (threshold - dist) * 0.8
        nx += (dx / dist) * push
        ny += (dy / dist) * push
      }
    }
    return [Math.max(5, Math.min(195, +nx.toFixed(1))), Math.max(5, Math.min(145, +ny.toFixed(1)))]
  })
}

function routeDist(r: number[][]): number {
  let d = 0
  for (let i = 1; i < r.length; i++) {
    const dx = r[i][0] - r[i-1][0], dy = r[i][1] - r[i-1][1]
    d += Math.sqrt(dx * dx + dy * dy)
  }
  return d
}

const axisStyle = { lineStyle: { color: 'rgba(255,255,255,0.15)' } }
const axisLabel = { color: 'rgba(255,255,255,0.4)', fontSize: 10 }
const splitStyle = { lineStyle: { color: 'rgba(255,255,255,0.06)' } }

export default function Geology() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<RiskPoint[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedView, setSelectedView] = useState<'route' | 'evacuation' | null>(null)
  const [timeSlider, setTimeSlider] = useState(12)
  const [isPlaying, setIsPlaying] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInst = useRef<echarts.ECharts | null>(null)

  const geologyUploadedPoints = useStore(s => s.geologyUploadedPoints)
  const geologyAnalyzed = useStore(s => s.geologyAnalyzed)
  const setGeologyUploadedPoints = useStore(s => s.setGeologyUploadedPoints)
  const setGeologyAnalyzed = useStore(s => s.setGeologyAnalyzed)

  const allPoints = geologyAnalyzed ? [...riskPoints, ...geologyUploadedPoints] : riskPoints

  const { inspectRoute, evacRoute } = useMemo(() => {
    const highPts = (geologyAnalyzed ? geologyUploadedPoints : []).filter(p => p.severity === 'high')
    return { inspectRoute: deflectRoute(INSPECT_BASE, highPts), evacRoute: deflectRoute(EVAC_BASE, highPts) }
  }, [geologyAnalyzed, geologyUploadedPoints])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    setUploadedFile(file)
    setUploadProgress(0)
    const iv = setInterval(() =>
      setUploadProgress(p => { if (p >= 100) { clearInterval(iv); return 100 } return p + 10 }), 100)
    setTimeout(() => {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target!.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws) as Record<string, any>[]
        const parsed = json.map((r, i) => ({
          id: `excel-${i}`, type: r['类型'] || r.type || '瓦斯',
          x: Number(r.x || r.X) || +(Math.random() * 180 + 10).toFixed(1),
          y: Number(r.y || r.Y) || +(Math.random() * 130 + 10).toFixed(1),
          description: r['描述'] || r.description || 'Excel导入风险点',
          severity: r['等级'] || r.severity || 'medium',
        }))
        setParsedData(parsed)
        setGeologyUploadedPoints(parsed)
      }
      reader.readAsArrayBuffer(file)
    }, 1200)
  }, [setGeologyUploadedPoints])

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current)
    chartInst.current = chart
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); chartInst.current = null }
  }, [])

  useEffect(() => {
    if (!chartInst.current) return
    const chart = chartInst.current
    const scatterSeries = Object.entries(TYPE_CFG).map(([type, cfg]) => ({
      type: 'scatter' as const, name: type, z: 2,
      data: allPoints.filter(p => p.type === type).map(p => {
        const xi = X_CATS.reduce((best, v, i) => Math.abs(v - p.x) < Math.abs(X_CATS[best] - p.x) ? i : best, 0)
        const yi = Y_CATS.reduce((best, v, i) => Math.abs(v - p.y) < Math.abs(Y_CATS[best] - p.y) ? i : best, 0)
        return { value: [xi, yi], _sev: p.severity, _desc: p.description }
      }),
      symbol: cfg.symbol,
      symbolSize: (_val: any, params: any) => SEV_SIZE[params.data._sev] || 10,
      itemStyle: { color: cfg.color, shadowBlur: 8, shadowColor: cfg.color },
    }))

    const toCatIdx = (v: number, cats: number[]) => cats.reduce((best, cv, i) => Math.abs(cv - v) < Math.abs(cats[best] - v) ? i : best, 0)
    const routeSeries: any[] = []
    if (selectedView === 'route') routeSeries.push({
      type: 'line', data: inspectRoute.map(([x, y]) => [toCatIdx(x, X_CATS), toCatIdx(y, Y_CATS)]), z: 3,
      lineStyle: { color: '#22c55e', width: 3 }, symbol: 'arrow', symbolSize: 8,
      itemStyle: { color: '#22c55e' }, tooltip: { show: false },
    })
    if (selectedView === 'evacuation') routeSeries.push({
      type: 'line', data: evacRoute.map(([x, y]) => [toCatIdx(x, X_CATS), toCatIdx(y, Y_CATS)]), z: 3,
      lineStyle: { color: '#ef4444', width: 3, type: 'dashed' }, symbol: 'arrow', symbolSize: 8,
      itemStyle: { color: '#ef4444' }, tooltip: { show: false },
    })

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: X_CATS, axisLine: axisStyle, axisLabel, splitLine: splitStyle },
      yAxis: { type: 'category', data: Y_CATS, axisLine: axisStyle, axisLabel, splitLine: splitStyle },
      tooltip: {
        trigger: 'item', backgroundColor: 'rgba(10,22,40,0.9)',
        borderColor: 'rgba(255,255,255,0.15)', textStyle: { color: '#fff', fontSize: 12 },
        formatter: (p: any) => p.data?._desc ? `${p.seriesName}<br/>${p.data._desc}<br/>等级: ${p.data._sev}` : p.seriesName,
      },
      visualMap: { show: false, min: 0, max: 1, seriesIndex: 0, inRange: { color: ['#1e3a5f', '#3b82f6', '#eab308', '#ef4444'] } },
      series: [
        { type: 'heatmap', data: genHeatmap(timeSlider, allPoints), itemStyle: { opacity: 0.55 }, z: 1, tooltip: { show: false } },
        ...scatterSeries, ...routeSeries,
      ],
    }, true)
  }, [allPoints, timeSlider, selectedView, inspectRoute, evacRoute])

  useEffect(() => {
    if (!isPlaying) return
    const t = setInterval(() => setTimeSlider(v => v >= 24 ? 0 : v + 1), 500)
    return () => clearInterval(t)
  }, [isPlaying])

  const hasDetour = geologyAnalyzed && geologyUploadedPoints.some(p => p.severity === 'high')
  const iKm = (routeDist(inspectRoute) * 0.02).toFixed(1)
  const eKm = (routeDist(evacRoute) * 0.02).toFixed(1)
  const routeInfo = selectedView === 'route'
    ? { name: hasDetour ? '推荐巡检路线(避险)' : '推荐巡检路线', dist: `${iKm}km`,
        time: `约${Math.max(30, Math.round(+iKm * 20))}分钟`,
        cp: hasDetour ? ['主井口','1301工作面','绕行避险段','运输巷','2502工作面','安全通道','回风巷','观测站']
          : ['主井口','1301工作面','运输巷','2502工作面','回风巷','观测站'] }
    : selectedView === 'evacuation'
    ? { name: hasDetour ? '紧急撤离方案(避险)' : '紧急撤离方案', dist: `${eKm}km`,
        time: `约${Math.max(10, Math.round(+eKm * 14))}分钟`,
        cp: hasDetour ? ['当前位置','避险通道','中央大巷','主运输巷','安全出口','副井口','地面']
          : ['当前位置','中央大巷','主运输巷','副井口','地面'] }
    : null

  return (
    <div className="min-h-screen bg-[#0A1628] p-4 flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <GlassCard className="col-span-3 flex flex-col">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Upload size={16} /> 地质报告上传
          </h3>
          <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
            className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-blue-400/50 transition-colors cursor-pointer mb-3">
            <Upload size={28} className="mx-auto mb-2 text-white/40" />
            <p className="text-white/50 text-xs">拖拽Excel文件到此处</p>
            {uploadedFile && <p className="text-blue-400 text-xs mt-1">{uploadedFile.name}</p>}
          </div>
          {uploadedFile && (
            <div className="mb-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-white/40 text-xs mt-1">{uploadProgress < 100 ? '解析中...' : '解析完成'}</p>
            </div>
          )}
          {parsedData.length > 0 && (
            <div className="flex-1 overflow-auto mb-3">
              <table className="w-full text-xs text-white/70">
                <thead><tr className="text-white/40 border-b border-white/10">
                  <th className="py-1 text-left">类型</th><th className="py-1 text-left">等级</th><th className="py-1 text-left">描述</th>
                </tr></thead>
                <tbody>{parsedData.map(p => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-1">{p.type}</td><td className="py-1">{p.severity}</td>
                    <td className="py-1 truncate max-w-[100px]">{p.description}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <button onClick={() => {
            if (!geologyAnalyzed) setGeologyAnalyzed(true)
            else { setGeologyAnalyzed(false); setTimeout(() => setGeologyAnalyzed(true), 0) }
          }} disabled={parsedData.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white text-sm py-2 rounded-lg transition-colors">
            {geologyAnalyzed ? '重新分析' : '开始分析'}
          </button>
        </GlassCard>

        <GlassCard className="col-span-6 flex flex-col p-3">
          <h3 className="text-white font-semibold text-sm mb-2">矿井区域风险分布图</h3>
          <div className="flex gap-3 mb-2">
            {Object.entries(TYPE_CFG).map(([t, c]) => (
              <span key={t} className="flex items-center gap-1 text-xs text-white/60">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />{t}
              </span>
            ))}
          </div>
          <div ref={chartRef} className="flex-1 min-h-[350px]" />
        </GlassCard>

        <GlassCard className="col-span-3 flex flex-col">
          <h3 className="text-white font-semibold text-sm mb-3">24h危险预测</h3>
          <div className="text-center mb-3">
            <span className="text-4xl font-bold text-white">{timeSlider}:00</span>
          </div>
          <input type="range" min={0} max={24} value={timeSlider}
            onChange={e => setTimeSlider(+e.target.value)} className="w-full mb-3 accent-blue-500" />
          <button onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg transition-colors mb-4">
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}{isPlaying ? '暂停' : '播放'}
          </button>
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-white/50 text-xs">热力图图例:</p>
            <div className="h-3 rounded-full" style={{ background: 'linear-gradient(to right, #1e3a5f, #3b82f6, #eab308, #ef4444)' }} />
            <div className="flex justify-between text-xs text-white/40"><span>低</span><span>中</span><span>高</span></div>
          </div>
          <div className="mt-4 text-white/50 text-xs">
            <p>高风险区域: {allPoints.filter(p => p.severity === 'high').length} 处</p>
            <p>日间重点关注: {allPoints.filter(p => p.severity === 'high' && timeSlider >= 8 && timeSlider <= 20).length} 处</p>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="flex gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Route size={16} /> 巡检与撤离
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setSelectedView(selectedView === 'route' ? null : 'route')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${selectedView === 'route' ? 'bg-green-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              <Route size={14} className="inline mr-1" />推荐巡检路线
            </button>
            <button onClick={() => setSelectedView(selectedView === 'evacuation' ? null : 'evacuation')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${selectedView === 'evacuation' ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              <ShieldAlert size={14} className="inline mr-1" />撤离方案
            </button>
          </div>
        </div>
        {routeInfo && (
          <div className="flex-1 flex gap-6 items-center ml-4 border-l border-white/10 pl-4">
            <div><p className="text-white/40 text-xs">路线</p><p className="text-white text-sm font-semibold">{routeInfo.name}</p></div>
            <div><p className="text-white/40 text-xs">总距离</p><p className="text-white text-sm font-semibold">{routeInfo.dist}</p></div>
            <div><p className="text-white/40 text-xs">预计用时</p><p className="text-white text-sm font-semibold">{routeInfo.time}</p></div>
            <div className="flex-1">
              <p className="text-white/40 text-xs mb-1">关键节点</p>
              <div className="flex gap-2 flex-wrap">
                {routeInfo.cp.map((c, i) => <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">{c}</span>)}
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
