import { useState, useEffect } from 'react'
import styles from './VideoPreview.module.css'

// Заставка: файлы из public (main_page_img.jpg, main_page_img-4k.jpg) или из assets через import
const DEFAULT_SPLASH = '/main_page_img.jpg'
const DEFAULT_SPLASH_4K = '/main_page_img-4k.jpg'

function VideoPreview({ onComplete }) {
  const [showPreview, setShowPreview] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(DEFAULT_SPLASH)

  useEffect(() => {
    const is4K = window.innerWidth >= 2560 || window.innerHeight >= 1440
    setImageSrc(is4K ? DEFAULT_SPLASH_4K : DEFAULT_SPLASH)
  }, [])

  const handleImageError = () => {
    setImageError(true)
  }

  const handleSkip = () => {
    setShowPreview(false)
    if (onComplete) {
      onComplete()
    }
  }

  const handleClick = () => {
    // Пропуск заставки по клику
    setShowPreview(false)
    if (onComplete) {
      onComplete()
    }
  }

  if (!showPreview) return null

  return (
    <div className={styles.videoPreview} onClick={handleClick}>
      {imageError && (
        <div className={styles.videoPreviewError} onClick={(e) => e.stopPropagation()}>
          <p>Нет заставки</p>
          <button type="button" onClick={handleSkip} className={styles.videoPreviewSkip}>
            Пропустить
          </button>
        </div>
      )}
      {!imageError && (
        <img
          src={imageSrc}
          alt="Заставка"
          className={styles.videoPreviewImage}
          onError={handleImageError}
        />
      )}
    </div>
  )
}

export default VideoPreview

