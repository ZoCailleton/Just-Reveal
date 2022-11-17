import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import gsap, { Power2, Back } from "gsap"
import animateScrollTo from 'animated-scroll-to'
import { Howl } from "howler"

import { THEMES } from "../themes"
import { MODELS } from "../models"
import { MONTHS_DATA } from "../data"

import Month from "./Month"
import { Object3D } from "three"
import PointTimeline from "./PointTimeline"
import Card from "./Card"
import { GUI } from "dat.gui"

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
    this.cameraCurve
    this.cameraPath
    this.cameraKeyframes

    // Experience objects
    this.scroll = 0
    this.cameraX = 0
    this.cameraY = 0
    this.started = false
    this.debug = false
    this.endPoint = 50

    this.time = 0
    this.monthActive = null

    if (window.location.hash.replace("#", "") === "debug") {
      this.debug = true
    }

    this.gui = new GUI()

    this.ambianceSound
    this.bubbleSound

    this.tl = new gsap.timeline()

    this.timelineWrapper = document.querySelector(".timeline")
    this.cardsWrapper = document.querySelector(".cards")

    this.STEP = 50

    this.MONTHS = []
    this.CARDS = []

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

    window.addEventListener("scroll", () => {
      if (this.started) {
        this.scroll =
          window.scrollY / (document.body.offsetHeight - window.innerHeight)

        //this.cameraX = Math.cos(this.scroll * 100) * 20
        this.cameraY =
          this.scroll * (this.MONTHS[this.MONTHS.length - 1]?.position.y + this.endPoint)
        this.monthObserver()
      }
    })

    window.addEventListener("resize", () => {
      this.updateSizes()
    })

    this.setupIntro()
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

  setupIntro() {
    const headingElt = document.querySelector(".screen.intro .heading")
    const headingText = headingElt.textContent
    headingElt.innerHTML = ""

    let i = 0
    for (let word of headingText.split(" ")) {
      const worldElt = document.createElement("span")
      worldElt.classList.add("word")
      for (let letter of word.split("")) {
        i++
        const letterElt = document.createElement("span")
        letterElt.classList.add("letter")
        letterElt.style.animationDelay = `${i * 50 + 500}ms`
        letterElt.innerHTML = letter
        worldElt.append(letterElt)
      }
      headingElt.append(worldElt)
    }
  }

  setupAudio() {
    this.ambianceSound = new Howl({
      src: "./audio/ambiance.wav",
      loop: true,
      volume: 0.1,
    })

    this.bubbleSound = new Howl({
      src: "./audio/bubble-1.wav",
      volume: 0.1,
    })
  }

  monthObserver() {
    const ACTIVE_STEP = this.STEP * 0.9

    for (let month of this.MONTHS) {
      if (
        this.cameraY > month.position.y - ACTIVE_STEP * 0.1 &&
        this.cameraY < month.position.y + ACTIVE_STEP * 2
      ) {
        this.updateTimeline(month.index + 1)
        this.updateCards(month.index + 1)

        if (!month.active) {
          this.bubbleSound.play()

          month.reveal()

          month.active = true
          this.monthActive = month
        }
      } else {
        if (month.active) {
          month.active = false
          this.monthActive = null

          month.darken()
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

    this.scene.fog = new THREE.Fog(0xfbf8ef, 0, 150)

    this.camera.position.x = 10
    this.camera.position.z = 30

    this.camera.rotation.x = 0.8

    this.group = new Object3D()
    this.group.position.x = -4
    this.scene.add(this.group)

    // new OrbitControls(this.camera, this.canvas);
  }

  setupLights() {
    this.ambiantLight = new THREE.AmbientLight(THEMES.dark.background)
    this.scene.add(this.ambiantLight)
  }

  setupCameraPath() {
    // console.log(this.MONTHS)

    const islandsPos = []

    console.log(this.MONTHS)

    for (const month of this.MONTHS) {
      console.log(month)
      islandsPos.push(
        new THREE.Vector3(
          month.position.x + 15,
          month.position.y - 30,
          month.layersCount - 5
        )
      )
    }

    islandsPos.push(
      new THREE.Vector3(
        this.MONTHS[this.MONTHS.length - 1].position.x + 15,
        this.MONTHS[this.MONTHS.length - 1].position.y + this.endPoint,
        this.MONTHS[this.MONTHS.length - 1].layersCount - 3
      )
    )

    this.cameraCurve = new THREE.CatmullRomCurve3(islandsPos)

    const points = this.cameraCurve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    })

    // Create the final object to add to the scene
    this.cameraPath = new THREE.Line(geometry, material)
    this.scene.add(this.cameraPath)
  }

  updateCamera() {
    const t1 = this.scroll
    // const t2 = this.scroll + 0.1

    // console.log(this.cameraCurve.getPoint(t1))

    const position = this.cameraCurve.getPoint(t1)
    // const rotation = this.cameraCurve.getTangent(t1)

    this.camera.position.x = position.x
    this.camera.position.y = position.y
    this.camera.position.z = position.z

    this.camera.rotation.x = 1.2 - position.z * 0.01
    // this.camera.lookAt(this.cameraCurve.getPoint(t2))

    this.environmentSphere.position.y = this.camera.position.y
  }

  updateTimeline(index) {
    for (let point of document.querySelectorAll(".timeline .point")) {
      point.classList.remove("active")
    }

    this.timelineWrapper
      .querySelector(`.timeline .point:nth-child(${index})`)
      ?.classList.add("active")
  }

  updateCards(index) {
    let i = 0

    for (let card of this.CARDS) {
      if (i < index - 1) {
        card.classList.add("hidden")
      } else {
        card.classList.remove("hidden")
      }

      card.classList.remove("active", "prev")

      i++
    }

    this.CARDS[index - 1]?.classList.add("active")
    this.CARDS[index]?.classList.add("prev")
  }

  setupEnvironment() {
    const geometry = new THREE.SphereGeometry(150, 100)
    const material = new THREE.MeshLambertMaterial({
      color: 0xfbf8ef,
      side: THREE.BackSide,
    })
    this.environmentSphere = new THREE.Mesh(geometry, material)

    this.group.add(this.environmentSphere)
    // this.scene.add(this.environmentSphere)
  }

  setupWorld() {
    let index = 0

    for (const month of MONTHS_DATA) {
      let card = new Card({
        month: month.name,
        title: month.title,
        image: month.image,
        description: month.description,
      })

      if (index === 0) card.classList.add("active")

      if (index === 1) card.classList.add("prev")

      this.CARDS.push(card)
      this.cardsWrapper.insertAdjacentElement("afterbegin", card)

      let pointTimeline = new PointTimeline(month.name, index + 1)

      pointTimeline.addEventListener("click", () => {
        let scroll = (document.body.offsetHeight / this.MONTHS.length) * pointTimeline.dataset.index
        console.log(scroll)
        animateScrollTo(scroll)
      })

      this.timelineWrapper.append(pointTimeline)

      new Month({
        index,
        data: month,
        position: {
          x: Math.cos(index*100) * 10,
          y: index * this.STEP,
        },
      })

      index++
    }
  }

  startIntro() {
    if (this.debug) {
      this.camera.position.z = 8
      this.started = true
      document.querySelector(".wrapper").style.transform = "translateY(-100vh)"
    } else {
      let tl = gsap.timeline()
      tl.addLabel("intro")
      tl.to(
        this.camera.position,
        { z: 8, duration: 0.1, ease: Power2.easeInOut },
        "intro"
      )
      tl.to(
        document.querySelector(".wrapper"),
        { y: "-100vh", duration: 0.1, ease: Power2.easeInOut },
        "intro"
      )

      setTimeout(() => {
        for (let point of this.timelineWrapper.querySelectorAll(".point")) {
          point.classList.add("visible")
        }
      }, 20)

      setTimeout(() => {
        this.MONTHS[0].reveal()
      }, 70)

      setTimeout(() => {
        this.started = true
        document.body.style.overflow = "visible"
      }, 100)
    }
  }

  start() {
    this.setupCanvas()
    this.setupRenderer()
    this.setupScene()
    this.setupLights()
    this.setupEnvironment()
    this.setupWorld()
    this.setupAudio()
    this.setupCameraPath()

    this.updateSizes()
    this.tick()

    if (this.debug) {
      this.startIntro()
    } else {
      // Remove after
      this.startIntro()
      document
        .querySelector(".screen.intro .cta")
        .addEventListener("click", () => {
          this.startIntro()
        })
    }
  }

  tick() {
    this.time += 0.01
    this.renderer.render(this.scene, this.camera)

    this.updateCamera()

    if (this.monthActive) {
      this.monthActive.animateIsland()
    }

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
          console.log(this.MODELS_COLLECTION)
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
