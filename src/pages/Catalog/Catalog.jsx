import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalogFilter } from '../../context/CatalogFilterContext'
import Header from '../../components/Header/Header'
import styles from './Catalog.module.css'
import catalogImg from '../../assets/catalog_img.png'
import catalogImg4k from '../../assets/catalog_img-4k.png'

import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';


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
  const [currentPage, setCurrentPage] = useState(0)
  const [imageSrc, setImageSrc] = useState(catalogImg)
  const [items, setItems] = useState([])

  // Путь к фото из public/data/images (файл задаётся в catalogItems.json в поле image)
  const getItemImageSrc = (item) => {
    if (item?.image) return `/data/images/${encodeURIComponent(item.image)}`
    if (item?.photos?.length) return item.photos[0]
    return null
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
      if (selectedEras.length > 0 && !selectedEras.includes(item.creationTime)) return false
      if (selectedMaterials.length > 0 && !selectedMaterials.includes(item.material || '')) return false
      if (!matchesSearch(item, searchQuery)) return false
      return true
    })
  }, [items, selectedSculptors, selectedEras, selectedMaterials, searchQuery])

  const MAX_CATALOG_ITEMS = 4
  const maxStartIndex = Math.max(0, filteredItems.length - MAX_CATALOG_ITEMS)
  const displayItems = filteredItems.slice(currentPage, currentPage + MAX_CATALOG_ITEMS)

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, maxStartIndex))
  }, [maxStartIndex])

  const handleNextItem = () => {
    if (currentPage < maxStartIndex) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevItem = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1)
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
            {displayItems.length === 0 ? (
              <p className={styles.catalogEmpty}>По вашему запросу ничего не найдено. Измените фильтры или поиск.</p>
            ) : (
              displayItems.map((item, index) => {
                let blockPositionClass = ''
                if (index === 0) blockPositionClass = styles.catalogItemTop
                else if (index === 2) blockPositionClass = styles.catalogItemMiddle
                else blockPositionClass = styles.catalogItemBottom
                return (
                  <div
                    key={item.id}
                    className={`${styles.catalogItem} ${blockPositionClass}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className={styles.catalogItemImage}>
                      {getItemImageSrc(item) ? (
                        <img
                          src={getItemImageSrc(item)}
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
              disabled={displayItems.length === 0 || currentPage === 0}
              aria-label="Предыдущие предметы"
            >
              <ArrowLeftIcon fontSize='large'/>
            </button>
            <button
              className={styles.catalogArrow}
              onClick={handleNextItem}
              disabled={displayItems.length === 0 || currentPage >= maxStartIndex}
              aria-label="Следующие предметы"
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
