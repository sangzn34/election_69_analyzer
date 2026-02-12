import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Map, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react'
import type { ProvinceMapItem } from '../types'

// ─── GeoJSON types ───
interface GeoFeature {
  type: 'Feature'
  properties: { name: string }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

interface GeoJSON {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

// ─── Mercator projection for Thailand ───
function projectPoint(lon: number, lat: number, width: number, height: number): [number, number] {
  // Thailand bounding box (approx)
  const minLon = 97.3
  const maxLon = 105.7
  const minLat = 5.6
  const maxLat = 20.5

  const x = ((lon - minLon) / (maxLon - minLon)) * width
  // Mercator Y: flip latitude
  const latRad = (lat * Math.PI) / 180
  const minLatRad = (minLat * Math.PI) / 180
  const maxLatRad = (maxLat * Math.PI) / 180
  const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
  const mercMinY = Math.log(Math.tan(Math.PI / 4 + minLatRad / 2))
  const mercMaxY = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2))
  const y = height - ((mercY - mercMinY) / (mercMaxY - mercMinY)) * height

  return [x, y]
}

function polygonToPath(coords: number[][], w: number, h: number): string {
  return coords
    .map((pt, i) => {
      const [x, y] = projectPoint(pt[0], pt[1], w, h)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ') + 'Z'
}

function featureToPath(feature: GeoFeature, w: number, h: number): string {
  const { type, coordinates } = feature.geometry
  if (type === 'Polygon') {
    return (coordinates as number[][][]).map(ring => polygonToPath(ring, w, h)).join(' ')
  }
  // MultiPolygon
  return (coordinates as number[][][][])
    .map(poly => poly.map(ring => polygonToPath(ring, w, h)).join(' '))
    .join(' ')
}

// ─── Color mode types ───
type ColorMode = 'party' | 'seats' | 'suspicious'

interface Props {
  data: ProvinceMapItem[]
}

export default function ProvinceMap({ data }: Props) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null)
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [colorMode, setColorMode] = useState<ColorMode>('party')
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  const SVG_W = 440
  const SVG_H = 700

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}thailand-provinces.json`)
      .then(r => r.json())
      .then(setGeoData)
      .catch(err => console.error('Failed to load GeoJSON:', err))
  }, [])

  // Build lookup: English province name -> data
  const dataLookup = useMemo(() => {
    const map: Record<string, ProvinceMapItem> = {}
    for (const d of data) {
      map[d.provinceEng] = d
    }
    return map
  }, [data])

  // Unique parties for the legend
  const uniqueParties = useMemo(() => {
    const partyMap: Record<string, { name: string; color: string; totalSeats: number }> = {}
    for (const d of data) {
      for (const p of d.parties) {
        if (!partyMap[p.partyCode]) {
          partyMap[p.partyCode] = { name: p.partyName, color: p.partyColor, totalSeats: 0 }
        }
        partyMap[p.partyCode].totalSeats += p.seats
      }
    }
    return Object.entries(partyMap)
      .sort((a, b) => b[1].totalSeats - a[1].totalSeats)
      .map(([code, info]) => ({ code, ...info }))
  }, [data])

  // Get province fill color based on color mode
  const getFill = useCallback(
    (engName: string): string => {
      const d = dataLookup[engName]
      if (!d) return '#2d3148'

      if (colorMode === 'party') {
        return d.dominantPartyColor || '#666'
      }
      if (colorMode === 'seats') {
        // Gradient: fewer seats = lighter, more seats = darker
        const maxSeats = Math.max(...data.map(p => p.totalSeats))
        const ratio = d.totalSeats / maxSeats
        const r = Math.round(30 + (1 - ratio) * 80)
        const g = Math.round(100 + ratio * 155)
        const b = Math.round(180 + (1 - ratio) * 50)
        return `rgb(${r},${g},${b})`
      }
      // suspicious
      if (d.suspiciousCount === 0) return '#2d4a3e'
      const maxSusp = Math.max(...data.map(p => p.suspiciousCount))
      const ratio = d.suspiciousCount / maxSusp
      const r = Math.round(80 + ratio * 175)
      const g = Math.round(60 * (1 - ratio))
      const b = Math.round(40 * (1 - ratio))
      return `rgb(${r},${g},${b})`
    },
    [colorMode, data, dataLookup],
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    },
    [pan],
  )

  const handleMouseMovePan = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    },
    [isPanning, panStart],
  )

  const handleMouseUp = useCallback(() => setIsPanning(false), [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const newZoom = Math.max(0.5, Math.min(5, zoom * (e.deltaY < 0 ? 1.15 : 0.87)))
      setZoom(newZoom)
    },
    [zoom],
  )

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedProvince(null)
  }, [])

  const hoveredData = hoveredProvince ? dataLookup[hoveredProvince] : null
  const selectedData = selectedProvince ? dataLookup[selectedProvince] : null

  if (!geoData) {
    return (
      <div className="section">
        <div className="section-title"><Map size={20} /> แผนที่ผลเลือกตั้ง</div>
        <div style={{ textAlign: 'center', padding: 40, color: '#9aa0a6' }}>กำลังโหลดแผนที่...</div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-title"><Map size={20} /> แผนที่ผลเลือกตั้งรายจังหวัด</div>
      <div className="section-desc">แผนที่แสดงพรรคที่ชนะ ส.ส. เขตมากที่สุดในแต่ละจังหวัด — คลิกจังหวัดเพื่อดูรายละเอียด</div>

      {/* Color mode tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${colorMode === 'party' ? 'active' : ''}`} onClick={() => setColorMode('party')}>
          สีตามพรรค
        </button>
        <button className={`tab ${colorMode === 'seats' ? 'active' : ''}`} onClick={() => setColorMode('seats')}>
          สีตามจำนวนเขต
        </button>
        <button className={`tab ${colorMode === 'suspicious' ? 'active' : ''}`} onClick={() => setColorMode('suspicious')}>
          สีตามเขตน่าสงสัย
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Map container */}
        <div style={{ flex: '1 1 460px', position: 'relative' }}>
          {/* Zoom controls */}
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button className="tab" onClick={() => setZoom(z => Math.min(5, z * 1.3))} title="ซูมเข้า"><ZoomIn size={16} /></button>
            <button className="tab" onClick={() => setZoom(z => Math.max(0.5, z * 0.77))} title="ซูมออก"><ZoomOut size={16} /></button>
            <button className="tab" onClick={resetView} title="รีเซ็ต"><RotateCcw size={16} /></button>
          </div>

          <div
            style={{
              background: '#1a1d2e',
              borderRadius: 12,
              overflow: 'hidden',
              cursor: isPanning ? 'grabbing' : 'grab',
              border: '1px solid #2d3148',
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={e => { handleMouseMovePan(e); handleMouseMove(e) }}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { handleMouseUp(); setHoveredProvince(null) }}
            onWheel={handleWheel}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              width="100%"
              style={{ display: 'block', maxHeight: 650 }}
            >
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {geoData.features.map(feature => {
                  const name = feature.properties.name
                  const path = featureToPath(feature, SVG_W, SVG_H)
                  const isHovered = hoveredProvince === name
                  const isSelected = selectedProvince === name
                  return (
                    <path
                      key={name}
                      d={path}
                      fill={getFill(name)}
                      stroke={isSelected ? '#fff' : isHovered ? '#e8eaed' : '#1a1d2e'}
                      strokeWidth={isSelected ? 2 / zoom : isHovered ? 1.5 / zoom : 0.5 / zoom}
                      opacity={isHovered || isSelected ? 1 : 0.88}
                      style={{ transition: 'fill 0.2s, opacity 0.15s', cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredProvince(name)}
                      onMouseLeave={() => setHoveredProvince(null)}
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedProvince(prev => (prev === name ? null : name))
                      }}
                    />
                  )
                })}
              </g>
            </svg>
          </div>

          {/* Floating tooltip */}
          {hoveredData && (
            <div
              className="custom-tooltip"
              style={{
                position: 'fixed',
                left: tooltipPos.x + 16,
                top: tooltipPos.y - 10,
                pointerEvents: 'none',
                zIndex: 100,
                minWidth: 180,
              }}
            >
              <div className="label">{hoveredData.provinceThai}</div>
              <div className="item">
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: hoveredData.dominantPartyColor,
                    marginRight: 6,
                  }}
                />
                {hoveredData.dominantParty} ({hoveredData.dominantPartySeats}/{hoveredData.totalSeats} ที่นั่ง)
              </div>
              {hoveredData.suspiciousCount > 0 && (
                <div className="item" style={{ color: '#f11824' }}>น่าสงสัย: {hoveredData.suspiciousCount} เขต</div>
              )}
            </div>
          )}
        </div>

        {/* Right panel: legend + details */}
        <div style={{ flex: '1 1 300px', minWidth: 280 }}>
          {/* Party legend */}
          {colorMode === 'party' && (
            <div style={{ background: '#1e2235', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={14} /> พรรคที่ครองจังหวัด
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {uniqueParties.slice(0, 10).map(p => (
                  <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: '#e8eaed' }}>{p.name}</span>
                    <span style={{ color: '#9aa0a6', fontVariantNumeric: 'tabular-nums' }}>{p.totalSeats} ที่นั่ง</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {colorMode === 'seats' && (
            <div style={{ background: '#1e2235', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>จำนวนเขตเลือกตั้ง</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9aa0a6' }}>
                <span style={{ width: 16, height: 16, borderRadius: 3, background: 'rgb(110,100,230)' }} /> น้อย
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(to right, rgb(110,100,230), rgb(30,255,180))' }} />
                <span style={{ width: 16, height: 16, borderRadius: 3, background: 'rgb(30,255,180)' }} /> มาก
              </div>
            </div>
          )}

          {colorMode === 'suspicious' && (
            <div style={{ background: '#1e2235', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>จำนวนเขตน่าสงสัย</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9aa0a6' }}>
                <span style={{ width: 16, height: 16, borderRadius: 3, background: '#2d4a3e' }} /> 0
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(to right, #2d4a3e, #f11824)' }} />
                <span style={{ width: 16, height: 16, borderRadius: 3, background: '#f11824' }} /> สูงสุด
              </div>
            </div>
          )}

          {/* Selected province detail card */}
          {selectedData && (
            <div style={{ background: '#1e2235', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: selectedData.dominantPartyColor }} />
                {selectedData.provinceThai}
              </div>
              <div style={{ fontSize: 13, color: '#9aa0a6', marginBottom: 12 }}>
                ทั้งหมด {selectedData.totalSeats} เขต
                {selectedData.suspiciousCount > 0 && (
                  <span style={{ color: '#f11824', marginLeft: 8 }}>• น่าสงสัย {selectedData.suspiciousCount}</span>
                )}
              </div>

              {/* Stacked bar showing seat breakdown */}
              <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                {selectedData.parties.map(p => (
                  <div
                    key={p.partyCode}
                    style={{
                      width: `${(p.seats / selectedData.totalSeats) * 100}%`,
                      background: p.partyColor,
                      minWidth: 3,
                    }}
                    title={`${p.partyName}: ${p.seats}`}
                  />
                ))}
              </div>

              {/* Party list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedData.parties.map(p => (
                  <div key={p.partyCode} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: p.partyColor, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: '#e8eaed' }}>{p.partyName}</span>
                    <span style={{ color: '#9aa0a6', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.seats}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedData && (
            <div style={{ background: '#1e2235', borderRadius: 12, padding: 20, textAlign: 'center', color: '#9aa0a6', fontSize: 13 }}>
              คลิกจังหวัดบนแผนที่เพื่อดูรายละเอียด
            </div>
          )}

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <div className="stat-card">
              <div className="stat-value">{data.length}</div>
              <div className="stat-label">จังหวัด</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.reduce((s, d) => s + d.totalSeats, 0)}</div>
              <div className="stat-label">เขตทั้งหมด</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{uniqueParties.length}</div>
              <div className="stat-label">พรรคที่ชนะ</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#f11824' }}>
                {data.reduce((s, d) => s + d.suspiciousCount, 0)}
              </div>
              <div className="stat-label">เขตน่าสงสัย</div>
            </div>
          </div>
        </div>
      </div>

      {/* Province table */}
      <div style={{ marginTop: 24, maxHeight: 400, overflowY: 'auto' }}>
        <table className="province-table">
          <thead>
            <tr>
              <th>จังหวัด</th>
              <th>พรรคครอง</th>
              <th>ที่นั่ง</th>
              <th>ครอง</th>
              <th>น่าสงสัย</th>
              <th>สัดส่วน</th>
            </tr>
          </thead>
          <tbody>
            {[...data]
              .sort((a, b) => b.totalSeats - a.totalSeats)
              .map(row => (
                <tr
                  key={row.provinceEng}
                  style={{
                    cursor: 'pointer',
                    background: selectedProvince === row.provinceEng ? 'rgba(99,102,241,0.15)' : undefined,
                  }}
                  onClick={() => setSelectedProvince(prev => (prev === row.provinceEng ? null : row.provinceEng))}
                >
                  <td>{row.provinceThai}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.dominantPartyColor }} />
                      {row.dominantParty}
                    </span>
                  </td>
                  <td>{row.totalSeats}</td>
                  <td>{row.dominantPartySeats}</td>
                  <td style={{ color: row.suspiciousCount > 0 ? '#f11824' : '#9aa0a6' }}>{row.suspiciousCount}</td>
                  <td style={{ width: 120 }}>
                    <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden' }}>
                      {row.parties.map(p => (
                        <div
                          key={p.partyCode}
                          style={{
                            width: `${(p.seats / row.totalSeats) * 100}%`,
                            background: p.partyColor,
                            minWidth: 2,
                          }}
                          title={`${p.partyName}: ${p.seats}`}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
