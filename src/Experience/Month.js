import * as THREE from "three"
import gsap, { Back } from "gsap"

import {
  mapValueBetween,
  getRandomFromArray,
  getGeometryFromSVG,
} from "../utils/index"

import { THEMES } from "../themes"
import { SHAPES } from "../shapes"

import Experience from "./Experience"
import { SphereGeometry } from "three"

export default class Month {
  constructor({ index, data, position }) {
    this.experience = new Experience()

    this.index = index
    this.data = data
    this.gradient = data.gradient.reverse()
    this.position = position

    this.height = this.data.deaths / 1000
    this.mappedDeaths = mapValueBetween(this.data.deaths, 0, 20000, 6, 10)
    this.layersCount = Math.ceil(this.height + 5)
    this.islandSize = 0.05
    this.scale = 5
    this.thickness = 0.025
    this.active = false

    this.DARK_COLORS = THEMES.dark.gradient
    this.HAPPY_COLORS = THEMES.happy.gradient.reverse()

    // Tableau contenant tous les plans de l'île
    this.layers = []
    this.crumbles = []
    this.light

    // Tableau contenant les modèles 3D
    this.models = []

    this.setupLayers()
    this.setupLight()
    this.setupModels()
  }

  setupLayers() {
    const island = SHAPES[this.index]
    const islandGeometry = getGeometryFromSVG(island.main)

    for (let i = this.layersCount; i > 0; i--) {
      let offset = (this.layersCount - i) / 400
      let size = this.islandSize + offset

      const material = new THREE.MeshLambertMaterial({
        color: this.DARK_COLORS[i],
        transparent: true,
        opacity: 1,
      })

      const mesh = new THREE.Mesh(islandGeometry, material)

      const pos = {
        x: 2 - offset * 200 + this.position.x,
        y: this.position.y - offset * 200,
        z: i * 0.5 - 12,
      }

      mesh.position.x = pos.x
      mesh.position.y = pos.y
      mesh.position.z = pos.z
      mesh.scale.set(size, size, this.thickness)

      this.experience.group.add(mesh)
      this.layers.push(mesh)

      if (i < 4) {
        for (const crumble of island.crumbles) {
          const crumbleGeometry = getGeometryFromSVG(crumble)
          const crumbleMesh = new THREE.Mesh(crumbleGeometry, material)

          crumbleMesh.position.x = pos.x
          crumbleMesh.position.y = pos.y
          crumbleMesh.position.z = pos.z
          crumbleMesh.scale.set(size, size, this.thickness)

          this.experience.group.add(crumbleMesh)
          this.crumbles.push(crumbleMesh)
        }
      }
    }

    this.experience.MONTHS.push(this)
  }

  setupLight() {
    this.light = new THREE.PointLight(0xff0000, 0, 50)
    this.light.position.set(2, this.position.y, this.layersCount * 0.5 - 12)
    this.light.castShadow = true
    this.experience.group.add(this.light)
  }

  setupModels() {
    const treesCount = Math.floor(Math.random() * 2 + 2)
    for (let i = 0; i < treesCount; i++) {
      this.addModelFromType("tree")
    }

    const vegetationCount = Math.floor(Math.random() * 4 + 4)
    for (let i = 0; i < vegetationCount; i++) {
      this.addModelFromType("vegetation")
    }

    const cloudsCount = Math.floor(Math.random() * 2 + 2)
    for (let i = 0; i < cloudsCount; i++) {
      this.addModelFromType("cloud")
    }
  }
  addModelFromType(type) {
    let pos = new THREE.Vector3(0, 0, 0)
    // pos.x = 7 * (Math.random() - 0.5) + this.islandSize * 160
    // pos.y = 5 * (Math.random() - 0.5) + this.position.y + 5
    // pos.z = 2 * (Math.random() - 0.5) - 2

    let threshold = 2
    let loopCount = 0
    let hasEnoughSpace = true

    do {
      hasEnoughSpace = true
      loopCount++
      threshold -= 0.1
      if (loopCount > 5) break

      pos.x =
        6 * (Math.random() - 0.5) + this.position.x + this.islandSize * 250
      pos.y = 6 * (Math.random() - 0.5) + this.position.y + 7.5
      pos.z = 2 * (Math.random() - 0.5) - 2

      if (type === "cloud") {
        for (const model of this.clouds) {
          const dist = pos.distanceTo(model.element.position)
          if (dist < threshold) {
            hasEnoughSpace = false
          }
        }
      } else {
        for (const model of this.models.filter(
          (el) => el.type != "vegetation"
        )) {
          const dist = pos.distanceTo(model.element.position)
          if (dist < threshold) {
            // console.log(dist)
            hasEnoughSpace = false
          }
        }
      }

      // console.log("loop!", loopCount)
    } while (!hasEnoughSpace)

    let season = this.data.season

    if (!this.experience.MODELS_COLLECTION[season][type]) {
      season = "all"
    }

    const modelsArray = this.experience.MODELS_COLLECTION[season][type]
    const model = getRandomFromArray(modelsArray)

    const clone = model.clone()
    clone.position.x = pos.x
    clone.position.y = pos.y
    clone.position.z = pos.z

    clone.rotation.x = 1.5
    clone.scale.set(0, 0, 0)

    this.experience.group.add(clone)

    this.models.push({
      z: this.layers[0].position.z + this.thickness * 30,
      type,
      element: clone,
    })

    if (type === "cloud") {
      this.clouds.push({
        z: this.layers[0].position.z + this.thickness * 30,
        element: clone,
        rand: Math.random(),
      })
    }
  }

  animateIsland() {
    for (const cloud of this.clouds) {
      cloud.element.position.z =
        cloud.z + Math.cos(this.experience.time + cloud.rand)
    }
  }

  setColorTheme(theme) {
    let i = this.layers.length
    for (let layer of this.layers) {
      i--

      if (theme === "happy") {
        if (i === 0) {
          layer.material.color.setHex(`0xF5EFDE`)
        } else {
          layer.material.color.setHex(`0x${this.gradient[i]?.replace("#", "")}`)
        }
      } else {
        layer.material.color.setHex(
          `0x${THEMES[theme].gradient[i]?.replace("#", "")}`
        )
      }
    }
  }

  reveal() {
    // console.log(this)
    this.setColorTheme("happy")
    this.light.intensity = 1

    // Animation des models
    for (let model of this.models) {
      // if (model.type === "cloud") continue
      let tl = gsap.timeline()
      tl.addLabel("treeAppear")
      tl.to(
        model.element.scale,
        { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, ease: Back.easeOut },
        "treeAppear"
      )
      tl.to(
        model.element.position,
        { z: model.z, duration: 0.25, ease: Back.easeOut },
        "treeAppear"
      )
      tl.to(
        model.element.rotation,
        { y: 5, duration: 0.25, ease: Back.easeOut },
        "treeAppear"
      )
    }
  }

  darken() {
    this.setColorTheme("dark")
    this.light.intensity = 0

    for (let model of this.models) {
      let tl = gsap.timeline()
      tl.addLabel("treeHide")
      tl.to(
        model.element.scale,
        { x: 0, y: 0, z: 0, duration: 0.5, ease: Back.easeIn },
        "treeHide"
      )
      tl.to(
        model.element.position,
        { z: model.z - 5, duration: 0.5, ease: Back.easeIn },
        "treeHide"
      )
      tl.to(
        model.element.rotation,
        { y: 5, duration: 0.25, ease: Back.easeIn },
        "treeHide"
      )
    }
  }
}
