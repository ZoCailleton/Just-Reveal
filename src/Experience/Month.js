import * as THREE from "three"
import gsap, { Back } from "gsap"

import {
  mapValueBetween,
  getRandomFromArray,
  getGeometryFromSVG
} from '../utils/index'

import { THEMES } from "../themes"
import { SHAPES } from "../shapes.js"

import Experience from "./Experience"

export default class Month {
  constructor({ month, year, description, deaths, position }) {
    this.experience = new Experience()

    this.month = month
    this.year = year
    this.description = description
    this.deaths = deaths
    this.position = position

    this.height = this.deaths / 1000
    this.mappedDeaths = mapValueBetween(this.deaths, 0, 20000, 1, 0.5)
    this.scale = 5
    this.thickness = 0.025
    this.active = false

    this.DARK_COLORS = THEMES.dark.gradient
    this.HAPPY_COLORS = THEMES.happy.gradient.reverse()

    // Tableau contenant tous les plans de l'île
    this.layers = []
    this.topLayer

    // Tableau contenant les modèles 3D
    this.models = []

    this.setupLayers()
    this.setupModels()
  }

  setupLayers() {
    const islandSize =
      Math.floor(mapValueBetween(this.deaths, 0, 20000, 6, 10)) * 0.01
    const islandShape = getRandomFromArray(SHAPES)
    const geometry = getGeometryFromSVG(islandShape)

    for (let i = 0; i < this.height; i++) {
      let offset = i / 400

      let size = islandSize - offset

      const material = new THREE.MeshBasicMaterial({
        color: this.DARK_COLORS[i],
        transparent: true,
      })

      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.y = this.position.y
      mesh.position.x = -7 + offset * 100
      mesh.position.z = i * 0.5 + 0.1

      mesh.scale.set(size, size, this.thickness)

      this.experience.scene.add(mesh)

      this.layers.push(mesh)
    }

    this.experience.MONTHS_ARRAY.push(this)
  }

  setupModels() {
    this.topLayer = this.layers[this.layers?.length - 1]

    const treesCount = Math.random() * 4 + 2
    for (let i = 0; i < treesCount; i++) {
      this.addModelFromArray(this.experience.TREES_ARRAY)
    }

    const vegetation = Math.random() * 4 + 2
    for (let i = 0; i < treesCount; i++) {
      this.addModelFromArray(this.experience.VEGETATION_ARRAY)
    }

    const animalsCount = 1
    for (let i = 0; i < animalsCount; i++) {
      this.addModelFromArray(this.experience.ANIMALS_ARRAY)
    }
  }

  addModelFromArray(array) {
    const pos = {
      x: this.mappedDeaths * 6 * (Math.random() - 0.5),
      y: this.mappedDeaths * 6 * (Math.random() - 0.5),
    }

    const model = getRandomFromArray(array)
    const clone = model.clone()
    clone.position.x = pos.x
    clone.position.y = pos.y + this.position.y + 5
    clone.position.z = this.topLayer?.position.z - 2
    clone.rotation.x = 1.5
    clone.scale.set(0, 0, 0)

    this.experience.scene.add(clone)

    this.models.push({
      z: this.topLayer?.position.z + this.thickness * 30,
      element: clone,
    })
  }

  setTheme(theme) {
    // Animation des layers des îles
    let i = 0
    for (let layer of this.layers) {
      i++
      gsap.to(layer.position, { z: i * 0.5, duration: 0.1, ease: Back.easeOut })
      layer.material.color.setHex(
        `0x${THEMES[theme].gradient[i]?.replace("#", "")}`
      )
    }
  }

  reveal() {
    this.setTheme("happy")

    // Animation des models
    for (let model of this.models) {
      let tl = gsap.timeline()
      tl.addLabel("treeAppear")
      tl.to(
        model.element.scale,
        { x: 1, y: 1, z: 1, duration: 0.5, ease: Back.easeOut },
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
    this.setTheme("dark")

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
