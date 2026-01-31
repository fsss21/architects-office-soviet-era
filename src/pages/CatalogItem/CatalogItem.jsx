import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PhotoGallery from '../../components/PhotoGallery/PhotoGallery'
import Header from '../../components/Header/Header'
import styles from './CatalogItem.module.css'
import catalogItemImg from '../../assets/catalog_item_img.png'
import catalogItemImg4k from '../../assets/catalog_item_img-4k.png'
import griboedovImg from '../../assets/griboedov_img.png'
import korsakovImg from '../../assets/korsakov_img.png'
import ostrovskiImg from '../../assets/ostrovski_img.png'
import ourSityImg from '../../assets/our_sity_img.png'

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import FullscreenIcon from '@mui/icons-material/Fullscreen'

function CatalogItem() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [imageSrc, setImageSrc] = useState(catalogItemImg)

  // Маппинг изображений по названиям памятников
  const monumentImages = {
    'Памятник Грибоедову': griboedovImg,
    'Памятник Римскому-Корсакову': korsakovImg,
    'Памятник Островскому': ostrovskiImg,
    'Скульптура «Наш город»': ourSityImg
  }

  useEffect(() => {
    // Определяем, нужно ли использовать 4K изображение
    const is4K = window.innerWidth >= 2560 || window.innerHeight >= 1440
    setImageSrc(is4K ? catalogItemImg4k : catalogItemImg)

    // Загружаем данные о предмете
    setLoading(true)
    setNotFound(false)
    fetch('/data/catalogItems.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(data => {
        const list = Array.isArray(data) ? data : []
        const parsedId = id != null ? parseInt(id, 10) : NaN
        const foundItem = Number.isNaN(parsedId) ? null : list.find(i => i.id === parsedId)
        setItem(foundItem ?? null)
        setNotFound(!foundItem)
        setCurrentTextIndex(0)
        setCurrentPhotoIndex(0)
      })
      .catch(err => {
        console.error('Error loading catalog item:', err)
        setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleBack = () => {
    navigate('/catalog')
  }

  const handleFullscreen = () => {
    setShowFullscreen(true)
  }

  const handleCloseFullscreen = () => {
    setShowFullscreen(false)
  }

  const handleNextText = () => {
    if (item && item.texts && item.texts.length > 0) {
      if (currentTextIndex < item.texts.length - 1) {
        setCurrentTextIndex((prev) => prev + 1)
      }
    }
  }

  const handlePrevText = () => {
    if (currentTextIndex > 0) {
      setCurrentTextIndex((prev) => prev - 1)
    }
  }

  const handleNextPhoto = () => {
    const photos = getItemImages()
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    }
  }

  const handlePrevPhoto = () => {
    const photos = getItemImages()
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
  }

  // Получаем изображения для текущего предмета
  const getItemImages = () => {
    if (item && monumentImages[item.name]) {
      return [monumentImages[item.name]]
    }
    return item?.photos || []
  }

  if (loading) {
    return (
      <div className={styles.catalogItemPage}>
        <Header />
        <div className={styles.catalogItemContent}>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (notFound || !item) {
    return (
      <div className={styles.catalogItemPage}>
        <Header />
        <div className={styles.catalogItemContent}>
          <p>Произведение не найдено.</p>
          <button type="button" className={styles.catalogItemBackLink} onClick={() => navigate('/catalog')}>
            Вернуться в каталог
          </button>
        </div>
      </div>
    )
  }

  const currentPhotos = getItemImages()
  const currentTexts = item.texts || [item.description || '']

  return (
    <div className={styles.catalogItemPage}>
      <div 
        className={styles.catalogItemBackground}
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      <Header />
      <div className={styles.catalogItemContent}>
        <div className={styles.catalogItemMain}>
          {/* Левая колонка - текст */}
          <div className={styles.catalogItemTextBlock}>
            <h1 className={styles.catalogItemName}>{item.name}</h1>
            
            {item.sculptor && (
              <div className={styles.catalogItemInfoRow}>
                <span className={styles.catalogItemInfoLabel}>Скульптор:</span>
                <span className={styles.catalogItemInfoValue}>{item.sculptor}</span>
              </div>
            )}
            
            {item.creationTime && (
              <div className={styles.catalogItemInfoRow}>
                <span className={styles.catalogItemInfoLabel}>Время создания:</span>
                <span className={styles.catalogItemInfoValue}>{item.creationTime}</span>
              </div>
            )}
            
            {item.location && (
              <div className={styles.catalogItemInfoRow}>
                <span className={styles.catalogItemInfoLabel}>Место:</span>
                <span className={styles.catalogItemInfoValue}>{item.location}</span>
              </div>
            )}
            
            <div 
              className={styles.catalogItemDescription}
              dangerouslySetInnerHTML={{ __html: `<p>${currentTexts[currentTextIndex] || ''}</p>` }}
            />

            {/* Навигация текста */}
            {currentTexts.length > 1 && (
              <div className={styles.catalogItemTextNavigation}>
                <div className={styles.catalogItemTextCounter}>
                  {currentTextIndex + 1} / {currentTexts.length}
                </div>
                <div className={styles.catalogItemTextArrows}>
                  <button
                    className={styles.catalogItemTextNavBtn}
                    onClick={handlePrevText}
                    disabled={currentTextIndex === 0}
                    aria-label="Предыдущий текст"
                  >
                    <ArrowBackIosNewIcon/>
                  </button>
                  <button
                    className={styles.catalogItemTextNavBtn}
                    onClick={handleNextText}
                    disabled={currentTextIndex === currentTexts.length - 1}
                    aria-label="Следующий текст"
                  >
                    <ArrowForwardIosIcon/>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка - фото (60-65% ширины) */}
          {currentPhotos.length > 0 && (
            <div className={styles.catalogItemPhotoBlock}>
              <div className={styles.catalogItemGallery}>
                <PhotoGallery
                  photos={currentPhotos}
                  showFullscreen={showFullscreen}
                  onCloseFullscreen={handleCloseFullscreen}
                  showControls={false}
                  showArrows={false}
                  currentIndex={currentPhotoIndex}
                  onIndexChange={setCurrentPhotoIndex}
                />
              </div>

              {/* Навигация фото */}
              <div className={styles.catalogItemPhotoNavigation}>
                <button
                  className={styles.catalogItemPhotoNavBtn}
                  onClick={handlePrevPhoto}
                  disabled={currentPhotos.length <= 1}
                  aria-label="Предыдущее фото"
                >
                  <ArrowBackIosNewIcon/>
                </button>
                <div className={styles.catalogItemPhotoCounter}>
                  {currentPhotoIndex + 1} / {currentPhotos.length}
                </div>
                <button
                  className={styles.catalogItemPhotoNavBtn}
                  onClick={handleNextPhoto}
                  disabled={currentPhotos.length <= 1}
                  aria-label="Следующее фото"
                >
                  <ArrowForwardIosIcon/>
                </button>
                <button
                  className={styles.catalogItemFullscreenBtn}
                  onClick={handleFullscreen}
                  aria-label="Полноэкранный режим"
                >
                  <FullscreenIcon fontSize='large'/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CatalogItem
