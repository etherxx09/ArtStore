import { useEffect, useRef, useState } from 'react'
import type { Artwork } from '../gallery-data'
import './NetworkVisualization.css'

interface StatCard {
  label: string
  value: number
  color: string
  subLabel?: string
}

function analyzeStats(artworks: Artwork[]) {
  const stats = {
    total: artworks.length,
    regions: {} as Record<string, number>,
    materials: {} as Record<string, number>,
    usages: {} as Record<string, number>
  }

  artworks.forEach(artwork => {
    const region = (artwork as any).region || '未知'
    const material = getMaterialCategory(artwork.medium || '')
    const usage = getUsageCategory(artwork.title || '', artwork.titleZh || '')

    stats.regions[region] = (stats.regions[region] || 0) + 1
    stats.materials[material] = (stats.materials[material] || 0) + 1
    stats.usages[usage] = (stats.usages[usage] || 0) + 1
  })

  return stats
}

function getMaterialCategory(material: string): string {
  const m = material.toLowerCase()
  if (m.includes('wood') || m.includes('木') || m.includes('柚木')) return '木质'
  if (m.includes('sandstone') || m.includes('砂岩') || m.includes('stone') || m.includes('石') || m.includes('rock')) return '石质'
  if (m.includes('bronze') || m.includes('青铜') || m.includes('copper') || m.includes('铁') || m.includes('金属')) return '金属'
  if (m.includes('ceramic') || m.includes('陶瓷') || m.includes('陶') || m.includes('celadon')) return '陶瓷'
  if (m.includes('fiber') || m.includes('布') || m.includes('纺织') || m.includes('silk')) return '纺织'
  return '其他'
}

function getUsageCategory(title: string, titleZh: string): string {
  const combined = (title + ' ' + titleZh).toLowerCase()
  if (combined.includes('buddha') || combined.includes('佛') || combined.includes('mask') || combined.includes('面具')) return '宗教仪式'
  if (combined.includes('figurine') || combined.includes('雕像') || combined.includes('sculpture') || combined.includes('摆件')) return '装饰艺术'
  if (combined.includes('box') || combined.includes('盒') || combined.includes('bowl') || combined.includes('碗')) return '日常器用'
  if (combined.includes('elephant') || combined.includes('象') || combined.includes('animal')) return '动物造型'
  return '其他'
}

const REGION_COLORS: Record<string, string> = {
  '东南亚': '#C41E3A',
  '东亚': '#1E56A0',
  '非洲': '#D4A84B',
  '其他': '#6B7280'
}

const MATERIAL_COLORS: Record<string, string> = {
  '木质': '#8B5A2B',
  '石质': '#708090',
  '金属': '#B87333',
  '陶瓷': '#DEB887',
  '纺织': '#9B59B6',
  '其他': '#95A5A6'
}

export default function NetworkVisualization({ artworks, locale }: { artworks: Artwork[], locale: 'zh' | 'en' }) {
  const [stats, setStats] = useState(analyzeStats([]))
  const [activeView, setActiveView] = useState<'region' | 'material' | 'usage'>('region')

  useEffect(() => {
    setStats(analyzeStats(artworks))
  }, [artworks])

  if (artworks.length === 0) return null

  const t = locale === 'zh' ? {
    title: '馆藏分析',
    subtitle: 'Collection Insights',
    total: '总藏品',
    region: '地域分布',
    material: '材质构成',
    usage: '功能类型',
    pieces: '件'
  } : {
    title: 'Collection Insights',
    subtitle: 'Data Analysis',
    total: 'Total',
    region: 'By Region',
    material: 'By Material',
    usage: 'By Function',
    pieces: 'pcs'
  }

  const regionData = Object.entries(stats.regions).sort((a, b) => b[1] - a[1])
  const materialData = Object.entries(stats.materials).sort((a, b) => b[1] - a[1])
  const usageData = Object.entries(stats.usages).sort((a, b) => b[1] - a[1])

  const maxCount = Math.max(...Object.values(stats.regions))

  return (
    <section className="insights-section">
      <div className="insights-header">
        <h2>{t.title}</h2>
        <p className="insights-subtitle">{t.subtitle}</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">{t.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1E56A0' }}>{Object.keys(stats.regions).length}</div>
          <div className="stat-label">{locale === 'zh' ? '国家地区' : 'Regions'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#8B5A2B' }}>{Object.keys(stats.materials).filter(k => k !== '其他').length}</div>
          <div className="stat-label">{locale === 'zh' ? '材质种类' : 'Materials'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#9B59B6' }}>{Object.keys(stats.usages).filter(k => k !== '其他').length}</div>
          <div className="stat-label">{locale === 'zh' ? '功能类型' : 'Categories'}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="insights-tabs">
        <button
          className={`insights-tab ${activeView === 'region' ? 'active' : ''}`}
          onClick={() => setActiveView('region')}
        >
          {t.region}
        </button>
        <button
          className={`insights-tab ${activeView === 'material' ? 'active' : ''}`}
          onClick={() => setActiveView('material')}
        >
          {t.material}
        </button>
        <button
          className={`insights-tab ${activeView === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveView('usage')}
        >
          {t.usage}
        </button>
      </div>

      {/* Content Area */}
      <div className="insights-content">
        {activeView === 'region' && (
          <div className="region-view">
            {/* Horizontal Bar Chart */}
            <div className="bar-chart">
              {regionData.map(([name, count]) => (
                <div key={name} className="bar-item">
                  <div className="bar-label">
                    <span className="bar-name">{name}</span>
                    <span className="bar-count">{count} {t.pieces}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                        backgroundColor: REGION_COLORS[name] || '#6B7280'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Geographic Insight */}
            <div className="insight-card">
              <div className="insight-icon">🌏</div>
              <div className="insight-text">
                <p className="insight-title">{locale === 'zh' ? '地理分布特征' : 'Geographic Distribution'}</p>
                <p className="insight-desc">
                  {locale === 'zh'
                    ? `东南亚地区藏品最为丰富，占比约 ${Math.round((stats.regions['东南亚'] || 0) / stats.total * 100)}%，以印度尼西亚、马来西亚、柬埔寨文物为主。东亚地区以日本艺术品为主。`
                    : `Southeast Asia leads with approximately ${Math.round((stats.regions['东南亚'] || 0) / stats.total * 100)}% of the collection, primarily from Indonesia, Malaysia, and Cambodia. East Asia is dominated by Japanese artworks.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'material' && (
          <div className="material-view">
            {/* Material Grid */}
            <div className="material-grid">
              {materialData.filter(([k]) => k !== '其他').map(([name, count]) => (
                <div key={name} className="material-item">
                  <div
                    className="material-color"
                    style={{ backgroundColor: MATERIAL_COLORS[name] || '#95A5A6' }}
                  />
                  <div className="material-info">
                    <span className="material-name">{name}</span>
                    <span className="material-count">{count} {t.pieces}</span>
                  </div>
                  <div className="material-percent">
                    {Math.round(count / stats.total * 100)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Material Insight */}
            <div className="insight-card">
              <div className="insight-icon">🪵</div>
              <div className="insight-text">
                <p className="insight-title">{locale === 'zh' ? '材质构成特征' : 'Material Composition'}</p>
                <p className="insight-desc">
                  {locale === 'zh'
                    ? `木质品占比最高，体现了东南亚地区的木雕传统。金属器以青铜为主，反映了古代铸造技艺。砂岩石雕展现了独特的建筑装饰艺术。`
                    : `Wood dominates the collection, reflecting Southeast Asian carving traditions. Metalwork primarily features bronze, representing ancient casting techniques. Sandstone carvings showcase distinctive architectural art.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'usage' && (
          <div className="usage-view">
            {/* Usage Categories */}
            <div className="usage-grid">
              {usageData.filter(([k]) => k !== '其他').map(([name, count]) => (
                <div key={name} className="usage-item">
                  <div className="usage-icon">
                    {name === '宗教仪式' ? '🙏' : name === '装饰艺术' ? '🎨' : name === '日常器用' ? '🏺' : '🐘'}
                  </div>
                  <div className="usage-details">
                    <span className="usage-name">{name}</span>
                    <span className="usage-count">{count} {t.pieces}</span>
                  </div>
                  <div
                    className="usage-bar"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Usage Insight */}
            <div className="insight-card">
              <div className="insight-icon">🏛️</div>
              <div className="insight-text">
                <p className="insight-title">{locale === 'zh' ? '功能类型特征' : 'Functional Categories'}</p>
                <p className="insight-desc">
                  {locale === 'zh'
                    ? `宗教仪式类藏品占据重要比例，反映了藏品的精神文化属性。装饰艺术品和日常器用则体现了生活美学。`
                    : `Religious artifacts form a significant portion, reflecting spiritual and cultural attributes. Decorative arts and daily utensils embody aesthetic values in everyday life.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
