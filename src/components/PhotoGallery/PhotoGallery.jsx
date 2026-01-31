import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './PhotoGallery.module.css'

function PhotoGallery({ photos = [], showFullscreen = false, onCloseFullscreen, onImageClick, showControls = false, showArrows = false, currentIndex: externalIndex, onIndexChange }) {
  const [internalIndex, setInternalIndex] = useState(0)
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex

  useEffect(() => {
    if (showFullscreen) {
      const handleEscape = (e) => {
        if (e.key === 'Escape' && onCloseFullscreen) {
          onCloseFullscreen()
        }
      }
      document.addEventListener('keydown', handleEscape)
      // Блокируем скролл страницы при полноэкранном режиме
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [showFullscreen, onCloseFullscreen])

  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== internalIndex) {
      setInternalIndex(externalIndex)
    }
  }, [externalIndex])

  const nextPhoto = () => {
    const newIndex = (currentIndex + 1) % photos.length
    if (onIndexChange) {
      onIndexChange(newIndex)
    } else {
      setInternalIndex(newIndex)
    }
  }

  const prevPhoto = () => {
    const newIndex = (currentIndex - 1 + photos.length) % photos.length
    if (onIndexChange) {
      onIndexChange(newIndex)
    } else {
      setInternalIndex(newIndex)
    }
  }

  const handleImageClick = () => {
    if (!showFullscreen && onImageClick) {
      onImageClick()
    }
  }

  if (photos.length === 0) {
    return <div className={`${styles.photoGallery} ${styles.photoGalleryEmpty}`}>Нет фотографий</div>
  }

  const safeIndex = ((currentIndex % photos.length) + photos.length) % photos.length
  const currentPhoto = photos[safeIndex]

  const handleBackdropClick = (e) => {
    // Закрываем только если клик был по фону, а не по контейнеру с изображением
    if (e.target === e.currentTarget && onCloseFullscreen) {
      onCloseFullscreen()
    }
  }

  const handleCloseClick = (e) => {
    e.stopPropagation()
    if (onCloseFullscreen) {
      onCloseFullscreen()
    }
  }

  const handleContainerClick = (e) => {
    // Предотвращаем закрытие при клике на контейнер с изображением
    e.stopPropagation()
  }

  // Полноэкранный режим — рендерим в body через Portal, чтобы z-index был выше header
  if (showFullscreen) {
    const fullscreenContent = (
      <div 
        className={styles.photoGalleryFullscreen}
        onClick={handleBackdropClick}
      >
        <button 
          className={styles.photoGalleryClose} 
          onClick={handleCloseClick}
          aria-label="Закрыть полноэкранный режим"
          type="button"
        >
          ✕
        </button>
        <div 
          className={styles.photoGalleryContainer}
          onClick={handleContainerClick}
        >
          {showArrows && (
            <button
              className={`${styles.photoGalleryArrow} ${styles.photoGalleryArrowLeft}`}
              onClick={prevPhoto}
              aria-label="Предыдущее фото"
              type="button"
            >
              ‹
            </button>
          )}
          <div className={styles.photoGalleryImageWrapper}>
            <img
              src={currentPhoto}
              alt={`Фото ${safeIndex + 1}`}
              className={styles.photoGalleryImage}
            />
          </div>
          {showArrows && (
            <button
              className={`${styles.photoGalleryArrow} ${styles.photoGalleryArrowRight}`}
              onClick={nextPhoto}
              aria-label="Следующее фото"
              type="button"
            >
              ›
            </button>
          )}
        </div>
      </div>
    )
    return createPortal(fullscreenContent, document.body)
  }

  // Обычный режим
  return (
    <div className={styles.photoGallery}>
      <div className={styles.photoGalleryContainer}>
        {showArrows && (
          <button
            className={`${styles.photoGalleryArrow} ${styles.photoGalleryArrowLeft}`}
            onClick={prevPhoto}
            aria-label="Предыдущее фото"
          >
            ‹
          </button>
        )}
        <div className={styles.photoGalleryImageWrapper}>
          <img
            src={currentPhoto}
            alt={`Фото ${safeIndex + 1}`}
            className={styles.photoGalleryImage}
            onClick={handleImageClick}
          />
        </div>
        {showArrows && (
          <button
            className={`${styles.photoGalleryArrow} ${styles.photoGalleryArrowRight}`}
            onClick={nextPhoto}
            aria-label="Следующее фото"
          >
            ›
          </button>
        )}
      </div>
      {showControls && (
        <div className={styles.photoGalleryControls}>
          <button
            className={styles.photoGalleryNavBtn}
            onClick={prevPhoto}
            disabled={photos.length <= 1}
          >
            ←
          </button>
          <span className={styles.photoGalleryCounter}>
            {currentIndex + 1} / {photos.length}
          </span>
          <button
            className={styles.photoGalleryNavBtn}
            onClick={nextPhoto}
            disabled={photos.length <= 1}
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

export default PhotoGallery
