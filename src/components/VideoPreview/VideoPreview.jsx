import { useState, useEffect } from 'react'
import styles from './VideoPreview.module.css'
import mainPageImg from '../../assets/main_page_img.png'
import mainPageImg4k from '../../assets/main_page_img-4k.png'

function VideoPreview({ onComplete }) {
  const [showPreview, setShowPreview] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(mainPageImg)

  useEffect(() => {
    const is4K = window.innerWidth >= 2560 || window.innerHeight >= 1440
    setImageSrc(is4K ? mainPageImg4k : mainPageImg)
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

