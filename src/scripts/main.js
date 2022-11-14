import * as THREE from "three"
import { Vector3 } from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader"

import getRandomIntFromInterval from "../utils/getRandomIntFromInterval"

import {
  data,
  months,
  DARK_COLORS_ARRAY
} from "../data"

import {
  shape2
} from "../shapes.js"

import "../styles/style.scss"

/**
 * TODO :
 * - Mouse lerp
 * - Scroll lerp
 * - Add tiles
 * - Add UI
 */

// Three objects
let scene = null
let camera = null
let renderer = null
let canvas = null
let ambiantLight = null

// Experience objects
let scroll = 0

const MONTHS_ARRAY = []

const sizes = {
  width: 0,
  height: 0,
}

class Month {
  constructor({ month, year, description, deaths, position }) {
    this.month = month
    this.year = year
    this.description = description
    this.deaths = deaths
    this.height = this.deaths / 2000
    // this.height = 1
    this.position = position
    this.scale = 5

    // Tableau contenant tous les plans de l'île
    this.MONTH_ARRAY = []

    this.setupLayers()
  }

  setupLayers() {

    for (let i = 0; i < this.height; i++) {

      let offset = i / 1000;

      let size = .05 - offset;

      const geometry = getGeometryFromSVG(shape2);

      const material = new THREE.MeshBasicMaterial({
        color: DARK_COLORS_ARRAY[i],
      })
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.y = this.position
      mesh.position.x = -4
      mesh.position.z = i * 1 + 0.1

      mesh.scale.set(size, size, 0);
      
      scene.add(mesh)

      this.MONTH_ARRAY.push(mesh)
    }

    MONTHS_ARRAY.push(this.MONTH_ARRAY)

  }
}

const updateSizes = () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  canvas.width = sizes.width
  canvas.height = sizes.height

  canvas.style.width = sizes.width
  canvas.style.height = sizes.height

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

const setupCanvas = () => {
  canvas = document.getElementById("webgl")
}

const setupRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setClearColor(0xffffff, 1);
}

const setupScene = () => {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 200)
  scene.add(camera)

  camera.position.z = 12
  camera.position.y = -12
  camera.rotation.x = 1

  // new OrbitControls(camera, canvas);
}

const setupLights = () => {
  ambiantLight = new THREE.AmbientLight(0xffffff)
  scene.add(ambiantLight)
}

const setupWorld = () => {

  let index = 0

  for (const year in data) {
    for (const month in data[year]) {

      new Month({
        month: months[month],
        year: year,
        deaths: data[year][month],
        position: index * 25,
      })

      index++
    }
  }
}

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

const tick = () => {
  renderer.render(scene, camera)

  camera.position.y = scroll

  requestAnimationFrame(tick)
}

const startExperience = () => {
  setupCanvas()
  setupRenderer()
  setupScene()
  setupLights()
  setupWorld()

  updateSizes()
  tick()
}

startExperience()

addEventListener("wheel", (e) => {
  scroll += e.deltaY * 0.01
  // console.log(scroll)
})

window.addEventListener("resize", updateSizes)
