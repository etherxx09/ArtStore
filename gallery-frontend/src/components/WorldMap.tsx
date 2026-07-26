import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import type { Artwork } from '../gallery-data'
import './NetworkVisualization.css'

interface ArtworkNode {
  id: string
  title: string
  lat: number
  lon: number
  origin: string
  material: string
  region: string
  status: string
  dimensions: { region: number; material: number; status: number; usage: number; theory: number }
}

const ORIGIN_TO_COORDS: Record<string, [number, number]> = {
  'Indonesia': [-2.5489, 118.0149],
  'Malaysia': [4.2105, 101.9758],
  'Cambodia': [12.5657, 104.9910],
  'Myanmar': [21.9162, 95.9560],
  'Sri Lanka': [7.8731, 80.7718],
  'Japan': [36.2048, 138.2529],
  'China': [35.8617, 104.1954],
  'India': [20.5937, 78.9629],
  'Pakistan': [30.3753, 69.3451],
  'Africa': [7.5396, 21.7587],
  'Mali': [17.5707, -4.0012],
  'Cameroon': [7.3697, 12.3547],
  'Timor': [-8.8742, 125.7275],
  'Papua': [-6.3149, 143.9555],
  'Solomon': [-8.4095, 160.7072]
}

function getCoords(origin: string): [number, number] {
  for (const [key, coords] of Object.entries(ORIGIN_TO_COORDS)) {
    if (origin.toLowerCase().includes(key.toLowerCase())) {
      return coords
    }
  }
  // Distribute unknowns across globe
  const hash = origin.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return [(hash % 180) - 90, (hash * 7 % 360) - 180]
}

function getMaterialCategory(material: string): string {
  const m = material.toLowerCase()
  if (m.includes('wood') || m.includes('木')) return 'wood'
  if (m.includes('sandstone') || m.includes('砂岩') || m.includes('stone') || m.includes('石')) return 'stone'
  if (m.includes('bronze') || m.includes('青铜') || m.includes('metal') || m.includes('copper') || m.includes('铁') || m.includes('金') || m.includes('银')) return 'metal'
  if (m.includes('ceramic') || m.includes('陶瓷') || m.includes('陶') || m.includes('celadon')) return 'ceramic'
  return 'other'
}

function getUsageCategory(title: string): string {
  const t = (title || '').toLowerCase()
  if (t.includes('buddha') || t.includes('佛') || t.includes('mask') || t.includes('面具')) return 'ritual'
  if (t.includes('figurine') || t.includes('雕像') || t.includes('sculpture') || t.includes('摆件')) return 'decorative'
  if (t.includes('box') || t.includes('盒') || t.includes('bowl') || t.includes('碗')) return 'daily'
  if (t.includes('elephant') || t.includes('象') || t.includes('animal')) return 'animal'
  return 'other'
}

function getTheoryIndex(title: string): number {
  const t = (title || '').toLowerCase()
  if (t.includes('buddha') || t.includes('佛')) return 1
  if (t.includes('mask') || t.includes('面具')) return 2
  if (t.includes('elephant') || t.includes('象')) return 3
  if (t.includes('pair') || t.includes('双人')) return 4
  if (t.includes('wood') || t.includes('木雕')) return 5
  return 0
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

interface Connection {
  from: number
  to: number
  sharedDimensions: number
  types: string[]
  weight: number
}

const DIMENSION_LABELS: Record<string, { zh: string; en: string }> = {
  region: { zh: '同地区', en: 'Region' },
  material: { zh: '同材质', en: 'Material' },
  status: { zh: '同状态', en: 'Status' },
  usage: { zh: '同用途', en: 'Usage' },
  theory: { zh: '同类', en: 'Category' }
}

const DIMENSION_COLORS: Record<string, number> = {
  region: 0xE67E22,    // orange
  material: 0xF39C12,  // amber
  status: 0xD4A84B,    // gold
  usage: 0xC41E3A,     // crimson
  theory: 0x8B5A2B     // bronze
}

export default function WorldMapVisualization({ artworks, locale }: { artworks: Artwork[], locale: 'zh' | 'en' }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{
    scene?: THREE.Scene
    camera?: THREE.PerspectiveCamera
    renderer?: THREE.WebGLRenderer
    globeGroup?: THREE.Group
    linesGroup?: THREE.Group
    nodesGroup?: THREE.Group
    nodeMeshes: THREE.Mesh[]
    isDragging: boolean
    previousMouse: { x: number; y: number }
    rotationVelocity: { x: number; y: number }
    targetZoom: number
  }>({
    isDragging: false,
    previousMouse: { x: 0, y: 0 },
    rotationVelocity: { x: 0, y: 0 },
    targetZoom: 3.5,
    nodeMeshes: []
  })

  const [hoveredNode, setHoveredNode] = useState<ArtworkNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<ArtworkNode | null>(null)
  const [highlightedConnections, setHighlightedConnections] = useState<Set<string>>(new Set())
  const [relatedNodes, setRelatedNodes] = useState<ArtworkNode[]>([])
  const [currentLineLabels, setCurrentLineLabels] = useState<{ connId: string; types: string[]; midPoint: [number, number, number] }[]>([])
  const [hoveredConnection, setHoveredConnection] = useState<{ from: ArtworkNode; to: ArtworkNode; types: string[] } | null>(null)
  const [path, setPath] = useState<ArtworkNode[]>([])

  // Prepare nodes
  const nodes = useMemo<ArtworkNode[]>(() => {
    return artworks.slice(0, 80).map(art => {
      const latLon = getCoords(art.origin || '')
      const material = getMaterialCategory(art.medium || '')
      const usage = getUsageCategory(art.title || '')
      const region = (art as any).region || '其他'
      const status = art.availability || 'unknown'

      return {
        id: art.id,
        title: art.title || art.titleZh || 'Untitled',
        lat: latLon[0],
        lon: latLon[1],
        origin: art.origin || '',
        material,
        region,
        status,
        dimensions: { region: 0, material: 0, status: 0, usage: 0, theory: 0 }
      }
    })
  }, [artworks])

  // Build connections based on shared dimensions
  const connections = useMemo<Connection[]>(() => {
    const conns: Connection[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const types: string[] = []

        if (a.region === b.region && a.region !== '其他') types.push('region')
        if (a.material === b.material && a.material !== 'other') types.push('material')
        if (a.status === b.status) types.push('status')
        if (a.dimensions.usage > 0 && (a.title.toLowerCase().includes('buddha') === b.title.toLowerCase().includes('buddha'))) {
          // shared usage pattern
        }

        if (types.length > 0) {
          conns.push({
            from: i,
            to: j,
            sharedDimensions: types.length,
            types,
            weight: types.length
          })
        }
      }
    }
    return conns
  }, [nodes])

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 560

    // Scene
    const scene = new THREE.Scene()
    scene.background = null

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 3.5)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Globe group (no stand, no rod)
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    // Globe sphere - clean and refined
    const globeGeometry = new THREE.SphereGeometry(1.5, 64, 64)

    // Create a clean, refined earth texture (no rough/clay feel)
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')!

    // Smooth ocean with gradient
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 1024)
    oceanGradient.addColorStop(0, '#0a1a2e')
    oceanGradient.addColorStop(0.5, '#152a45')
    oceanGradient.addColorStop(1, '#0a1a2e')
    ctx.fillStyle = oceanGradient
    ctx.fillRect(0, 0, 2048, 1024)

    // Subtle continent outlines - very clean, minimal
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.25)'
    ctx.lineWidth = 0.8
    ctx.fillStyle = 'rgba(30, 50, 80, 0.4)'

    // Simplified continent silhouettes
    const continents = [
      // North America
      [[350, 250], [500, 240], [580, 280], [600, 380], [540, 470], [480, 500], [400, 470], [350, 400], [330, 320]],
      // South America
      [[500, 580], [560, 560], [600, 620], [610, 720], [580, 820], [540, 880], [490, 850], [470, 750], [480, 640]],
      // Europe
      [[1040, 220], [1100, 200], [1140, 240], [1160, 290], [1130, 330], [1080, 340], [1050, 300], [1030, 260]],
      // Africa
      [[1080, 400], [1150, 380], [1210, 440], [1240, 560], [1210, 680], [1160, 780], [1100, 800], [1070, 700], [1050, 580], [1050, 480]],
      // Asia
      [[1280, 200], [1440, 180], [1620, 200], [1720, 270], [1740, 380], [1700, 440], [1560, 460], [1420, 440], [1320, 380], [1260, 300]],
      // India
      [[1400, 400], [1460, 380], [1500, 420], [1480, 490], [1440, 510], [1400, 470]],
      // SE Asia
      [[1560, 480], [1640, 460], [1680, 500], [1690, 540], [1640, 580], [1580, 580], [1540, 540]],
      // Australia
      [[1680, 700], [1800, 680], [1860, 720], [1860, 780], [1800, 820], [1720, 820], [1680, 780], [1660, 740]],
      // Japan
      [[1820, 320], [1860, 340], [1860, 400], [1820, 420], [1800, 380]]
    ]

    continents.forEach(path => {
      ctx.beginPath()
      ctx.moveTo(path[0][0], path[0][1])
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i][0], path[i][1])
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    })

    // Subtle grid lines (very faint)
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath()
      ctx.moveTo(0, (1024 / 12) * i)
      ctx.lineTo(2048, (1024 / 12) * i)
      ctx.stroke()
    }
    for (let i = 0; i <= 24; i++) {
      ctx.beginPath()
      ctx.moveTo((2048 / 24) * i, 0)
      ctx.lineTo((2048 / 24) * i, 1024)
      ctx.stroke()
    }

    const earthTexture = new THREE.CanvasTexture(canvas)
    const globeMaterial = new THREE.MeshBasicMaterial({
      map: earthTexture,
      transparent: true,
      opacity: 0.85
    })

    const earth = new THREE.Mesh(globeGeometry, globeMaterial)
    globeGroup.add(earth)

    // Soft atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(1.55, 64, 64)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.4, 0.7, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    })
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    globeGroup.add(atmosphere)

    // Star field background
    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 3000
    const starsPositions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i++) {
      const r = 50 + Math.random() * 150
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      starsPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starsPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starsPositions[i * 3 + 2] = r * Math.cos(phi)
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3))
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7
    })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    // Lines group (drawn under nodes)
    const linesGroup = new THREE.Group()
    globeGroup.add(linesGroup)

    // Nodes group
    const nodesGroup = new THREE.Group()
    globeGroup.add(nodesGroup)

    const nodeMeshes: THREE.Mesh[] = []
    const nodePositions: THREE.Vector3[] = []

    // Create nodes - one per artwork
    nodes.forEach((node, idx) => {
      const position = latLonToVector3(node.lat, node.lon, 1.5)
      nodePositions.push(position)

      // Glow halo
      const haloGeometry = new THREE.SphereGeometry(0.025, 16, 16)
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFA940,
        transparent: true,
        opacity: 0.3
      })
      const halo = new THREE.Mesh(haloGeometry, haloMaterial)
      halo.position.copy(position.clone().multiplyScalar(1.005))
      halo.userData = { type: 'halo', index: idx, node }
      nodesGroup.add(halo)

      // Node dot
      const dotGeometry = new THREE.SphereGeometry(0.012, 16, 16)
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFB347  // warm amber
      })
      const dot = new THREE.Mesh(dotGeometry, dotMaterial)
      dot.position.copy(position.clone().multiplyScalar(1.008))
      dot.userData = { type: 'dot', index: idx, node }
      nodesGroup.add(dot)
      nodeMeshes.push(dot)
    })

    // Build connections as curved lines above the surface
    const connectionData: Connection[] = []

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const types: string[] = []

        if (a.region === b.region && a.region !== '其他') types.push('region')
        if (a.material === b.material && a.material !== 'other') types.push('material')
        if (a.status === b.status) types.push('status')

        if (types.length > 0) {
          connectionData.push({
            from: i,
            to: j,
            sharedDimensions: types.length,
            types,
            weight: types.length
          })
        }
      }
    }

    // Limit connections for performance, prefer stronger connections
    connectionData.sort((a, b) => b.sharedDimensions - a.sharedDimensions)
    const limitedConnections = connectionData.slice(0, 500)

    // Draw lines as curved arcs above the surface
    limitedConnections.forEach(conn => {
      const start = nodePositions[conn.from]
      const end = nodePositions[conn.to]

      // Choose color: high-dimension connections use special color
      let color: number
      if (conn.sharedDimensions >= 3) {
        color = 0xFFD700  // gold for high-dimension connections
      } else if (conn.types.includes('region')) {
        color = DIMENSION_COLORS.region
      } else if (conn.types.includes('material')) {
        color = DIMENSION_COLORS.material
      } else {
        color = DIMENSION_COLORS.status
      }

      // Create curve with mid-point elevated above surface
      const midPoint = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(1.5 + 0.15) // elevated arc

      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end)
      const points = curve.getPoints(20)
      const geometry = new THREE.BufferGeometry().setFromPoints(points)

      const opacity = conn.sharedDimensions >= 3 ? 0.6 : 0.2
      const lineWidth = conn.sharedDimensions >= 3 ? 1.5 : 0.8

      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity
      })

      const line = new THREE.Line(geometry, material)
      line.userData = { type: 'line', conn, from: conn.from, to: conn.to }
      linesGroup.add(line)
    })

    // Set initial rotation
    globeGroup.rotation.y = -1.0
    globeGroup.rotation.x = 0.4

    stateRef.current = {
      scene,
      camera,
      renderer,
      globeGroup,
      linesGroup,
      nodesGroup,
      nodeMeshes,
      isDragging: false,
      previousMouse: { x: 0, y: 0 },
      rotationVelocity: { x: 0, y: 0 },
      targetZoom: 3.5
    }

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true
      stateRef.current.previousMouse = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isDragging) {
        const deltaX = e.clientX - stateRef.current.previousMouse.x
        const deltaY = e.clientY - stateRef.current.previousMouse.y

        if (stateRef.current.globeGroup) {
          stateRef.current.globeGroup.rotation.y += deltaX * 0.005
          stateRef.current.globeGroup.rotation.x += deltaY * 0.005
          stateRef.current.globeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, stateRef.current.globeGroup.rotation.x))
        }

        stateRef.current.rotationVelocity.x = deltaY * 0.001
        stateRef.current.rotationVelocity.y = deltaX * 0.005
        stateRef.current.previousMouse = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseUp = () => {
      stateRef.current.isDragging = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stateRef.current.targetZoom += e.deltaY * 0.002
      stateRef.current.targetZoom = Math.max(2.2, Math.min(7, stateRef.current.targetZoom))
    }

    // Hover/click detection
    const raycaster = new THREE.Raycaster()
    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(stateRef.current.nodeMeshes)
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.index
        const node = nodes[idx]
        setHoveredNode(node)
        renderer.domElement.style.cursor = 'pointer'
      } else {
        setHoveredNode(null)
        renderer.domElement.style.cursor = stateRef.current.isDragging ? 'grabbing' : 'grab'
      }
    }

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(stateRef.current.nodeMeshes)
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.index
        const node = nodes[idx]
        setSelectedNode(node)

        // Find all connected nodes and connections
        const connIds = new Set<string>()
        const relatedIndices = new Set<number>()
        const labels: { connId: string; types: string[]; midPoint: [number, number, number] }[] = []

        limitedConnections.forEach(conn => {
          let isConnected = false
          if (conn.from === idx) {
            connIds.add(`${conn.from}-${conn.to}`)
            relatedIndices.add(conn.to)
            isConnected = true
          }
          if (conn.to === idx) {
            connIds.add(`${conn.to}-${conn.from}`)
            relatedIndices.add(conn.from)
            isConnected = true
          }

          // Calculate mid point for label
          if (isConnected) {
            const start = nodePositions[conn.from]
            const end = nodePositions[conn.to]
            const mid = new THREE.Vector3()
              .addVectors(start, end)
              .multiplyScalar(0.5)
              .multiplyScalar(1.3)
            labels.push({
              connId: `${conn.from}-${conn.to}`,
              types: conn.types,
              midPoint: [mid.x, mid.y, mid.z]
            })
          }
        })

        setHighlightedConnections(connIds)
        setRelatedNodes(Array.from(relatedIndices).map(i => nodes[i]))
        setCurrentLineLabels(labels)

        // Add to path if not already
        setPath(prev => {
          if (prev.length === 0 || prev[prev.length - 1].id !== node.id) {
            return [...prev, node]
          }
          return prev
        })
      } else {
        setSelectedNode(null)
        setHighlightedConnections(new Set())
        setRelatedNodes([])
        setCurrentLineLabels([])
      }
    }

    // Touch events
    let lastTouchDist = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        stateRef.current.isDragging = true
        stateRef.current.previousMouse = { x: touch.clientX, y: touch.clientY }
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastTouchDist = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && stateRef.current.isDragging) {
        const touch = e.touches[0]
        const deltaX = touch.clientX - stateRef.current.previousMouse.x
        const deltaY = touch.clientY - stateRef.current.previousMouse.y

        if (stateRef.current.globeGroup) {
          stateRef.current.globeGroup.rotation.y += deltaX * 0.005
          stateRef.current.globeGroup.rotation.x += deltaY * 0.005
          stateRef.current.globeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, stateRef.current.globeGroup.rotation.x))
        }
        stateRef.current.previousMouse = { x: touch.clientX, y: touch.clientY }
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const delta = dist - lastTouchDist
        stateRef.current.targetZoom -= delta * 0.01
        stateRef.current.targetZoom = Math.max(2.2, Math.min(7, stateRef.current.targetZoom))
        lastTouchDist = dist
      }
    }

    const onTouchEnd = () => {
      stateRef.current.isDragging = false
    }

    const onResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      camera.aspect = newWidth / height
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, height)
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.addEventListener('touchstart', onTouchStart)
    renderer.domElement.addEventListener('touchmove', onTouchMove)
    renderer.domElement.addEventListener('touchend', onTouchEnd)
    window.addEventListener('resize', onResize)

    // Animation
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      if (!stateRef.current.isDragging && stateRef.current.globeGroup) {
        stateRef.current.globeGroup.rotation.y += stateRef.current.rotationVelocity.y
        stateRef.current.globeGroup.rotation.x += stateRef.current.rotationVelocity.x
        stateRef.current.globeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, stateRef.current.globeGroup.rotation.x))

        stateRef.current.rotationVelocity.y *= 0.95
        stateRef.current.rotationVelocity.x *= 0.95

        stateRef.current.globeGroup.rotation.y += 0.0008
      }

      // Smooth zoom
      camera.position.z += (stateRef.current.targetZoom - camera.position.z) * 0.05

      // Highlight connections when node selected
      if (stateRef.current.linesGroup && selectedNode) {
        stateRef.current.linesGroup.children.forEach((line: any) => {
          const conn = line.userData.conn
          const isHighlighted = conn.from === selectedNode.id || conn.to === selectedNode.id
          const material = line.material as THREE.LineBasicMaterial
          if (isHighlighted) {
            material.opacity = 0.9
            material.color.setHex(0xFFD700)
          } else {
            material.opacity = 0.05
          }
        })
      } else if (stateRef.current.linesGroup) {
        stateRef.current.linesGroup.children.forEach((line: any) => {
          const conn = line.userData.conn
          const material = line.material as THREE.LineBasicMaterial
          if (conn.sharedDimensions >= 3) {
            material.opacity = 0.5
            material.color.setHex(0xFFD700)
          } else {
            material.opacity = 0.15
            if (conn.types.includes('region')) material.color.setHex(DIMENSION_COLORS.region)
            else if (conn.types.includes('material')) material.color.setHex(DIMENSION_COLORS.material)
            else material.color.setHex(DIMENSION_COLORS.status)
          }
        })
      }

      // Pulse node on hover
      const time = Date.now() * 0.001
      if (stateRef.current.nodesGroup) {
        stateRef.current.nodesGroup.children.forEach((mesh: any) => {
          if (mesh.userData.type === 'halo') {
            const idx = mesh.userData.index
            const node = nodes[idx]
            const isHovered = hoveredNode?.id === node.id || selectedNode?.id === node.id
            const baseScale = isHovered ? 1.8 + Math.sin(time * 4) * 0.4 : 1
            mesh.scale.set(baseScale, baseScale, baseScale)
            ;(mesh.material as THREE.MeshBasicMaterial).opacity = isHovered ? 0.7 : 0.25
          }
        })
      }

      stars.rotation.y += 0.0001

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove', onTouchMove)
      renderer.domElement.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', onResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      globeGeometry.dispose()
      globeMaterial.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
    }
  }, [nodes, hoveredNode, selectedNode])

  if (artworks.length === 0) return null

  const t = locale === 'zh' ? {
    title: '可追踪的关联网络',
    subtitle: 'Tracable Connection Network',
    hint: '🖱️ 拖动旋转 · 滚轮缩放 · 点击节点追踪关联',
    nodes: '节点',
    connections: '连线',
    dimensions: '维度',
    selectedNode: '选中节点',
    noSelection: '点击节点开始追踪关联',
    pieces: '件',
    pathTitle: '追踪路径',
    relatedTitle: '关联文物',
    clearPath: '清空路径',
    sharedLabel: '共享维度',
    traceNext: '点击查看关联'
  } : {
    title: 'Connection Network',
    subtitle: 'Tracable Relationships',
    hint: '🖱️ Drag to rotate · Scroll to zoom · Click nodes to trace',
    nodes: 'Nodes',
    connections: 'Connections',
    dimensions: 'Dimensions',
    selectedNode: 'Selected Node',
    noSelection: 'Click a node to start tracing',
    pieces: 'pcs',
    pathTitle: 'Trace Path',
    relatedTitle: 'Related Artworks',
    clearPath: 'Clear Path',
    sharedLabel: 'Shared',
    traceNext: 'Click to view connections'
  }

  // Navigate to a different node (used by clicking related nodes)
  const navigateToNode = (node: ArtworkNode) => {
    const idx = nodes.findIndex(n => n.id === node.id)
    if (idx < 0) return

    setSelectedNode(node)

    const connIds = new Set<string>()
    const relatedIndices = new Set<number>()
    const labels: { connId: string; types: string[]; midPoint: [number, number, number] }[] = []

    limitedConnections.forEach(conn => {
      let isConnected = false
      if (conn.from === idx) {
        connIds.add(`${conn.from}-${conn.to}`)
        relatedIndices.add(conn.to)
        isConnected = true
      }
      if (conn.to === idx) {
        connIds.add(`${conn.to}-${conn.from}`)
        relatedIndices.add(conn.from)
        isConnected = true
      }

      if (isConnected) {
        const start = nodePositions[conn.from]
        const end = nodePositions[conn.to]
        const mid = new THREE.Vector3()
          .addVectors(start, end)
          .multiplyScalar(0.5)
          .multiplyScalar(1.3)
        labels.push({
          connId: `${conn.from}-${conn.to}`,
          types: conn.types,
          midPoint: [mid.x, mid.y, mid.z]
        })
      }
    })

    setHighlightedConnections(connIds)
    setRelatedNodes(Array.from(relatedIndices).map(i => nodes[i]))
    setCurrentLineLabels(labels)
    setPath(prev => prev.some(n => n.id === node.id) ? prev : [...prev, node])
  }

  const clearPath = () => {
    setPath([])
    setSelectedNode(null)
    setHighlightedConnections(new Set())
    setRelatedNodes([])
    setCurrentLineLabels([])
  }

  return (
    <section className="insights-section map-section network-section">
      <div className="insights-header">
        <h2>{t.title}</h2>
        <p className="insights-subtitle">{t.subtitle}</p>
        <p className="map-hint">{t.hint}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-value">{nodes.length}</div>
          <div className="stat-label">{t.nodes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#FFA940' }}>{connections.length}</div>
          <div className="stat-label">{t.connections}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#FFD700' }}>{connections.filter(c => c.sharedDimensions >= 3).length}</div>
          <div className="stat-label">≥3 {t.dimensions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#E67E22' }}>5</div>
          <div className="stat-label">{t.dimensions}</div>
        </div>
      </div>

      <div className="globe-wrapper">
        <div ref={containerRef} className="globe-container" />

        {hoveredNode && !selectedNode && (
          <div className="node-tooltip">
            <div className="tooltip-dot" />
            <div className="tooltip-content">
              <div className="tooltip-title">{hoveredNode.title}</div>
              <div className="tooltip-origin">{hoveredNode.origin}</div>
            </div>
          </div>
        )}

        {selectedNode && (
          <div className="selected-panel">
            <button className="close-btn" onClick={clearPath}>×</button>
            <div className="selected-title">{selectedNode.title}</div>
            <div className="selected-origin">{selectedNode.origin}</div>
            <div className="selected-meta">
              <div className="meta-row">
                <span className="meta-label">地区</span>
                <span className="meta-value">{selectedNode.region}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">材质</span>
                <span className="meta-value">{selectedNode.material}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">状态</span>
                <span className="meta-value">{selectedNode.status}</span>
              </div>
            </div>
            <div className="selected-count">
              {highlightedConnections.size} {t.connections}
            </div>

            {/* Line Labels */}
            {currentLineLabels.length > 0 && (
              <div className="line-labels-section">
                <div className="labels-title">{t.sharedLabel}</div>
                <div className="line-labels-list">
                  {currentLineLabels.slice(0, 5).map((label, idx) => {
                    const color = label.types.includes('region') ? '#E67E22' :
                                  label.types.includes('material') ? '#F39C12' :
                                  '#D4A84B'
                    return (
                      <div key={idx} className="line-label-item">
                        <span className="line-label-dot" style={{ background: color }} />
                        <span className="line-label-text">
                          {label.types.map(t => DIMENSION_LABELS[t][locale === 'zh' ? 'zh' : 'en']).join(' + ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Related nodes panel */}
        {selectedNode && relatedNodes.length > 0 && (
          <div className="related-panel">
            <div className="related-title">{t.relatedTitle} ({relatedNodes.length})</div>
            <div className="related-list">
              {relatedNodes.slice(0, 10).map(node => (
                <div
                  key={node.id}
                  className="related-item"
                  onClick={() => navigateToNode(node)}
                >
                  <div className="related-item-dot" />
                  <div className="related-item-content">
                    <div className="related-item-title">{node.title}</div>
                    <div className="related-item-origin">{node.origin.split('\n')[0]}</div>
                  </div>
                  <div className="related-item-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedNode && !hoveredNode && (
          <div className="empty-hint">
            {t.noSelection}
          </div>
        )}
      </div>

      {/* Path Display */}
      {path.length > 0 && (
        <div className="path-section">
          <div className="path-header">
            <h3>{t.pathTitle} ({path.length} {locale === 'zh' ? '步' : 'steps'})</h3>
            <button className="clear-path-btn" onClick={clearPath}>{t.clearPath}</button>
          </div>
          <div className="path-list">
            {path.map((node, idx) => (
              <div key={`${node.id}-${idx}`} className="path-item">
                <div className="path-step">
                  <div className="path-step-number">{idx + 1}</div>
                  <div className="path-step-info">
                    <div className="path-step-title">{node.title}</div>
                    <div className="path-step-origin">{node.origin.split('\n')[0]}</div>
                  </div>
                </div>
                {idx < path.length - 1 && (
                  <div className="path-link">
                    <div className="path-link-line" />
                    <div className="path-link-label">
                      {(() => {
                        const currIdx = nodes.findIndex(n => n.id === node.id)
                        const nextIdx = nodes.findIndex(n => n.id === path[idx + 1].id)
                        const conn = limitedConnections.find(c =>
                          (c.from === currIdx && c.to === nextIdx) ||
                          (c.to === currIdx && c.from === nextIdx)
                        )
                        if (conn) {
                          return conn.types.map(type => DIMENSION_LABELS[type][locale === 'zh' ? 'zh' : 'en']).join(' + ')
                        }
                        return ''
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension Legend */}
      <div className="dimension-legend">
        <h3>{t.dimensions}</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-line" style={{ background: '#E67E22' }} />
            <span>{locale === 'zh' ? '同地区' : 'Same Region'}</span>
          </div>
          <div className="legend-item">
            <span className="legend-line" style={{ background: '#F39C12' }} />
            <span>{locale === 'zh' ? '同材质' : 'Same Material'}</span>
          </div>
          <div className="legend-item">
            <span className="legend-line" style={{ background: '#D4A84B' }} />
            <span>{locale === 'zh' ? '同状态' : 'Same Status'}</span>
          </div>
          <div className="legend-item legend-highlight">
            <span className="legend-line legend-gold" />
            <span>{locale === 'zh' ? '≥3 维度（强关联）' : '≥3 Dimensions (Strong)'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}