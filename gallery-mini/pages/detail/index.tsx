import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { fetchArtworkById } from '../../api/artworks'
import { isFavorite, toggleFavorite } from '../../utils/favorites'
import { zh } from '../../locales'
import './index.css'

const locale = zh

export default function Detail() {
  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    const { id } = Taro.getCurrentInstance().router?.params || {}
    if (id) {
      loadArtwork(id)
      setFavorited(isFavorite(id))
    }
  }, [])

  const loadArtwork = (id) => {
    setLoading(true)
    fetchArtworkById(id).then(data => {
      setArtwork(data)
      setLoading(false)
    }).catch(e => {
      console.error('Failed to load artwork:', e)
      setLoading(false)
    })
  }

  const handleFavorite = () => {
    if (!artwork) return
    const newState = toggleFavorite(artwork.id)
    setFavorited(newState)
    Taro.showToast({
      title: newState ? '已收藏' : '已取消收藏',
      icon: 'success',
      duration: 1500,
    })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  if (loading) {
    return (
      <View className='detail-container'>
        <Text className='loading'>{locale.loading}</Text>
      </View>
    )
  }

  if (!artwork) {
    return (
      <View className='detail-container'>
        <Text className='loading'>未找到藏品</Text>
      </View>
    )
  }

  return (
    <View className='detail-container'>
      <ScrollView scrollY className='detail-content'>
        <View className='back-btn' onClick={handleBack}>
          <Text>← 返回</Text>
        </View>

        <View className='image-wrapper'>
          {artwork.image_url ? (
            <Image
              className='detail-image'
              src={artwork.image_url}
              mode='aspectFit'
            />
          ) : (
            <View className='detail-image-placeholder'>
              <Text className='placeholder-text'>暂无图片</Text>
            </View>
          )}
        </View>

        <View className='info-section'>
          <Text className='detail-title'>{artwork.title || artwork.title_zh}</Text>
          {artwork.title_zh && artwork.title && (
            <Text className='detail-title-zh'>{artwork.title_zh}</Text>
          )}

          <View className='info-row'>
            <Text className='info-label'>编号:</Text>
            <Text className='info-value'>{artwork.inventory_number}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>来源:</Text>
            <Text className='info-value'>{artwork.origin}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>地域:</Text>
            <Text className='info-value'>{artwork.region}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>材质:</Text>
            <Text className='info-value'>{artwork.material}</Text>
          </View>

          {artwork.technique && (
            <View className='info-row'>
              <Text className='info-label'>工艺:</Text>
              <Text className='info-value'>{artwork.technique}</Text>
            </View>
          )}

          <View className='info-row'>
            <Text className='info-label'>尺寸:</Text>
            <Text className='info-value'>{artwork.dimensions}</Text>
          </View>

          <View className='info-row price-row'>
            <Text className='info-label'>价格:</Text>
            <Text className='info-value price'>{artwork.price}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>状态:</Text>
            <Text className='info-value status'>
              {artwork.inventory_status === 'available' ? '在库' :
               artwork.inventory_status === 'reserved' ? '暂时保留' : '已售'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className='bottom-bar'>
        <View
          className={`favorite-btn ${favorited ? 'favorited' : ''}`}
          onClick={handleFavorite}
        >
          <Text>{favorited ? '❤️ 已收藏' : '🤍 收藏'}</Text>
        </View>
      </View>
    </View>
  )
}
