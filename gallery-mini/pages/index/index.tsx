import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchArtworks } from '../../api/artworks'
import { isFavorite, toggleFavorite } from '../../utils/favorites'
import { zh } from '../../locales'
import './index.css'

const locale = zh

export default function Index() {
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(new Set())

  useEffect(() => {
    loadArtworks()
  }, [])

  const loadArtworks = () => {
    setLoading(true)
    fetchArtworks().then(data => {
      setArtworks(data)
      const favList = data.filter(a => isFavorite(a.id)).map(a => a.id)
      setFavorites(new Set(favList))
      setLoading(false)
    }).catch(e => {
      console.error('Failed to load artworks:', e)
      setLoading(false)
    })
  }

  const filteredArtworks = artworks.filter(art => {
    if (statusFilter !== 'all' && art.inventory_status !== statusFilter) return false
    if (regionFilter !== 'all' && art.region !== regionFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const title = (art.title || '').toLowerCase()
      const titleZh = (art.title_zh || '').toLowerCase()
      const origin = (art.origin || '').toLowerCase()
      if (!title.includes(query) && !titleZh.includes(query) && !origin.includes(query)) {
        return false
      }
    }
    return true
  })

  const regions = [...new Set(artworks.map(a => a.region).filter(Boolean))]

  const handleCardClick = (id) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  const handleFavorite = (e, id) => {
    e.stopPropagation()
    const newState = toggleFavorite(id)
    setFavorites(prev => {
      const next = new Set(prev)
      if (newState) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
    Taro.showToast({
      title: newState ? '已收藏' : '已取消收藏',
      icon: 'success',
      duration: 1200,
    })
  }

  const handleSearch = (e) => {
    setSearchQuery(e.detail.value)
  }

  return (
    <View className='container'>
      <ScrollView scrollY className='content'>
        <View className='header'>
          <Text className='title'>OPENLAND</Text>
          <Text className='subtitle'>{locale.subtitle}</Text>
        </View>

        <View className='search-bar'>
          <Input
            className='search-input'
            placeholder='搜索藏品名称、来源...'
            value={searchQuery}
            onInput={handleSearch}
          />
        </View>

        <View className='filters'>
          <ScrollView scrollX className='filter-scroll'>
            <View className='filter-tags'>
              <Text
                className={`filter-tag ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >{locale.all}</Text>
              <Text
                className={`filter-tag ${statusFilter === 'available' ? 'active' : ''}`}
                onClick={() => setStatusFilter('available')}
              >{locale.inStock}</Text>
              <Text
                className={`filter-tag ${statusFilter === 'sold' ? 'active' : ''}`}
                onClick={() => setStatusFilter('sold')}
              >{locale.sold}</Text>
              <Text
                className={`filter-tag ${statusFilter === 'reserved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('reserved')}
              >{locale.reserved}</Text>
            </View>
          </ScrollView>

          <View className='region-select'>
            <Text>{locale.region}:</Text>
            <View className='region-picker'>
              <Text
                className={regionFilter === 'all' ? 'active' : ''}
                onClick={() => setRegionFilter('all')}
              >{locale.all}</Text>
              {regions.map(r => (
                <Text
                  key={r}
                  className={regionFilter === r ? 'active' : ''}
                  onClick={() => setRegionFilter(r)}
                >{r}</Text>
              ))}
            </View>
          </View>
        </View>

        <View className='gallery-grid'>
          {loading ? (
            <Text className='loading'>{locale.loading}</Text>
          ) : filteredArtworks.length === 0 ? (
            <Text className='loading'>暂无藏品</Text>
          ) : (
            filteredArtworks.map(art => (
              <View
                key={art.id}
                className='artwork-card'
                onClick={() => handleCardClick(art.id)}
              >
                <View className='image-wrapper'>
                  {art.image_url ? (
                    <Image
                      className='artwork-image'
                      src={art.image_url}
                      mode='aspectFill'
                    />
                  ) : (
                    <View className='artwork-image-placeholder'>
                      <Text className='placeholder-text'>暂无图片</Text>
                    </View>
                  )}
                  <View
                    className='favorite-icon'
                    onClick={(e) => handleFavorite(e, art.id)}
                  >
                    <Text>{favorites.has(art.id) ? '❤️' : '🤍'}</Text>
                  </View>
                </View>
                <View className='artwork-info'>
                  <Text className='artwork-title' numberOfLines={1}>
                    {art.title || art.title_zh}
                  </Text>
                  <Text className='artwork-origin' numberOfLines={1}>
                    {art.origin}
                  </Text>
                  <Text className='artwork-price'>
                    {art.price}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
