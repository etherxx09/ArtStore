import { useLocation, useNavigate } from 'react-router-dom'
import './MobileTabBar.css'

type Props = {
  locale: 'zh' | 'en'
  favoritesCount: number
}

const labels = {
  zh: { home: '首页', favorites: '收藏', about: '关于' },
  en: { home: 'Home', favorites: 'Favorites', about: 'About' },
}

export default function MobileTabBar({ locale, favoritesCount }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const t = labels[locale]
  const path = location.pathname

  return (
    <nav className="mobile-tab-bar">
      <button
        className={`tab-item ${path === '/' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="tab-icon">🏠</span>
        <span className="tab-label">{t.home}</span>
      </button>

      <button
        className={`tab-item ${path === '/favorites' ? 'active' : ''}`}
        onClick={() => navigate('/favorites')}
      >
        <span className="tab-icon">❤️</span>
        <span className="tab-label">{t.favorites} {favoritesCount > 0 && `(${favoritesCount})`}</span>
      </button>

      <button
        className={`tab-item ${path === '/about' ? 'active' : ''}`}
        onClick={() => navigate('/about')}
      >
        <span className="tab-icon">ℹ️</span>
        <span className="tab-label">{t.about}</span>
      </button>
    </nav>
  )
}