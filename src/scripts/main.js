import * as THREE from "three"
import { BoxGeometry, MeshNormalMaterial, Vector3 } from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader"
import gsap from 'gsap';

import getRandomIntFromInterval from "../utils/getRandomIntFromInterval"

import {
  data,
  months,
  DARK_COLORS,
  FUN_COLORS
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
let raycaster = null
let currentIntersect = null;

// Experience objects
let scroll = 0

const MONTHS_ARRAY = []
const COLLIDERS_ARRAY = []

const sizes = {
  width: 0,
  height: 0,
}

class Month {
  constructor({ month, year, description, deaths, positions }) {
    this.month = month
    this.year = year
    this.description = description
    this.deaths = deaths
    this.height = this.deaths / 2000
    // this.height = 1
    this.positions = positions
    this.scale = 5

    // Tableau contenant tous les plans de l'île
    this.layers = []

    this.setupLayers()
    this.setupCollider()
  }

  setupLayers() {

    let rand = getRandomIntFromInterval(-10, 10);

    for (let i = 0; i < this.height; i++) {

      let offset = i / 200;

      let size = .075 - offset;

      const geometry = getGeometryFromSVG(shape2);

      const material = new THREE.MeshBasicMaterial({
        color: DARK_COLORS[i],
      })
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.y = this.positions.y
      mesh.position.x = - 7 + offset * 100;
      mesh.position.z = i * .5 + 0.1
      //mesh.rotation.z = rand;

      mesh.scale.set(size, size, 0);
      
      scene.add(mesh)

      this.layers.push(mesh)
    }

    MONTHS_ARRAY.push(this);

  }

  setupCollider() {

    const geometry = new BoxGeometry(10, 10, 3)
    const material = new MeshNormalMaterial({
      color: 'red',
      wireframe: true,
      visible: false
    })

    this.collider = new THREE.Mesh(geometry, material)

    this.collider.position.y = this.positions.y
    this.collider.position.z = 2

    COLLIDERS_ARRAY.push(this.collider);
    
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
        positions: {
          x: 0,
          y: index * 50
        }
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

  raycaster = new THREE.Raycaster();

  const rayOrigin = new THREE.Vector3(-3, 0, 0);
  const rayDirection = new THREE.Vector3(10, 0, 0);
  rayDirection.normalize();

  raycaster.set(rayOrigin, rayDirection);

}

let mouse = new THREE.Vector2();

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX / sizes.width * 2 - 1;
  mouse.y = - (e.clientY / sizes.height) * 2 + 1;
});

const checkRaycasterIntersections = () => {

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(COLLIDERS_ARRAY);

  if(intersects.length) {
    canvas.style.cursor = 'pointer';
    currentIntersect = intersects[0];
  } else {
    canvas.style.cursor = 'default';
    currentIntersect = null;
  }
  
}

window.addEventListener('mousedown', e => {

  if(currentIntersect) {
    let meshId = currentIntersect.object.uuid
    let month = MONTHS_ARRAY.filter((el) => el.collider.uuid === meshId)[0]
    
    let i=0;
    for(let layer of month.layers) {
      i++;
      gsap.to(layer.position, {z: i, duration: .1})
      layer.material.color.setHex( FUN_COLORS[i] )
    }

  }

});

const tick = () => {

  renderer.render(scene, camera)

  checkRaycasterIntersections()

  camera.position.y = scroll

  requestAnimationFrame(tick)
  
}

const startExperience = () => {
  setupCanvas()
  setupRenderer()
  setupScene()
  setupLights()
  setupWorld()
  setupRaycaster()

  updateSizes()
  tick()
}

startExperience()

addEventListener("wheel", (e) => {
  scroll += e.deltaY * 0.01
  // console.log(scroll)
})

window.addEventListener("resize", updateSizes)
