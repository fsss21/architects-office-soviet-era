import { useState, useEffect, useMemo } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useCatalogFilter } from '../../context/CatalogFilterContext'
import styles from './Header.module.css'

import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'


/** Эпохи и материалы берутся из catalogItems.json (уникальные значения creationTime и material) */

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

function Header() {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const isCatalogPage = location.pathname === '/catalog'
  const isCatalogItemPage = location.pathname.startsWith('/catalog/') && location.pathname !== '/catalog'

  const {
    selectedSculptors,
    setSelectedSculptors,
    selectedEras,
    setSelectedEras,
    selectedMaterials,
    setSelectedMaterials,
    searchQuery,
    setSearchQuery,
  } = useCatalogFilter()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sculptors, setSculptors] = useState([])
  const [eraOptions, setEraOptions] = useState([])
  const [materialOptions, setMaterialOptions] = useState([])
  const [catalogItemsForNav, setCatalogItemsForNav] = useState([])

  useEffect(() => {
    if (isCatalogPage) {
      fetch('/data/catalogItems.json')
        .then(res => {
          if (!res.ok) return
          return res.json()
        })
        .then(data => {
          if (!Array.isArray(data)) return
          const uniqueSculptors = [...new Set(data.map(item => item.sculptor).filter(Boolean))]
          setSculptors(uniqueSculptors)
          const uniqueEras = [...new Set(data.map(item => item.creationTime).filter(Boolean))]
          setEraOptions(uniqueEras)
          const uniqueMaterials = [...new Set(data.map(item => item.material).filter(Boolean))]
          setMaterialOptions(uniqueMaterials)
        })
        .catch(() => { })
    }
  }, [isCatalogPage])

  useEffect(() => {
    if (isCatalogItemPage) {
      fetch('/data/catalogItems.json')
        .then(res => {
          if (!res.ok) return
          return res.json()
        })
        .then(data => {
          setCatalogItemsForNav(Array.isArray(data) ? data : [])
        })
        .catch(() => { })
    } else {
      setCatalogItemsForNav([])
    }
  }, [isCatalogItemPage])

  const filteredItemsForNav = useMemo(() => {
    if (!catalogItemsForNav.length) return []
    return catalogItemsForNav.filter((item) => {
      if (selectedSculptors.length > 0 && !selectedSculptors.includes(item.sculptor)) return false
      if (selectedEras.length > 0 && !selectedEras.includes(item.creationTime)) return false
      if (selectedMaterials.length > 0 && !selectedMaterials.includes(item.material || '')) return false
      if (!matchesSearch(item, searchQuery)) return false
      return true
    })
  }, [catalogItemsForNav, selectedSculptors, selectedEras, selectedMaterials, searchQuery])

  const currentItemId = params.id ? parseInt(params.id, 10) : null
  const currentNavIndex = useMemo(() => {
    if (currentItemId == null || !filteredItemsForNav.length) return -1
    const idx = filteredItemsForNav.findIndex((i) => i.id === currentItemId)
    return idx >= 0 ? idx : -1
  }, [currentItemId, filteredItemsForNav])

  const prevItem = currentNavIndex > 0 ? filteredItemsForNav[currentNavIndex - 1] : null
  const nextItem = currentNavIndex >= 0 && currentNavIndex < filteredItemsForNav.length - 1 ? filteredItemsForNav[currentNavIndex + 1] : null

  const handleHeaderPrevItem = () => {
    if (prevItem) navigate(`/catalog/${prevItem.id}`)
  }
  const handleHeaderNextItem = () => {
    if (nextItem) navigate(`/catalog/${nextItem.id}`)
  }
  const handleHeaderCloseItem = () => {
    navigate('/catalog')
  }

  const showOverlay = filtersOpen || searchOpen

  const handleFiltersToggle = () => {
    setFiltersOpen(prev => !prev)
    if (searchOpen) setSearchOpen(false)
  }

  const handleSearchToggle = () => {
    setSearchOpen(prev => !prev)
    if (filtersOpen) setFiltersOpen(false)
  }

  const handleOverlayClick = () => {
    setFiltersOpen(false)
    setSearchOpen(false)
  }

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.()
    setSearchOpen(false)
  }

  const resetSculptors = () => setSelectedSculptors([])
  const resetEras = () => setSelectedEras([])
  const resetMaterials = () => setSelectedMaterials([])

  const handleShowFilters = () => {
    setFiltersOpen(false)
  }

  const toggleSculptor = (name) => {
    setSelectedSculptors(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    )
  }
  const toggleEra = (name) => {
    setSelectedEras(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    )
  }
  const toggleMaterial = (name) => {
    setSelectedMaterials(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    )
  }

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Памятники советской эпохи</h1>

        {isCatalogItemPage && (
          <div className={styles.headerItemNav}>
            <div className={styles.headerItemNavArrows}>
              <button
                type="button"
                className={styles.headerItemNavBtn}
                onClick={handleHeaderPrevItem}
                disabled={!prevItem}
                aria-label="Предыдущий предмет"
              >

              </button>
              <button
                type="button"
                className={styles.headerItemNavBtn}
                onClick={handleHeaderNextItem}
                disabled={!nextItem}
                aria-label="Следующий предмет"
              >

              </button>
            </div>
            <button
              type="button"
              className={styles.headerItemNavClose}
              onClick={handleHeaderCloseItem}
              aria-label="Закрыть, вернуться в каталог"
            >

            </button>
          </div>
        )}

        {isCatalogPage && (
          <div className={styles.headerButtons}>
            <div className={styles.headerDropdownWrap}>
              <button
                type="button"
                className={styles.headerBtnFilters}
                onClick={handleFiltersToggle}
                aria-expanded={filtersOpen}
                aria-haspopup="true"
                aria-label="Открыть фильтры"
              >
                <MenuIcon fontSize='large' />
              </button>
              {filtersOpen && (
                <div className={styles.headerDropdown} onClick={e => e.stopPropagation()}>
                  <div className={styles.headerDropdownHeader}>
                    <h3 className={styles.headerDropdownTitle}>Фильтры</h3>
                    <button
                      type="button"
                      className={styles.headerDropdownClose}
                      onClick={() => setFiltersOpen(false)}
                      aria-label="Закрыть фильтры"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  <div className={styles.headerFilterBlock}>
                    <div className={styles.headerFilterLabelWrap}>
                      <span className={styles.headerFilterLabel}>Скульпторы</span>
                      <button type="button" className={styles.headerResetBtn} onClick={resetSculptors}>
                        Сбросить
                      </button>
                    </div>
                    <div className={styles.headerFilterOptions}>
                      {sculptors.map(name => (
                        <label key={name} className={styles.headerFilterCheck}>
                          <input
                            type="checkbox"
                            checked={selectedSculptors.includes(name)}
                            onChange={() => toggleSculptor(name)}
                          />
                          {name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.headerFilterBlock}>
                    <div className={styles.headerFilterLabelWrap}>
                      <span className={styles.headerFilterLabel}>Эпохи</span>
                      <button type="button" className={styles.headerResetBtn} onClick={resetEras}>
                        Сбросить
                      </button>
                    </div>
                    <div className={styles.headerFilterOptions}>
                      {eraOptions.map(name => (
                        <label key={name} className={styles.headerFilterCheck}>
                          <input
                            type="checkbox"
                            checked={selectedEras.includes(name)}
                            onChange={() => toggleEra(name)}
                          />
                          {name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.headerFilterBlock}>
                    <div className={styles.headerFilterLabelWrap}>
                      <span className={styles.headerFilterLabel}>Материал</span>
                      <button type="button" className={styles.headerResetBtn} onClick={resetMaterials}>
                        Сбросить
                      </button>
                    </div>
                    <div className={styles.headerFilterOptions}>
                      {materialOptions.map(name => (
                        <label key={name} className={styles.headerFilterCheck}>
                          <input
                            type="checkbox"
                            checked={selectedMaterials.includes(name)}
                            onChange={() => toggleMaterial(name)}
                          />
                          {name}
                        </label>
                      ))}
                    </div>

                  </div>

                  <button type="button" className={styles.headerShowBtn} onClick={handleShowFilters}>
                    Показать
                  </button>
                </div>
              )}
            </div>

            <div className={styles.headerSearchWrap}>
              <button
                type="button"
                className={styles.headerBtnSearch}
                onClick={handleSearchToggle}
                aria-expanded={searchOpen}
                aria-label="Открыть поиск"
              >
                <SearchIcon fontSize='large' />
              </button>
              {searchOpen && (
                <div className={styles.headerSearchPanel} onClick={e => e.stopPropagation()}>
                  <form className={styles.headerSearchForm} onSubmit={handleSearchSubmit}>
                    <button
                      type="submit"
                      className={styles.headerSearchIconBtn}
                      aria-label="Выполнить поиск"
                    >
                      <SearchIcon fontSize="large" />
                    </button>
                    <input
                      type="text"
                      className={styles.headerSearchInput}
                      placeholder="Найти произведение или автора"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      autoFocus
                      aria-label="Поиск"
                    />
                  </form>
                  <button
                    type="button"
                    className={styles.headerSearchClose}
                    onClick={() => setSearchOpen(false)}
                    aria-label="Закрыть поиск"
                  >
                    <CloseIcon fontSize="large" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {isCatalogPage && showOverlay && (
        <div
          className={styles.headerOverlay}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default Header
