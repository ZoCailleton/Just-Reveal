import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import gsap, { Power2, Back } from "gsap"
import animateScrollTo from "animated-scroll-to"
import { Howl } from "howler"

import { COLORS } from "../colors"
import { MODELS } from "../models"
import { MONTHS_DATA } from "../data"

import Month from "./Month"
import { MeshLambertMaterial, Object3D, SphereGeometry } from "three"
import PointTimeline from "./PointTimeline"
import Card from "./Card"
import { getRandomIntFromInterval, mapValueBetween } from "../utils"

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
    this.particles = []
    this.snowParticles = []

    this.darkGradient = COLORS.gradient.reverse()

    // Experience objects
    this.scroll = 0
    this.cameraX = 0
    this.cameraY = 0
    this.started = false
    this.debug = false
    this.endPoint = 50
    this.scrollDirection = "bottom"
    this.lastScrollTop = 0

    this.time = 0
    this.monthActive = null

    if (window.location.hash.replace("#", "") === "debug") {
      this.debug = true
    }

    this.ambianceSound
    this.bubbleSound
    this.buttonSound

    this.tl = new gsap.timeline()

    this.timelineWrapper = document.querySelector(".timeline")
    this.cardsWrapper = document.querySelector(".cards")

    this.STEP = 50

    this.MONTHS = []
    this.CARDS = []

    this.MODELS_COLLECTION = {}

    this.sizes = {
      width: 0,
      height: 0,
    }

    for (const model of MODELS) {
      this.loadModel(model)
    }

    window.addEventListener("scroll", () => {
      let st = window.pageYOffset || document.documentElement.scrollTop
      if (st > this.lastScrollTop) {
        this.scrollDirection = "bottom"
      } else {
        this.scrollDirection = "top"
      }

      this.lastScrollTop = st <= 0 ? 0 : st

      if (this.started) {
        this.scroll =
          window.scrollY / (document.body.offsetHeight - window.innerHeight)

        //this.cameraX = Math.cos(this.scroll * 100) * 20
        this.cameraY =
          this.scroll *
          (this.MONTHS[this.MONTHS.length - 1]?.position.y + this.endPoint)
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
      src: "./audio/ambiance-1.wav",
      loop: true,
      volume: 0,
    })

    this.bubbleSound = new Howl({
      src: "./audio/bubble-5.wav",
      volume: 0.2,
    })

    this.buttonSound = new Howl({
      src: "./audio/button.wav",
      volume: 0.3,
    })

    this.buttonSound2 = new Howl({
      src: "./audio/button-2.wav",
      volume: 0.1,
    })

    this.bubbleHover = new Howl({
      src: "./audio/bubble-3.wav",
      volume: 0.1,
    })

    this.wooshSound = new Howl({
      src: "./audio/woosh.wav",
      volume: 0.15,
    })

    this.cardSound = new Howl({
      src: "./audio/bubble-4.wav",
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

          if (this.scrollDirection === "bottom") {
            this.monthActive = month
          } else {
            this.monthActive = this.MONTHS[month.index + 1]
          }

          this.positionParticles()

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

    this.renderer.setClearColor(COLORS.background, 1)
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
    this.ambiantLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(this.ambiantLight)
  }

  setupCameraPath() {
    // console.log(this.MONTHS)

    const islandsPos = []

    for (const month of this.MONTHS) {
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
      visible: false,
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

    let point = this.timelineWrapper.querySelector(
      `.timeline .point:nth-child(${index})`
    )

    if (point != undefined) {
      point.classList.add("active")
    }
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

      this.CARDS.push(card)
      this.cardsWrapper.insertAdjacentElement("afterbegin", card)

      let pointTimeline = new PointTimeline(month.name, index + 1)

      pointTimeline.addEventListener('mouseenter', () => {
        this.bubbleHover.play()
      })

      pointTimeline.addEventListener("click", () => {
        let scroll =
          (document.body.offsetHeight / (this.MONTHS.length + 1)) *
            pointTimeline.dataset.index -
          window.innerHeight * 1.1
        //console.log(scroll)
        animateScrollTo(scroll)
      })

      this.timelineWrapper.append(pointTimeline)

      new Month({
        index,
        data: month,
        position: {
          x: Math.cos(index * 100) * 10,
          y: index * this.STEP,
        },
      })

      index++
    }

    this.setupParticles()
    this.setupSnow()
  }

  setupParticles() {
    for (let i = 0; i < 15; i++) {
      const geometry = new THREE.SphereGeometry(Math.random() * 0.2, 25)
      const material = new THREE.MeshBasicMaterial({
        color: 0xeeffa8,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.x = 1000

      this.group.add(mesh)
      this.particles.push({
        rand: Math.random(),
        mesh,
      })
    }
  }

  setupSnow() {
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.11, 25)
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      })
      const mesh = new THREE.Mesh(geometry, material)
      this.group.add(mesh)
      this.snowParticles.push({
        z: mesh.position.z,
        rand: Math.random(),
        mesh,
      })
    }
  }

  positionParticles() {
    if (!this.monthActive) return

    if (this.monthActive.data.season === "winter") {
      for (let particle of this.snowParticles) {
        particle.mesh.position.x = getRandomIntFromInterval(
          this.monthActive.position.x + 10,
          this.monthActive.position.x + 20
        )
        particle.mesh.position.y = getRandomIntFromInterval(
          this.monthActive.position.y + 2,
          this.monthActive.position.y + 12
        )
        particle.mesh.position.z = this.monthActive.layers[0].position.z + 5
      }
    } else {
      for (let particle of this.particles) {
        particle.mesh.position.x = getRandomIntFromInterval(
          this.monthActive.position.x + 8,
          this.monthActive.position.x + 20
        )
        particle.mesh.position.y = getRandomIntFromInterval(
          this.monthActive.position.y + 2,
          this.monthActive.position.y + 20
        )
        particle.mesh.position.z = this.monthActive.layers[0].position.z
      }
    }
  }

  startIntro() {

    if (this.debug) {
      
      let tl = gsap.timeline()
      tl.addLabel("intro")
      tl.to(
        this.camera.position,
        {
          z: this.cameraCurve.getPoint(0).z,
          duration: 0.1,
          ease: Power2.easeInOut,
        },
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
        let i = 0,
          j = 0
        for (let card of document.querySelectorAll(".cards .card")) {
          setTimeout(() => {
            card.classList.add("visible")
            if (j === 11) card.classList.add("active")
            if (j === 10) card.classList.add("prev")
            j++
          }, i * 0)
          i++
        }
      }, 50)

      setTimeout(() => {
        this.MONTHS[0].reveal()
        this.MONTHS[0].active = true
        this.monthActive = this.MONTHS[0]
        this.positionParticles()
      }, 70)

      setTimeout(() => {
        this.started = true
        document.body.style.overflow = "visible"
      }, 100)

    } else {

      let tl = gsap.timeline()
      tl.addLabel("intro")
      tl.to(
        this.camera.position,
        {
          z: this.cameraCurve.getPoint(0).z,
          duration: 1,
          ease: Power2.easeInOut,
        },
        "intro"
      )
      tl.to(
        document.querySelector(".wrapper"),
        { y: "-100vh", duration: 1, ease: Power2.easeInOut },
        "intro"
      )

      setTimeout(() => {
        for (let point of this.timelineWrapper.querySelectorAll(".point")) {
          point.classList.add("visible")
        }
      }, 200)

      setTimeout(() => {
        let i = 0,
          j = 0
        for (let card of document.querySelectorAll(".cards .card")) {
          setTimeout(() => {
            card.classList.add("visible")
            if (j === 11) card.classList.add("active")
            if (j === 10) card.classList.add("prev")
            j++
            this.cardSound.play()
          }, i * 75)
          i++
        }
      }, 500)

      setTimeout(() => {
        this.MONTHS[0].reveal()
        this.MONTHS[0].active = true
        this.monthActive = this.MONTHS[0]
        this.positionParticles()
      }, 700)

      setTimeout(() => {
        this.started = true
        animateScrollTo(600, {
          speed: 3000
        })
        gsap.to(document.querySelector('.screen.experience .background'), {opacity: 0, duration: 1, ease: Power2.easeInOut})
      }, 1100)

      setTimeout(() => {
        this.monthObserver()
      }, 2000)
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

    this.showIntroScreen()

    if (this.debug) {
      this.startIntro()
    } else {
      const cta = document.querySelector(".screen.intro .cta")
      
      cta.addEventListener('mouseover', () => {
        this.buttonSound2.play()
      })
      
      cta.addEventListener("click", () => {
          this.startIntro()
          this.buttonSound.play()
          // this.ambianceSound.play()
          // this.ambianceSound.fade(0, 0.05, 2000)
        })
    }
  }

  showIntroScreen() {
    setTimeout(() => {
      document.querySelector(".screen.intro").classList.add("active")
    }, 1000)
  }

  updateParticles() {
    if (!this.monthActive) return
    if (this.monthActive.data.season === "winter") {
      for (let particle of this.snowParticles) {
        if (particle.mesh.position.z > particle.z - 6) {
          particle.mesh.position.z -= particle.rand * 0.1
        } else {
          particle.mesh.position.z = particle.z - 2
        }
      }
    } else {
      for (let particle of this.particles) {
        const particleSize = mapValueBetween(
          particle.mesh.position.z,
          this.monthActive.layers[0].position.z,
          this.monthActive.layers[0].position.z + 3,
          1,
          0
        )

        particle.mesh.opacity = Math.sin(this.time + particle.rand) * 0.1
        particle.mesh.scale.set(particleSize, particleSize, particleSize)
        if (
          particle.mesh.position.z <
          this.monthActive.layers[0].position.z + 3
        ) {
          particle.mesh.position.z += particle.rand * 0.025
        } else {
          particle.mesh.position.z = this.monthActive.layers[0].position.z
        }
      }
    }
  }

  tick() {
    this.time += 0.01
    this.renderer.render(this.scene, this.camera)

    this.updateCamera()
    this.updateParticles()

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
          //console.log(this.MODELS_COLLECTION)
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
