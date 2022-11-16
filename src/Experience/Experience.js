import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import gsap from "gsap"

import { THEMES } from "../themes"
import { MODELS } from "../models"
import { MONTHS_DATA } from "../data"

import Month from "./Month"

let instance = null

export default class Experience {
  constructor() {
    if (instance != null) {
      return instance
    }

    instance = this

    // Three objects
    this.scene
    this.camera
    this.renderer
    this.canvas
    this.ambiantLight
    this.environmentSphere

    // Experience objects
    this.scroll = 0
    this.cameraX = 0
    this.cameraY = 0

    this.STEP = 50

    this.MONTHS_ARRAY = []

    this.MODELS_COLLECTION = {}

    this.DARK_COLORS = THEMES.dark.gradient.reverse()
    this.HAPPY_COLORS = THEMES.happy.gradient.reverse()

    this.sizes = {
      width: 0,
      height: 0,
    }

    for (const model of MODELS) {
      this.loadModel(model)
    }

    const cursor = document.querySelector(".timeline .cursor")

    window.addEventListener("scroll", () => {
      this.scroll =
        window.scrollY / (document.body.offsetHeight - window.innerHeight)

      cursor.style.left = `${this.scroll * 100}%`

      //cameraX = Math.cos(scroll * 100) * 20
      this.cameraY =
        this.scroll *
        this.MONTHS_ARRAY[this.MONTHS_ARRAY.length - 1]?.position.y
      this.monthObserver()
    })

    window.addEventListener("resize", () => {
      this.updateSizes()
    })
  }

  updateSizes() {
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    this.canvas.width = this.sizes.width
    this.canvas.height = this.sizes.height

    this.canvas.style.width = this.sizes.width
    this.canvas.style.height = this.sizes.height

    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  monthObserver() {
    const ACTIVE_STEP = this.STEP * 0.9

    for (let month of this.MONTHS_ARRAY) {
      if (
        this.cameraY > month.position.y - ACTIVE_STEP / 2 &&
        this.cameraY < month.position.y + ACTIVE_STEP / 2
      ) {
        if (!month.active) {
          month.reveal()

          month.active = true

          this.changeEnvironment("happy")

          document.querySelector(".infos .month").innerHTML =
            month.month + " " + month.year
          document.querySelector(".infos .covid-cases").innerHTML = month.deaths
          document.querySelector(".infos .description").innerHTML =
            month.description
        }
      } else {
        if (month.active) {
          month.active = false

          month.darken()

          this.changeEnvironment("dark")
        }
      }
    }
  }

  setupCanvas() {
    this.canvas = document.getElementById("webgl")
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    })

    this.renderer.setClearColor(THEMES.dark.background, 1)
  }

  setupScene() {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      200
    )
    this.scene.add(this.camera)

    this.camera.position.x = 10
    this.camera.position.z = 12
    this.camera.rotation.x = 1

    // new OrbitControls(this.camera, this.canvas);
  }

  setupLights() {
    this.ambiantLight = new THREE.AmbientLight(THEMES.dark.background)
    this.scene.add(this.ambiantLight)
  }

  changeEnvironment(theme) {
    const targetColor = new THREE.Color(THEMES[theme].background)

    gsap.to(this.environmentSphere.material.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.5,
    })
  }

  setupEnvironment() {
    const geometry = new THREE.SphereGeometry(175, 100)
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
    })
    this.environmentSphere = new THREE.Mesh(geometry, material)

    this.scene.add(this.environmentSphere)
  }

  setupWorld() {
    let index = 0

    for (const month of MONTHS_DATA) {
      new Month({
        index,
        data: month,
        position: {
          x: 0,
          y: index * this.STEP,
        },
      })

      index++
    }
  }

  start() {
    this.setupCanvas()
    this.setupRenderer()
    this.setupScene()
    this.setupLights()
    this.setupEnvironment()
    this.setupWorld()

    this.updateSizes()
    this.tick()
  }

  tick() {
    this.renderer.render(this.scene, this.camera)

    //camera.position.x = cameraX
    // on démarre 1/2 step avant le début pour bien voir janvier
    this.camera.position.y = this.cameraY - this.STEP / 2

    this.environmentSphere.position.x = this.cameraX
    this.environmentSphere.position.y = this.cameraY

    requestAnimationFrame(() => {
      this.tick()
    })
  }

  loadModel(model) {
    const loader = new GLTFLoader()

    loader.load(
      `./models/${model.filename}.gltf`,
      (gltf) => {

        if (!this.MODELS_COLLECTION[model.season]) {
          this.MODELS_COLLECTION[model.season] = {}
        }

        if (!this.MODELS_COLLECTION[model.season][model.type]) {
          this.MODELS_COLLECTION[model.season][model.type] = []
        }

        this.MODELS_COLLECTION[model.season][model.type].push(gltf.scene)

        model.loaded = true

        if (MODELS.filter((el) => !el.loaded).length === 0) {
          this.start()
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
}
