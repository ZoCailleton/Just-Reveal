import * as THREE from 'three'
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader"

const getGeometryFromSVG = (shape) => {

  let shapes = []

  const loader = new SVGLoader()
  const svgData = loader.parse(shape)

  svgData.paths.forEach((path, i) => {
    shapes = path.toShapes(true)
  })

  const geometry = new THREE.ExtrudeGeometry(shapes[0], {
    depth: 20,
    bevelEnabled: false,
  })

  return geometry

}

export default getGeometryFromSVG
