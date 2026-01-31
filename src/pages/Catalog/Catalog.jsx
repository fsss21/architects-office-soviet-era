import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalogFilter } from '../../context/CatalogFilterContext'
import Header from '../../components/Header/Header'
import styles from './Catalog.module.css'
import catalogImg from '../../assets/catalog_img.png'
import catalogImg4k from '../../assets/catalog_img-4k.png'
import griboedovImg from '../../assets/griboedov_img.png'
import korsakovImg from '../../assets/korsakov_img.png'
import ostrovskiImg from '../../assets/ostrovski_img.png'
import ourSityImg from '../../assets/our_sity_img.png'

import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';


// Маппинг года из creationTime в эпохи (по данным catalogItems.json)
const getErasFromCreationTime = (creationTime) => {
  if (!creationTime) return []
  const match = String(creationTime).match(/\d{4}/)
  const year = match ? parseInt(match[0], 10) : null
  if (year === null) return []
  const eras = []
  if (year < 1800) eras.push('XVIII век')
  if (year >= 1800 && year < 1900) eras.push('XIX век')
  if (year >= 1760 && year <= 1840) eras.push('Эпоха классицизма')
  return eras
}

const matchesSearch = (item, query) => {
  if (!query || !query.trim()) return true
  const q = query.trim().toLowerCase()
  const searchIn = [
    item.name,
    item.title,
    item.sculptor,
    item.location,
    item.creationTime,
    ...(Array.isArray(item.texts) ? item.texts : []),
  ].filter(Boolean).join(' ')
  return searchIn.toLowerCase().includes(q)
}

function Catalog() {
  const navigate = useNavigate()
  const { selectedSculptors, selectedEras, selectedMaterials, searchQuery } = useCatalogFilter()
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [imageSrc, setImageSrc] = useState(catalogImg)
  const [items, setItems] = useState([])

  // Маппинг изображений по названиям памятников
  const monumentImages = {
    'Памятник Грибоедову': griboedovImg,
    'Памятник Римскому-Корсакову': korsakovImg,
    'Памятник Островскому': ostrovskiImg,
    'Скульптура «Наш город»': ourSityImg
  }

  useEffect(() => {
    // Определяем, нужно ли использовать 4K изображение
    // Для экранов с шириной >= 2560px или высотой >= 1440px используем 4K версию
    const is4K = window.innerWidth >= 2560 || window.innerHeight >= 1440
    setImageSrc(is4K ? catalogImg4k : catalogImg)

    // Загружаем предметы каталога из JSON файла
    fetch('/data/catalogItems.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(data => {
        setItems(Array.isArray(data) ? data : [])
      })
      .catch(err => console.error('Error loading catalog items:', err))
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedSculptors.length > 0 && !selectedSculptors.includes(item.sculptor)) return false
      if (selectedEras.length > 0) {
        const itemEras = getErasFromCreationTime(item.creationTime)
        const hasEra = selectedEras.some((era) => itemEras.includes(era))
        if (!hasEra) return false
      }
      if (selectedMaterials.length > 0) {
        const material = item.material || ''
        if (!selectedMaterials.includes(material)) return false
      }
      if (!matchesSearch(item, searchQuery)) return false
      return true
    })
  }, [items, selectedSculptors, selectedEras, selectedMaterials, searchQuery])

  useEffect(() => {
    setCurrentItemIndex((prev) => Math.min(prev, Math.max(0, filteredItems.length - 1)))
  }, [filteredItems.length])

  const handleNextItem = () => {
    if (filteredItems.length > 0 && currentItemIndex < filteredItems.length - 1) {
      setCurrentItemIndex((prev) => prev + 1)
    }
  }

  const handlePrevItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex((prev) => prev - 1)
    }
  }

  const handleItemClick = (item) => {
    // При клике на предмет открываем страницу с предметом
    navigate(`/catalog/${item.id}`)
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className={styles.catalog}>
      <div 
        className={styles.catalogBackground}
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      <Header />
      <div className={styles.catalogContent}>
        {/* Центральная область с предметами */}
        <div className={styles.catalogCenter}>
          <div className={styles.catalogItemsContainer}>
            {filteredItems.length === 0 ? (
              <p className={styles.catalogEmpty}>По вашему запросу ничего не найдено. Измените фильтры или поиск.</p>
            ) : (
            filteredItems.map((item, index) => {
              let blockPositionClass = ''
              if (item.id === 1) blockPositionClass = styles.catalogItemTop
              else if (item.id === 3) blockPositionClass = styles.catalogItemMiddle
              else blockPositionClass = styles.catalogItemBottom

              return (
                <div
                  key={item.id}
                  className={`${styles.catalogItem} ${blockPositionClass}`}
                  onClick={() => handleItemClick(item)}
                >
                <div className={styles.catalogItemImage}>
                  {monumentImages[item.name] ? (
                    <img
                      src={monumentImages[item.name]}
                      alt={item.name ?? ''}
                      onError={(e) => {
                        if (e?.target) e.target.style.display = 'none'
                      }}
                    />
                  ) : item.photos?.length > 0 ? (
                    <img
                      src={item.photos[0]}
                      alt={item.name ?? ''}
                      onError={(e) => {
                        if (e?.target) e.target.style.display = 'none'
                      }}
                    />
                  ) : null}
                </div>
                <div className={styles.catalogItemOverlay}>
                  <h3 className={styles.catalogItemTitle}>
                    {item?.name || item?.title || ''}
                  </h3>
                </div>
              </div>
              )
            })
            )}
          </div>

          {/* Стрелочки для переключения между предметами - по середине страницы */}
          <div className={styles.catalogControls}>
            <button 
              className={styles.catalogArrow}
              onClick={handlePrevItem}
              disabled={filteredItems.length === 0 || currentItemIndex === 0}
              aria-label="Предыдущий предмет"
            >
              <ArrowLeftIcon fontSize='large'/>
            </button>
            <button
              className={styles.catalogArrow}
              onClick={handleNextItem}
              disabled={filteredItems.length === 0 || currentItemIndex === filteredItems.length - 1}
              aria-label="Следующий предмет"
            >
              <ArrowRightIcon fontSize='large'/>
            </button>
          </div>
        </div>

        {/* Кнопка "Назад" внизу слева */}
        <div className={styles.catalogBottomNavigation}>
          <button
            type="button"
            className={styles.catalogBackBtn}
            onClick={handleBack}
            aria-label="Назад"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  )
}

export default Catalog
