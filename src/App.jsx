import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { CatalogFilterProvider } from './context/CatalogFilterContext'
import VideoPreview from './components/VideoPreview/VideoPreview'
import MainMenu from './pages/MainMenu/MainMenu'
import SubMenu from './pages/SubMenu/SubMenu'
import Catalog from './pages/Catalog/Catalog'
import CatalogItem from './pages/CatalogItem/CatalogItem'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showVideo, setShowVideo] = useState(true)

  useEffect(() => {
    // При перезагрузке страницы всегда перенаправляем на MainMenu (главную страницу)
    if (location.pathname !== '/') {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Выполняется только при монтировании

  const handleVideoComplete = () => {
    setShowVideo(false)
  }

  return (
    <CatalogFilterProvider>
      {showVideo && <VideoPreview onComplete={handleVideoComplete} />}
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/submenu" element={<SubMenu />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<CatalogItem />} />
      </Routes>
    </CatalogFilterProvider>
  )
}

function App() {
  return <AppContent />
}

export default App
