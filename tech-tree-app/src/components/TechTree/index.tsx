import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import TechNode from '../TechNode'
import { TechData, TechStatus } from '../../types'
import { techTreeData } from '../../data/techTreeData'
import './TechTree.scss'

interface NodePosition {
  id: string
  x: number
  y: number
  level: number
  column: number
  width: number
  height: number
}

const BASE_WIDTH = 600
const BASE_HEIGHT = 500
const LEVEL_HEIGHT = 300
const COLUMN_WIDTH = 600
const PADDING = 150
const CURVE_HEIGHT = 100
const INITIAL_OFFSET = { x: 200, y: 50 }

const TechTree: React.FC = () => {
  const [techStatuses, setTechStatuses] = useState<Record<string, TechStatus>>({
    "expander": "Researched",
    "circuit-compiler": "Researched",
    "expchain-testnet": "Researched",
    "zkbridge": "Researched",
    "virgo++": "Developing",
    "optimized-verifier": "Developing",
    "zkcuda": "Developing",
    "zkpytorch": "Developing",
    "poi": "Developing",
    "on-chain-app": "Developing",
    "expos": "Pending",
    "scale-dev-ecosystem": "Developing",
    "gpu-expander": "Developing",
    "log-space-uniform-verifier": "Pending",
    "data-market": "Pending",
    "zkml-showcase-app": "Pending",
    "proof-of-consensus": "Developing",
    "multi-gpu-expander": "Pending",
    "zk-friendly-quantization": "Developing",
    "scale-dev-ecosystem-2": "Pending",
    "single-slot-finality": "Pending",
    "zkbridge-ssf": "Pending",
    "larger-model-integration": "Pending",
    "full-decentralization": "Pending"
  })
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([])
  const [eraPositions, setEraPositions] = useState<Record<string, number>>({})
  const [scale, setScale] = useState(0.2)
  const [position, setPosition] = useState(INITIAL_OFFSET)
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredTech, setHoveredTech] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleWheel = useCallback((e: WheelEvent) => {
    // Only handle wheel events that aren't from tech nodes
    if (!(e.target as HTMLElement).closest('.tech-content')) {
      e.preventDefault()
      const delta = e.deltaY
      requestAnimationFrame(() => {
        setScale(prev => Math.min(Math.max(0.15, prev - delta * 0.001), 2))
      })
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    requestAnimationFrame(() => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  const handleZoomIn = useCallback(() => {
    requestAnimationFrame(() => {
      setScale(prev => Math.min(prev + 0.1, 2))
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    requestAnimationFrame(() => {
      setScale(prev => Math.max(prev - 0.1, 0.15))
    })
  }, [])

  const handleReset = useCallback(() => {
    requestAnimationFrame(() => {
      setScale(0.2)
      setPosition(INITIAL_OFFSET)
    })
  }, [])

  const calculateNodeSize = useCallback((tech: TechData) => {
    const contentLength = (
      tech.name.length + 
      (tech.description?.length || 0) + 
      (tech.unlocks?.join('').length || 0) +
      (tech.prerequisites?.join('').length || 0)
    );
    
    const widthScale = Math.min(Math.max(1, contentLength / 100), 1.5);
    const heightScale = Math.min(Math.max(1, contentLength / 150), 1.5);
    
    return {
      width: BASE_WIDTH * widthScale,
      height: BASE_HEIGHT * heightScale
    };
  }, []);

  useEffect(() => {
    const positions: NodePosition[] = []
    const eraYPositions: Record<string, number> = {}
    let maxColumnWidths: number[] = []
    
    Object.entries(techTreeData).forEach(([era, techs]) => {
      techs.forEach(tech => {
        const { width } = calculateNodeSize(tech)
        const column = tech.position
        maxColumnWidths[column] = Math.max(maxColumnWidths[column] || 0, width)
      })
    })

    Object.entries(techTreeData).forEach(([era, techs]) => {
      const firstTech = techs[0]
      eraYPositions[era] = firstTech.level * LEVEL_HEIGHT
      
      techs.forEach(tech => {
        const { width, height } = calculateNodeSize(tech)
        const x = tech.position === 0 ? 0 : 
          maxColumnWidths.slice(0, tech.position).reduce((sum, w) => sum + w + PADDING, 0)
        
        positions.push({
          id: tech.id,
          x,
          y: tech.level * LEVEL_HEIGHT,
          level: tech.level,
          column: tech.position,
          width,
          height
        })
      })
    })

    const allTechs = Object.values(techTreeData).flat()
    const maxLevel = Math.max(...allTechs.map(t => t.level))
    const totalWidth = maxColumnWidths.reduce((sum, width) => sum + width + PADDING, 0)
    const height = (maxLevel + 1) * LEVEL_HEIGHT + CURVE_HEIGHT * 2

    setNodePositions(positions)
    setEraPositions(eraYPositions)
    setSvgSize({ width: totalWidth, height })
  }, [calculateNodeSize])

  const handleTechClick = useCallback((techId: string) => {
    setTechStatuses(prev => {
      const current = prev[techId]
      const newStatus: TechStatus = !current ? 'Researched' : 
                       current === 'Researched' ? 'Developing' :
                       current === 'Developing' ? 'Pending' : 'Researched'
      return {
        ...prev,
        [techId]: newStatus
      }
    })
  }, [])

  const isAvailable = useCallback((tech: TechData): boolean => {
    if (!tech.prerequisites?.length) return true
    return tech.prerequisites.every(prereq => techStatuses[prereq] === 'Researched')
  }, [techStatuses])

  const renderEraLabels = useMemo(() => {
    return Object.entries(eraPositions).map(([era, yPosition]) => (
      <div
        key={era}
        className="era-label"
        style={{
          left: -PADDING * 2.5,
          top: yPosition - 30,
          position: 'absolute',
          transform: 'translateY(-50%)',
          whiteSpace: 'nowrap',
          zIndex: 5
        }}
      >
        {era}
      </div>
    ))
  }, [eraPositions])

  const renderConnections = useMemo(() => {
    return Object.values(techTreeData).flat().map(tech => {
      return tech.prerequisites.map(prereqId => {
        const startNode = nodePositions.find(p => p.id === prereqId)
        const endNode = nodePositions.find(p => p.id === tech.id)
        if (!startNode || !endNode) return null

        const startX = startNode.x + startNode.width / 2
        const startY = startNode.y + startNode.height / 2
        const endX = endNode.x + endNode.width / 2
        const endY = endNode.y + endNode.height / 2

        const status = techStatuses[tech.id]
        const className = `${status === 'Researched' ? 'completed' : 
                          status === 'Developing' ? 'active' : ''} 
                          ${tech.id === hoveredTech ? 'connected' : ''}`

        const deltaX = endX - startX
        const deltaY = endY - startY
        const isUpward = endY < startY
        
        const controlPoint1X = startX + deltaX * 0.3
        const controlPoint1Y = startY + (isUpward ? -CURVE_HEIGHT/3 : CURVE_HEIGHT/3)
        const controlPoint2X = startX + deltaX * 0.7
        const controlPoint2Y = endY + (isUpward ? -CURVE_HEIGHT/3 : CURVE_HEIGHT/3)

        const arrowAngle = Math.atan2(endY - controlPoint2Y, endX - controlPoint2X)
        const arrowLength = 12
        const arrowX1 = endX - arrowLength * Math.cos(arrowAngle - Math.PI / 6)
        const arrowY1 = endY - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
        const arrowX2 = endX - arrowLength * Math.cos(arrowAngle + Math.PI / 6)
        const arrowY2 = endY - arrowLength * Math.sin(arrowAngle + Math.PI / 6)

        return (
          <g key={`${prereqId}-${tech.id}`}>
            <path
              d={`M ${startX} ${startY} 
                  C ${controlPoint1X} ${controlPoint1Y}, 
                    ${controlPoint2X} ${controlPoint2Y}, 
                    ${endX} ${endY}`}
              className={className}
            />
            <path
              d={`M ${arrowX1} ${arrowY1} L ${endX} ${endY} L ${arrowX2} ${arrowY2}`}
              fill="none"
              stroke={className.includes('completed') ? '#4caf50' : 
                      className.includes('active') ? '#ffd700' : 
                      className.includes('connected') ? '#2196f3' : 
                      'rgba(255, 255, 255, 0.3)'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={className}
            />
          </g>
        )
      })
    })
  }, [nodePositions, techStatuses, hoveredTech])

  const containerStyle = useMemo(() => ({
    transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
    transition: isDragging ? 'none' : 'transform 0.1s ease',
    width: svgSize.width,
    height: svgSize.height,
    willChange: 'transform'
  }), [position.x, position.y, scale, isDragging, svgSize.width, svgSize.height])

  return (
    <>
      <div 
        ref={containerRef}
        className="tech-tree"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="tech-container"
          style={containerStyle}
        >
          <svg 
            ref={svgRef} 
            className="connections"
            width={svgSize.width}
            height={svgSize.height}
            viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
          >
            {renderConnections}
          </svg>
          {renderEraLabels}
          {nodePositions.map(position => {
            const tech = Object.values(techTreeData).flat().find(t => t.id === position.id)!
            return (
              <div
                key={tech.id}
                style={{
                  position: 'absolute',
                  left: position.x,
                  top: position.y,
                  width: position.width,
                  height: position.height,
                  zIndex: 10,
                  willChange: 'transform'
                }}
              >
                <TechNode
                  tech={tech}
                  status={techStatuses[tech.id]}
                  isAvailable={isAvailable(tech)}
                  onClick={() => handleTechClick(tech.id)}
                  onMouseEnter={() => setHoveredTech(tech.id)}
                  onMouseLeave={() => setHoveredTech(null)}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="zoom-controls">
        <button onClick={handleZoomIn} title="Zoom In">+</button>
        <button onClick={handleReset} title="Reset View">⟲</button>
        <button onClick={handleZoomOut} title="Zoom Out">−</button>
      </div>
    </>
  )
}

export default React.memo(TechTree)
