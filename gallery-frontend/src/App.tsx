import { useEffect, useState, useCallback } from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import logo from './assets/logo.png'
import { type Locale, ui } from './i18n'
import { mapArtworkRecord, seedArtworks, type Artwork, type ArtworkRecord, gallery } from './gallery-data'
import { isSupabaseConfigured, supabase } from './supabase'
import NetworkVisualization from './components/NetworkVisualization'
import WorldMap from './components/WorldMap'

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>
}

// Favorites hook using localStorage
function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('artstore-favorites')
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)))
    }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem('artstore-favorites', JSON.stringify([...next]))
      return next
    })
  }, [])

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  return { favorites, toggleFavorite, isFavorite }
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function MenuIcon() {
  return <span className="menu-icon" aria-hidden="true"><i /><i /></span>
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView())
      return
    }

    window.scrollTo({ top: 0, left: 0 })
  }, [hash, pathname])

  return null
}

function Header({ locale, setLocale }: { locale: Locale, setLocale: (locale: Locale) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const text = ui[locale]

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash])

  const navigateTo = (hash: '#about' | '#contact' | '#works') => {
    if (location.pathname === '/') {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/${hash}`)
    }
  }

  return (
    <header className="site-header">
      <div className="header-main shell">
        <Link to="/" className="wordmark" aria-label={`${gallery.name} ${text.home}`}>
          <img src={logo} alt="" />
          <strong>{gallery.name}</strong>
        </Link>
        <nav className="desktop-nav" aria-label={text.navigation}>
          <button type="button" onClick={() => navigateTo('#works')}>{text.works}</button>
          <button type="button" onClick={() => navigateTo('#about')}>{text.about}</button>
          <button type="button" onClick={() => navigateTo('#contact')}>{text.visit}</button>
        </nav>
        <div className="header-actions">
          <div className="locale-switcher" aria-label={text.language}>
            <button type="button" className={locale === 'zh' ? 'is-active' : ''} aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>中</button>
            <button type="button" className={locale === 'en' ? 'is-active' : ''} aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
          </div>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen((open) => !open)}>
            <span>{menuOpen ? text.close : text.menu}</span>
            <MenuIcon />
          </button>
        </div>
      </div>
      <nav className={`site-menu${menuOpen ? ' is-open' : ''}`} id="site-menu" aria-label={text.siteMenu}>
        <button type="button" onClick={() => navigateTo('#works')}>{text.works} <span>→</span></button>
        <button type="button" onClick={() => navigateTo('#about')}>{text.about} <span>→</span></button>
        <button type="button" onClick={() => navigateTo('#contact')}>{text.visitContact} <span>→</span></button>
      </nav>
    </header>
  )
}

function Footer({ locale }: { locale: Locale }) {
  const text = ui[locale]

  return (
    <footer className="site-footer" id="contact">
      <div className="shell footer-grid">
        <div className="footer-statement">
          <p className="eyebrow">{text.visitContactTitle}</p>
          <p className="footer-title">{text.footerStatementFirst}<br />{text.footerStatementSecond}</p>
        </div>
        <div className="footer-column">
          <p className="eyebrow">{text.contact}</p>
          <a href={`mailto:${gallery.email}`}>{gallery.email}</a>
          <a href={`https://weixin.qq.com/`} target="_blank" rel="noreferrer">WeChat · {gallery.wechat} <ArrowIcon /></a>
          <a href="https://www.xiaohongshu.com/user/profile/6a0926dc0000000002002005?xsec_token=YBwuhFeKCrlcyjXSIMdZvbIEqHr16wKKoE7YP8pjLZelQ=&xsec_source=app_share&&apptime=1784451264&shareRedId=ODhIRjpHNTw2NzUyOTgwNjc8OTlIRzo7&share_id=bbbc6e9cc8d84147b31230046315adb9&xhsshare=CopyLink" target="_blank" rel="noreferrer">{gallery.xiaohongshu} <ArrowIcon /></a>
        </div>
        <div className="footer-column">
          <p className="eyebrow">{text.gallery}</p>
          <address>{gallery.address.map((line) => <span key={line}>{line}</span>)}</address>
          <a href="#top">{text.backToTop}</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} {gallery.name}</span>
        <span>{text.subjectToAvailability}</span>
      </div>
    </footer>
  )
}

function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>(seedArtworks)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let isCurrent = true

    supabase
      .from('artworks')
      .select('id, inventory_number, title, title_zh, origin, material, technique, dimensions, price, inventory_status, image_url, sort_order')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!isCurrent) return

        if (error) {
          setLoadError(true)
        } else {
          setArtworks((data as ArtworkRecord[]).map(mapArtworkRecord))
        }
        setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return { artworks, isLoading, loadError }
}

function ArtworkPlaceholder({ sequence, ratio, locale, large = false }: { sequence: string, ratio: string, locale: Locale, large?: boolean }) {
  const text = ui[locale]

  return (
    <div className={`artwork-visual artwork-placeholder${large ? ' artwork-visual-large' : ''}`} style={{ aspectRatio: ratio }}>
      <span className="placeholder-index">{sequence}</span>
      <span className="placeholder-mark">{text.artworkImageFirst}<br />{text.artworkImageSecond}</span>
    </div>
  )
}

function ArtworkImage({ artwork, locale, large = false }: { artwork: Artwork, locale: Locale, large?: boolean }) {
  const [imgError, setImgError] = useState(false)

  if (!artwork.image || imgError) {
    return <ArtworkPlaceholder sequence={artwork.sequence} ratio={artwork.ratio} locale={locale} large={large} />
  }

  return (
    <div className={`artwork-visual${large ? ' artwork-visual-large' : ''}`}>
      <span className="placeholder-index">{artwork.sequence}</span>
      <img
        src={artwork.image}
        alt={`${artwork.title}${artwork.titleZh ? ` · ${artwork.titleZh}` : ''}`}
        loading={large ? 'eager' : 'lazy'}
        onError={() => setImgError(true)}
      />
    </div>
  )
}

function ArtworkCard({ artwork, locale, isFavorite, onToggleFavorite }: { artwork: Artwork, locale: Locale, isFavorite: boolean, onToggleFavorite: (id: string) => void }) {
  const text = ui[locale]

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite(artwork.id)
  }

  return (
    <article className="artwork-card">
      <div className="artwork-image-wrapper">
        <Link to={`/artwork/${artwork.id}`} className="artwork-image-link" aria-label={`${text.viewArtwork} ${artwork.title}`}>
          <ArtworkImage artwork={artwork} locale={locale} />
        </Link>
        <button
          type="button"
          className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? text.removeFromFavorites : text.addToFavorites}
        >
          <HeartIcon filled={isFavorite} />
        </button>
      </div>
      <div className="artwork-caption">
        <div>
          <p><em>{artwork.title}</em></p>
          {artwork.titleZh && <p>{artwork.titleZh}</p>}
          <p className="artwork-origin">{artwork.origin ?? artwork.artist}</p>
        </div>
        <Link className="view-work" to={`/artwork/${artwork.id}`} aria-label={`${text.viewArtwork} ${artwork.sequence}`}>{text.viewWork} <span>→</span></Link>
      </div>
    </article>
  )
}

function HomePage({ artworks, isLoading, loadError, locale }: { artworks: Artwork[], isLoading: boolean, loadError: boolean, locale: Locale }) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold' | 'reserved' | 'favorites'>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const text = ui[locale]

  // Get unique regions
  const regions = [...new Set(artworks.map(a => (a as any).region).filter(Boolean))].sort()

  const visibleArtworks = artworks.filter((artwork) => {
    // Status filter
    if (statusFilter === 'available' && artwork.availability !== 'available') return false
    if (statusFilter === 'sold' && artwork.availability !== 'sold') return false
    if (statusFilter === 'reserved' && artwork.availability !== 'reserved') return false
    if (statusFilter === 'favorites' && !favorites.has(artwork.id)) return false
    // Region filter
    if (regionFilter !== 'all' && (artwork as any).region !== regionFilter) return false
    return true
  })

  return (
    <>
      <main id="top">
        <section className="intro shell" id="about">
          <div>
            <p className="eyebrow">{text.museum}</p>
            <h1>{text.heroTitleFirst}<br />{text.heroTitleSecond}</h1>
          </div>
          <div className="intro-copy">
            <p>{text.heroCollection}</p>
            <p className="intro-services">{text.heroServices}</p>
            <a href="#works" className="text-link">{text.exploreWorks} <ArrowIcon /></a>
          </div>
        </section>

        <section className="works-section" id="works">
          <div className="works-toolbar shell">
            <p><span className="work-count">{String(visibleArtworks.length).padStart(2, '0')}</span> {statusFilter === 'all' ? text.allWorks : statusFilter === 'available' ? text.inStock : statusFilter === 'sold' ? text.sold : statusFilter === 'reserved' ? text.onHold : text.favorites}{regionFilter !== 'all' && ` · ${regionFilter}`}</p>
            <div className="work-controls" aria-label={text.filterWorks}>
              <button type="button" className={statusFilter === 'all' ? 'is-active' : ''} aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>{text.allWorks}</button>
              <button type="button" className={statusFilter === 'available' ? 'is-active' : ''} aria-pressed={statusFilter === 'available'} onClick={() => setStatusFilter('available')}>{text.inStock}</button>
              <button type="button" className={statusFilter === 'sold' ? 'is-active' : ''} aria-pressed={statusFilter === 'sold'} onClick={() => setStatusFilter('sold')}>{text.sold}</button>
              <button type="button" className={statusFilter === 'reserved' ? 'is-active' : ''} aria-pressed={statusFilter === 'reserved'} onClick={() => setStatusFilter('reserved')}>{text.onHold}</button>
              <button type="button" className={statusFilter === 'favorites' ? 'is-active' : ''} aria-pressed={statusFilter === 'favorites'} onClick={() => setStatusFilter('favorites')}>{text.favorites} {favorites.size > 0 && `(${favorites.size})`}</button>
            </div>
          </div>
          <div className="works-toolbar shell region-toolbar">
            <select
              className="region-select"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              aria-label={text.byRegion}
            >
              <option value="all">{text.allRegions}</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div className="shell artwork-grid" aria-busy={isLoading}>
            {visibleArtworks.map((artwork) => <ArtworkCard artwork={artwork} locale={locale} isFavorite={isFavorite(artwork.id)} onToggleFavorite={toggleFavorite} key={artwork.id} />)}
            {isLoading && <p className="collection-status">{text.loadingCollection}</p>}
            {!isLoading && loadError && <p className="collection-status">{text.collectionLoadError}</p>}
            {!isLoading && !loadError && visibleArtworks.length === 0 && <p className="collection-status">{text.noMatchingWorks}</p>}
          </div>
        </section>

        {/* Network Visualization Section */}
        {!isLoading && artworks.length > 0 && (
          <>
            <WorldMap artworks={artworks} locale={locale} />
            <NetworkVisualization artworks={artworks} locale={locale} />
          </>
        )}
      </main>
      <Footer locale={locale} />
    </>
  )
}

function ArtworkDetailPage({ artworks, isLoading, locale }: { artworks: Artwork[], isLoading: boolean, locale: Locale }) {
  const { id } = useParams()
  const artwork = artworks.find((work) => work.id === id) ?? artworks[0]
  const [enquirySent, setEnquirySent] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites()
  const text = ui[locale]

  if (isLoading || !artwork) {
    return <main className="shell page-status">{text.loadingCollection}</main>
  }

  const nextArtwork = artworks[(artworks.indexOf(artwork) + 1) % artworks.length]

  return (
    <>
      <main className="detail-page">
        <div className="shell back-row">
          <Link to="/">{text.backToWorks}</Link>
          <span>{text.work} {artwork.sequence} / {String(artworks.length).padStart(2, '0')}</span>
        </div>
        <section className="shell detail-layout">
          <div className="detail-image">
            <div className="artwork-image-wrapper">
              <ArtworkImage artwork={artwork} locale={locale} large />
              <button
                type="button"
                className={`favorite-button detail-favorite ${isFavorite(artwork.id) ? 'is-favorite' : ''}`}
                onClick={() => toggleFavorite(artwork.id)}
                aria-label={isFavorite(artwork.id) ? text.removeFromFavorites : text.addToFavorites}
              >
                <HeartIcon filled={isFavorite(artwork.id)} />
              </button>
            </div>
          </div>
          <aside className="detail-panel">
            <p className="eyebrow">{artwork.availability === 'available' ? text.inStock : artwork.availability === 'sold' ? text.sold : text.onHold}</p>
            <h1>{artwork.title}</h1>
            {artwork.titleZh && <p className="detail-title">{artwork.titleZh}</p>}
            <dl>
              {artwork.origin && <div><dt>{text.origin}</dt><dd>{artwork.origin}</dd></div>}
              <div><dt>{text.material}</dt><dd>{artwork.medium}</dd></div>
              {artwork.technique && <div><dt>{text.technique}</dt><dd>{artwork.technique}</dd></div>}
              <div><dt>{text.dimensions}</dt><dd>{artwork.dimensions}</dd></div>
            </dl>
            <div className="price-block">
              <p className="eyebrow">{text.price}</p>
              <p>{artwork.price}</p>
            </div>
            <button type="button" className="enquire-button" onClick={() => setEnquirySent(true)}>
              {enquirySent ? text.enquiryNoted : text.enquire} <span>→</span>
            </button>
            {enquirySent && <p className="form-status" role="status">{text.enquiryStatus.replace('{email}', gallery.email)}</p>}
            <p className="detail-note">{text.detailNote}</p>
          </aside>
        </section>
        <section className="shell next-work">
          <Link to={`/artwork/${nextArtwork.id}`}>
            <span className="eyebrow">{text.nextWork}</span>
            <span>{text.continueViewing} <ArrowIcon /></span>
          </Link>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  )
}

export default function App() {
  const { artworks, isLoading, loadError } = useArtworks()
  const [locale, setLocale] = useState<Locale>(() => window.localStorage.getItem('openland-locale') === 'en' ? 'en' : 'zh')

  useEffect(() => {
    window.localStorage.setItem('openland-locale', locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  return (
    <>
      <ScrollToTop />
      <Header locale={locale} setLocale={setLocale} />
      <Routes>
        <Route path="/" element={<HomePage artworks={artworks} isLoading={isLoading} loadError={loadError} locale={locale} />} />
        <Route path="/artwork/:id" element={<ArtworkDetailPage artworks={artworks} isLoading={isLoading} locale={locale} />} />
        <Route path="*" element={<HomePage artworks={artworks} isLoading={isLoading} loadError={loadError} locale={locale} />} />
      </Routes>
    </>
  )
}
