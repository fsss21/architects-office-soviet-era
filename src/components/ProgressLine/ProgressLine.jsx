import { useState } from 'react'
import styles from './ProgressLine.module.css'

/** Нормализует label из JSON: убирает лишние пробелы вокруг <br/>, задаёт единый перенос строки */
function formatLabel(raw) {
  if (raw == null || typeof raw !== 'string') return ''
  return raw
    .trim()
    .replace(/\s*<br\s*\/?>\s*/gi, '<br />')
    .replace(/\s+/g, ' ')
}

function ProgressLine({ points = [], onPointClick, activeIndex }) {
  const [internalActive, setInternalActive] = useState(0)
  const isControlled = activeIndex !== undefined && activeIndex !== null
  const activePoint = isControlled ? activeIndex : internalActive

  const handlePointClick = (index) => {
    if (!isControlled) setInternalActive(index)
    if (onPointClick) onPointClick(index)
  }

  return (
    <div className={styles.progressLine}>
      <div className={styles.progressLineLine}>
        {points.map((point, index) => (
          <div
            key={point.id || index}
            className={`${styles.progressLinePoint} ${
              activePoint === index ? styles.progressLinePointActive : ''
            }`}
            onClick={() => handlePointClick(index)}
          >
            <div 
              className={styles.progressLineLabel}
              dangerouslySetInnerHTML={{ __html: formatLabel(point.subMenuLabel ?? point.label) || `Точка ${index + 1}` }}
              onClick={(e) => {
                e.stopPropagation()
                handlePointClick(index)
              }}
            />
            <div className={styles.progressLineArrow} aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressLine

