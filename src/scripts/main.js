import * as THREE from "three"
import { BoxGeometry, MeshNormalMaterial, Vector3 } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader"
import gsap, { Back } from "gsap"

import getRandomIntFromInterval from "../utils/getRandomIntFromInterval"
import getRandomFromArray from "../utils/getRandomFromArray"

import { shape2 } from "../shapes.js"
import { COVID_DATA, MONTHS_WORDING } from "../data"
import { THEMES } from "../themes"
import { MODELS } from "../models.js"

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
let raycaster = null
let currentIntersect = null
let environmentSphere = null

// Experience objects
let scroll = 0

const MONTHS_ARRAY = []
const COLLIDERS_ARRAY = []
const TREES_ARRAY = []

const DARK_COLORS = THEMES.dark.gradient
const HAPPY_COLORS = THEMES.happy.gradient.reverse()

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
    this.height = this.deaths / 1000
    // this.height = 1
    this.position = position
    this.scale = 5
    this.thickness = 0.025

    // Tableau contenant tous les plans de l'île
    this.layers = []

    // Tableau contenant les modèles 3D
    this.models = []

    this.setupLayers()
    this.setupModels()
    this.setupCollider()
  }

  setupLayers() {

    let rand = getRandomIntFromInterval(-10, 10)

    for (let i = 0; i < this.height; i++) {
      let offset = i / 400

      let size = 0.075 - offset

      const geometry = getGeometryFromSVG(shape2)

      const material = new THREE.MeshBasicMaterial({
        color: DARK_COLORS[i],
        transparent: true,
      })
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.y = this.position.y
      mesh.position.x = -7 + offset * 100
      mesh.position.z = i * 0.5 + 0.1

      mesh.scale.set(size, size, this.thickness)

      scene.add(mesh)

      this.layers.push(mesh)
    }

    MONTHS_ARRAY.push(this)
  }

  setupModels() {
    const topLayer = this.layers[this.layers.length - 1]

    for (let i = 0; i < 2; i++) {
      let model = getRandomFromArray(TREES_ARRAY)
      let clone = model.clone()

      clone.position.x = 2 - i * 4
      clone.position.y = this.position.y + 3
      clone.position.z = topLayer?.position.z - 2

      clone.rotation.x = 1.5

      clone.scale.set(0, 0, 0)

      scene.add(clone)

      this.models.push({
        z: topLayer?.position.z + this.thickness * 30,
        element: clone,
      })
    }
  }

  setupCollider() {
    const geometry = new BoxGeometry(15, 15, this.height / 1.5)
    const material = new MeshNormalMaterial({
      color: "red",
      wireframe: true,
      visible: false,
    })

    this.collider = new THREE.Mesh(geometry, material)

    this.collider.position.x = 1
    this.collider.position.y = this.position.y + 6
    this.collider.position.z = this.height / 3

    COLLIDERS_ARRAY.push(this.collider)

    scene.add(this.collider)
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
    alpha: true,
  })
  renderer.setClearColor(THEMES.dark.background, 1)
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
  ambiantLight = new THREE.AmbientLight(THEMES.dark.background)
  scene.add(ambiantLight)
}

const changeEnvironment = (theme) => {

  const targetColor = new THREE.Color(THEMES[theme].background);

  gsap.to(environmentSphere.material.color, {r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: .5});

}

const setupEnvironment = () => {

  const geometry = new THREE.SphereGeometry(175, 100)
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.BackSide
  })
  environmentSphere = new THREE.Mesh(geometry, material)

  scene.add(environmentSphere);

}

const setupWorld = () => {
  let index = 0

  for (const year in COVID_DATA) {
    for (const month in COVID_DATA[year]) {
      new Month({
        month: MONTHS_WORDING[month],
        year: year,
        deaths: COVID_DATA[year][month],
        position: {
          x: 0,
          y: index * 50,
        },
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

const setupRaycaster = () => {
  raycaster = new THREE.Raycaster()

  const rayOrigin = new THREE.Vector3(-3, 0, 0)
  const rayDirection = new THREE.Vector3(10, 0, 0)
  rayDirection.normalize()

  raycaster.set(rayOrigin, rayDirection)
}

let mouse = new THREE.Vector2()

window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / sizes.width) * 2 - 1
  mouse.y = -(e.clientY / sizes.height) * 2 + 1
})

const checkRaycasterIntersections = () => {

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(COLLIDERS_ARRAY)

  if (intersects.length) {
    canvas.style.cursor = "pointer"
    currentIntersect = intersects[0]
  } else {
    canvas.style.cursor = "default"
    currentIntersect = null
  }

}

window.addEventListener("mousedown", (e) => {

  if (currentIntersect) {

    changeEnvironment('happy')
    
    let meshId = currentIntersect.object.uuid
    let month = MONTHS_ARRAY.filter((el) => el.collider.uuid === meshId)[0]

    // Animation des layers des îles
    let i = 0
    for (let layer of month.layers) {
      i++
      gsap.to(layer.position, { z: i * 0.5, duration: 0.1 })
      layer.material.color.setHex(`0x${HAPPY_COLORS[i]?.replace("#", "")}`)
    }

    // Animation des models
    i = 0
    for (let model of month.models) {
      i++
      let tl = gsap.timeline()
      tl.addLabel("tree")
      tl.to(
        model.element.scale,
        { x: 1, y: 1, z: 1, duration: 0.5, ease: Back.easeOut },
        "tree"
      )
      tl.to(
        model.element.position,
        { z: model.z, duration: 0.25, ease: Back.easeOut },
        "tree"
      )
      tl.to(
        model.element.rotation,
        { y: 5, duration: 0.25, ease: Back.easeOut },
        "tree"
      )
    }
  }

})

const tick = () => {

  renderer.render(scene, camera)

  checkRaycasterIntersections()

  let y = scroll * MONTHS_ARRAY[MONTHS_ARRAY.length-1].position.y

  camera.position.y = y
  environmentSphere.position.y = y

  requestAnimationFrame(tick)
  
}

const loadModel = (model) => {

  const loader = new GLTFLoader()

  loader.load(
    `./models/${model.filename}.gltf`,
    function (gltf) {
      TREES_ARRAY.push(gltf.scene)
      model.loaded = true

      if (MODELS.filter((el) => !el.loaded).length === 0) {
        startExperience()
      }
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
    },
    function (error) {
      console.log("An error happened")
    }
  )

}

const loadExperience = () => {
  for (const model of MODELS) {
    loadModel(model)
  }
}

const startExperience = () => {

  setupCanvas()
  setupRenderer()
  setupScene()
  setupLights()
  setupEnvironment();
  setupWorld()
  setupRaycaster()

  updateSizes()
  tick()

}

loadExperience()

const monthObserver = () => {
  
}

window.addEventListener('scroll', () => {
  scroll = window.scrollY / (document.body.offsetHeight - window.innerHeight)
  monthObserver();
});

window.addEventListener("resize", updateSizes)
