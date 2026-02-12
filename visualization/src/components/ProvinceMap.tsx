'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { MapContainer, GeoJSON, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  Map as MapIcon, Info, Search, X, Maximize2,
  Palette, BarChart3, AlertTriangle, MapPin,
} from 'lucide-react'
import type { ProvinceMapItem } from '../types'

/* ─── GeoJSON type for Leaflet ─── */
type GeoJSONData = GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>

/* ─── Color mode ─── */
type ColorMode = 'party' | 'seats' | 'suspicious'

/* ─── Fly-to helper component ─── */
function FlyTo({ center, zoom }: { center: L.LatLngExpression | null; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 0.6 })
  }, [center, zoom, map])
  return null
}

/* ─── Props ─── */
interface Props {
  data: ProvinceMapItem[]
}

export default function ProvinceMap({ data }: Props) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null)
  const [colorMode, setColorMode] = useState<ColorMode>('party')
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [flyTarget, setFlyTarget] = useState<{ center: L.LatLngExpression; zoom: number } | null>(null)
  const geoJsonRef = useRef<L.GeoJSON | null>(null)

  // Thailand center
  const THAI_CENTER: L.LatLngExpression = [13.0, 101.5]
  const DEFAULT_ZOOM = 6

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/election_69_analyzer'
    fetch(`${basePath}/thailand-provinces.json`)
      .then(r => r.json())
      .then((d: GeoJSONData) => setGeoData(d))
      .catch(err => console.error('Failed to load GeoJSON:', err))
  }, [])

  /* ─── Data lookups ─── */
  const dataLookup = useMemo(() => {
    const map: Record<string, ProvinceMapItem> = {}
    for (const d of data) map[d.provinceEng] = d
    return map
  }, [data])

  const uniqueParties = useMemo(() => {
    const partyMap: Record<string, { name: string; color: string; totalSeats: number; provinces: number }> = {}
    for (const d of data) {
      for (const p of d.parties) {
        if (!partyMap[p.partyCode]) {
          partyMap[p.partyCode] = { name: p.partyName, color: p.partyColor, totalSeats: 0, provinces: 0 }
        }
        partyMap[p.partyCode].totalSeats += p.seats
      }
      if (partyMap[d.dominantPartyCode]) partyMap[d.dominantPartyCode].provinces++
    }
    return Object.entries(partyMap)
      .sort((a, b) => b[1].totalSeats - a[1].totalSeats)
      .map(([code, info]) => ({ code, ...info }))
  }, [data])

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    const matches = new Set<string>()
    for (const d of data) {
      if (d.provinceThai.includes(q) || d.provinceEng.toLowerCase().includes(q) ||
        d.dominantParty.includes(q)) {
        matches.add(d.provinceEng)
      }
    }
    return matches
  }, [searchQuery, data])

  const totalSeats = data.reduce((s, d) => s + d.totalSeats, 0)
  const totalSuspicious = data.reduce((s, d) => s + d.suspiciousCount, 0)

  const selectedData = selectedProvince ? dataLookup[selectedProvince] : null

  /* ─── Color helpers ─── */
  const getFillColor = useCallback(
    (engName: string): string => {
      const d = dataLookup[engName]
      if (!d) return '#2d3148'
      if (searchMatches && !searchMatches.has(engName)) return '#1a1c2a'
      if (colorMode === 'party') return d.dominantPartyColor || '#666'
      if (colorMode === 'seats') {
        const maxSeats = Math.max(...data.map(p => p.totalSeats))
        const ratio = d.totalSeats / maxSeats
        const r = Math.round(20 + (1 - ratio) * 40)
        const g = Math.round(70 + ratio * 185)
        const b = Math.round(150 + (1 - ratio) * 70)
        return `rgb(${r},${g},${b})`
      }
      // suspicious
      if (d.suspiciousCount === 0) return '#1e3a2e'
      const maxSusp = Math.max(...data.map(p => p.suspiciousCount))
      const ratio = d.suspiciousCount / maxSusp
      return `rgb(${Math.round(40 + ratio * 215)},${Math.round(80 * (1 - ratio * 0.8))},${Math.round(50 * (1 - ratio * 0.8))})`
    },
    [colorMode, data, dataLookup, searchMatches],
  )

  const getFillOpacity = useCallback(
    (engName: string): number => {
      if (searchMatches && !searchMatches.has(engName)) return 0.3
      if (selectedProvince && selectedProvince !== engName) return 0.65
      return 0.88
    },
    [searchMatches, selectedProvince],
  )

  /* ─── GeoJSON style ─── */
  const styleFeature = useCallback(
    (feature: GeoJSON.Feature | undefined): L.PathOptions => {
      const name = feature?.properties?.name ?? ''
      const isSelected = selectedProvince === name
      const isSearchMatch = searchMatches?.has(name)
      return {
        fillColor: getFillColor(name),
        fillOpacity: getFillOpacity(name),
        color: isSelected ? '#fff' : isSearchMatch ? '#fbbf24' : '#1e2030',
        weight: isSelected ? 3 : isSearchMatch ? 2 : 1,
        opacity: 1,
      }
    },
    [getFillColor, getFillOpacity, selectedProvince, searchMatches],
  )

  /* ─── Feature events ─── */
  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      const name = feature.properties?.name ?? ''
      const d = dataLookup[name]

      // Tooltip
      if (d) {
        const partyBar = d.parties.length > 1
          ? `<div style="display:flex;height:5px;border-radius:3px;overflow:hidden;margin:4px 0">${d.parties
              .map(p => `<div style="width:${(p.seats / d.totalSeats) * 100}%;background:${p.partyColor};min-width:3px"></div>`)
              .join('')}</div>`
          : ''
        const suspLine = d.suspiciousCount > 0
          ? `<div style="color:#f87171;margin-top:2px">⚠ น่าสงสัย ${d.suspiciousCount} เขต</div>`
          : ''
        layer.bindTooltip(
          `<div style="min-width:160px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
              <span style="width:10px;height:10px;border-radius:50%;background:${d.dominantPartyColor};display:inline-block;flex-shrink:0"></span>
              ${d.provinceThai}
            </div>
            <div style="font-size:12px;line-height:1.6">
              <strong>${d.dominantParty}</strong> ชนะ ${d.dominantPartySeats}/${d.totalSeats} เขต
              ${partyBar}${suspLine}
            </div>
          </div>`,
          { sticky: true, direction: 'top', offset: [0, -10], className: 'province-tooltip' },
        )
      }

      // Hover effects
      const pathLayer = layer as L.Path
      layer.on({
        mouseover: () => {
          pathLayer.setStyle({ weight: 3, color: '#e2e8f0', fillOpacity: 1 })
          pathLayer.bringToFront()
        },
        mouseout: () => {
          geoJsonRef.current?.resetStyle(pathLayer as L.GeoJSON extends L.Layer ? L.Path : never)
        },
        click: () => {
          if (selectedProvince === name) {
            setSelectedProvince(null)
            setFlyTarget({ center: THAI_CENTER, zoom: DEFAULT_ZOOM })
          } else {
            setSelectedProvince(name)
            // Zoom to bounds of province
            const bounds = (pathLayer as unknown as L.Polygon).getBounds()
            setFlyTarget({ center: bounds.getCenter(), zoom: Math.min(bounds.getCenter().lat > 14 ? 9 : 8.5, 10) })
          }
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataLookup, selectedProvince],
  )

  /* ─── Reset map ─── */
  const resetMap = useCallback(() => {
    setSelectedProvince(null)
    setSearchQuery('')
    setFlyTarget({ center: THAI_CENTER, zoom: DEFAULT_ZOOM })
  }, [])

  /* ─── Province table sorted ─── */
  const sortedProvinces = useMemo(() => {
    let items = [...data]
    if (searchMatches) items = items.filter(d => searchMatches.has(d.provinceEng))
    return items.sort((a, b) => b.totalSeats - a.totalSeats)
  }, [data, searchMatches])

  /* ─── Click from table ─── */
  const handleTableClick = useCallback(
    (engName: string) => {
      setSelectedProvince(prev => prev === engName ? null : engName)
      if (!geoJsonRef.current) return
      // Find the matching layer and zoom
      geoJsonRef.current.eachLayer((layer) => {
        const feat = (layer as L.GeoJSON & { feature?: GeoJSON.Feature }).feature
        if (feat?.properties?.name === engName) {
          const bounds = (layer as unknown as L.Polygon).getBounds()
          setFlyTarget({ center: bounds.getCenter(), zoom: 9 })
        }
      })
    },
    [],
  )

  // Force GeoJSON re-render when colorMode/selectedProvince/searchMatches changes
  const geoKey = `${colorMode}-${selectedProvince ?? 'none'}-${searchQuery}`

  if (!geoData) {
    return (
      <div className="section">
        <div className="section-title"><MapIcon size={20} /> แผนที่ผลเลือกตั้ง</div>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          กำลังโหลดแผนที่...
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-title"><MapIcon size={20} /> แผนที่ผลเลือกตั้งรายจังหวัด</div>
      <div className="section-desc">
        แสดงพรรคที่ชนะ ส.ส. เขตมากสุดในแต่ละจังหวัด — คลิกจังหวัดเพื่อซูมและดูรายละเอียด
      </div>

      {/* ── Color mode tabs + search ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div className="tabs" style={{ flex: '1 1 auto', marginBottom: 0 }}>
          <button className={`tab ${colorMode === 'party' ? 'active' : ''}`} onClick={() => setColorMode('party')}>
            <Palette size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> สีตามพรรค
          </button>
          <button className={`tab ${colorMode === 'seats' ? 'active' : ''}`} onClick={() => setColorMode('seats')}>
            <BarChart3 size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> จำนวนเขต
          </button>
          <button className={`tab ${colorMode === 'suspicious' ? 'active' : ''}`} onClick={() => setColorMode('suspicious')}>
            <AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> เขตน่าสงสัย
          </button>
        </div>
        <div style={{ position: 'relative', flex: '0 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="ค้นหาจังหวัด..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '7px 30px 7px 30px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="overview-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-number"><MapPin size={16} style={{ verticalAlign: -2, marginRight: 4, opacity: 0.5 }} />{data.length}</div>
          <div className="stat-label">จังหวัด</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalSeats}</div>
          <div className="stat-label">เขตเลือกตั้ง</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{uniqueParties.length}</div>
          <div className="stat-label">พรรคที่ชนะ</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--danger)' }}>{totalSuspicious}</div>
          <div className="stat-label">เขตน่าสงสัย</div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Map */}
        <div style={{ flex: '1 1 500px', minHeight: 500, position: 'relative' }}>
          <MapContainer
            center={THAI_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={false}
            style={{ width: '100%', height: 560, borderRadius: 12, border: '1px solid var(--border)' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_noaccess/{z}/{x}/{y}{r}.png"
              // fallback to a dark tile that exists
              errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAAAASUVORK5CYII="
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <GeoJSON
              key={geoKey}
              ref={(el) => { geoJsonRef.current = el }}
              data={geoData}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
            {flyTarget && <FlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}
          </MapContainer>

          {/* Reset button */}
          <button
            onClick={resetMap}
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 1000,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: 'var(--text-primary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,.4)',
            }}
            title="รีเซ็ตแผนที่"
          >
            <Maximize2 size={13} /> รีเซ็ต
          </button>

          {/* Hint */}
          <div style={{
            position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
            background: 'rgba(15,17,23,.85)', borderRadius: 6, padding: '4px 10px',
            fontSize: 11, color: 'var(--text-secondary)',
          }}>
            คลิกจังหวัด = ซูม · ใช้ปุ่ม +/- ซูม · ลาก = เลื่อน
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: '1 1 270px', minWidth: 250, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Legend */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
              <Info size={13} />
              {colorMode === 'party' ? 'พรรคที่ครองจังหวัด' : colorMode === 'seats' ? 'จำนวนเขตเลือกตั้ง' : 'เขตน่าสงสัย'}
            </div>

            {colorMode === 'party' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {uniqueParties.slice(0, 12).map(p => (
                  <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '3px 4px', borderRadius: 4 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: p.color, flexShrink: 0, border: '1px solid rgba(255,255,255,.1)' }} />
                    <span style={{ flex: 1 }}>{p.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
                      {p.totalSeats} · {p.provinces} จว.
                    </span>
                  </div>
                ))}
              </div>
            )}

            {colorMode === 'seats' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>1</span>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'linear-gradient(to right, rgb(60,70,220), rgb(20,255,185))' }} />
                  <span>{Math.max(...data.map(p => p.totalSeats))}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>เขตเลือกตั้งต่อจังหวัด</div>
              </div>
            )}

            {colorMode === 'suspicious' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>0</span>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'linear-gradient(to right, #1e3a2e, #f87171)' }} />
                  <span>{Math.max(...data.map(p => p.suspiciousCount))}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>จำนวนเขตน่าสงสัย</div>
              </div>
            )}
          </div>

          {/* Selected detail */}
          {selectedData ? (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: `2px solid ${selectedData.dominantPartyColor}55` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: selectedData.dominantPartyColor, border: '2px solid rgba(255,255,255,.15)' }} />
                    {selectedData.provinceThai}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {selectedData.totalSeats} เขต
                    {selectedData.suspiciousCount > 0 && (
                      <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                        <AlertTriangle size={11} style={{ verticalAlign: -1, marginRight: 2 }} />
                        น่าสงสัย {selectedData.suspiciousCount}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={resetMap}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                  title="ปิด"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Seat bar */}
              <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', margin: '10px 0' }}>
                {selectedData.parties.map(p => (
                  <div key={p.partyCode} style={{ width: `${(p.seats / selectedData.totalSeats) * 100}%`, background: p.partyColor, minWidth: 4 }} title={`${p.partyName}: ${p.seats}`} />
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selectedData.parties.map(p => (
                  <div key={p.partyCode} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: p.partyColor, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{p.partyName}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.seats}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11, width: 36, textAlign: 'right' }}>
                      {((p.seats / selectedData.totalSeats) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: 12, padding: 20,
              textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13,
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <Maximize2 size={20} style={{ opacity: 0.3 }} />
              คลิกจังหวัดบนแผนที่<br />เพื่อดูรายละเอียด
            </div>
          )}
        </div>
      </div>

      {/* ── Province table ── */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
          รายชื่อจังหวัด {searchMatches ? `(${sortedProvinces.length} ผลลัพธ์)` : `(${data.length})`}
        </h3>
        <div style={{ maxHeight: 420, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <table className="province-table">
            <thead>
              <tr>
                <th>จังหวัด</th>
                <th>พรรคครอง</th>
                <th style={{ textAlign: 'center' }}>เขต</th>
                <th style={{ textAlign: 'center' }}>ชนะ</th>
                <th style={{ textAlign: 'center' }}>น่าสงสัย</th>
                <th style={{ width: 120 }}>สัดส่วน</th>
              </tr>
            </thead>
            <tbody>
              {sortedProvinces.map(row => {
                const isSelected = selectedProvince === row.provinceEng
                return (
                  <tr
                    key={row.provinceEng}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? `${row.dominantPartyColor}18` : undefined,
                    }}
                    onClick={() => handleTableClick(row.provinceEng)}
                  >
                    <td style={{ fontWeight: isSelected ? 700 : 400 }}>
                      {isSelected && <span style={{ display: 'inline-block', width: 3, height: 14, background: row.dominantPartyColor, borderRadius: 2, marginRight: 8, verticalAlign: -2 }} />}
                      {row.provinceThai}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.dominantPartyColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 12 }}>{row.dominantParty}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.totalSeats}</td>
                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{row.dominantPartySeats}</td>
                    <td style={{ textAlign: 'center', color: row.suspiciousCount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: row.suspiciousCount > 0 ? 600 : 400 }}>
                      {row.suspiciousCount}
                    </td>
                    <td>
                      <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-primary)' }}>
                        {row.parties.map(p => (
                          <div key={p.partyCode} style={{ width: `${(p.seats / row.totalSeats) * 100}%`, background: p.partyColor, minWidth: 2 }} title={`${p.partyName}: ${p.seats}`} />
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
