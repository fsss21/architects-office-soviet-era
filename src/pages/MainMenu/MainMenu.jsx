import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import styles from './MainMenu.module.css'
import mainMenuImg from '../../assets/main_menu_img.png'
import mainMenuImg4k from '../../assets/main_menu_img-4k.png'

import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

function MainMenu() {
  const navigate = useNavigate()
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [imageSrc, setImageSrc] = useState(mainMenuImg)
  const [texts, setTexts] = useState([])

  useEffect(() => {
    // Определяем, нужно ли использовать 4K изображение
    // Для экранов с шириной >= 2560px или высотой >= 1440px используем 4K версию
    const is4K = window.innerWidth >= 2560 || window.innerHeight >= 1440
    setImageSrc(is4K ? mainMenuImg4k : mainMenuImg)

    // Загружаем тексты из JSON файла
    fetch('/data/progressPoints.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(data => {
        const formattedTexts = Array.isArray(data)
          ? data.map(item => {
              const text =
                item.label ??
                (Array.isArray(item.labelSegments)
                  ? item.labelSegments.map((s) => (s && s.text) || '').join(' ')
                  : '')
              return {
                id: item.id,
                text,
                labelSegments: item.labelSegments,
              }
            })
          : []
        setTexts(formattedTexts)
      })
      .catch(err => console.error('Error loading progress points:', err))
  }, [])

  const handleNextText = () => {
    if (texts.length > 0 && currentTextIndex < texts.length - 1) {
      setCurrentTextIndex((prev) => prev + 1)
    }
  }

  const handlePrevText = () => {
    if (currentTextIndex > 0) {
      setCurrentTextIndex((prev) => prev - 1)
    }
  }

  const handleDetails = () => {
    navigate('/submenu')
  }

  const handleCatalog = () => {
    navigate('/catalog')
  }

  return (
    <div className={styles.mainMenu}>
      <div 
        className={styles.mainMenuBackground}
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      <Header />
      <div className={styles.mainMenuContent}>
        {/* Центральный блок с текстом */}
        <div className={styles.mainMenuCenter}>
          <div className={styles.mainMenuTextContainer}>
          <div className={styles.mainMenuTextBlock}>
              <span 
                className={styles.mainMenuText}
                dangerouslySetInnerHTML={{ __html: texts[currentTextIndex]?.text || '' }}
              />
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={styles.mainMenuDetailsBtn}
                  onClick={handleDetails}
                >
                  Подробнее
                </button>
                <div className={styles.controls}>
                  <button 
                    className={styles.mainMenuArrow}
                    onClick={handlePrevText}
                    disabled={currentTextIndex === 0}
                    aria-label="Предыдущий текст"
                  >
                    <ArrowLeftIcon fontSize='large'/>
                  </button>
                  <button
                    className={styles.mainMenuArrow}
                    onClick={handleNextText}
                    disabled={currentTextIndex === texts.length - 1}
                    aria-label="Следующий текст"
                  >
                    <ArrowRightIcon fontSize='large'/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка "Перейти в каталог" справа от центра */}
        <div className={styles.mainMenuCatalogBtnContainer}>
          <button
            type="button"
            className={styles.mainMenuCatalogBtn}
            onClick={handleCatalog}
          >
            Перейти в каталог
          </button>
        </div>
      </div>
    </div>
  )
}

export default MainMenu
