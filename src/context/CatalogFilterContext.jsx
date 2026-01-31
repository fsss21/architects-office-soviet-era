import { createContext, useContext, useState } from 'react'

const CatalogFilterContext = createContext(null)

export function CatalogFilterProvider({ children }) {
  const [selectedSculptors, setSelectedSculptors] = useState([])
  const [selectedEras, setSelectedEras] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const value = {
    selectedSculptors,
    setSelectedSculptors,
    selectedEras,
    setSelectedEras,
    selectedMaterials,
    setSelectedMaterials,
    searchQuery,
    setSearchQuery,
  }

  return (
    <CatalogFilterContext.Provider value={value}>
      {children}
    </CatalogFilterContext.Provider>
  )
}

export function useCatalogFilter() {
  const ctx = useContext(CatalogFilterContext)
  if (!ctx) {
    throw new Error('useCatalogFilter must be used within CatalogFilterProvider')
  }
  return ctx
}
