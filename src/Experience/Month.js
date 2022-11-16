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

export default class Month {
  constructor({ index, data, position }) {
    this.experience = new Experience()

    this.index = index
    this.data = data
    this.position = position

    this.height = this.data.deaths / 1000
    this.mappedDeaths = mapValueBetween(this.data.deaths, 0, 20000, 6, 10)
    this.islandSize = 0.05
    this.scale = 5
    this.thickness = 0.025
    this.active = false

    this.DARK_COLORS = THEMES.dark.gradient
    this.HAPPY_COLORS = THEMES.happy.gradient.reverse()

    // Tableau contenant tous les plans de l'île
    this.layers = []

    // Tableau contenant les modèles 3D
    this.models = []

    this.setupLayers()
    this.setupModels()
  }

  setupLayers() {
    const islandShape = getRandomFromArray(SHAPES)
    const geometry = getGeometryFromSVG(islandShape)
    const layersCount = Math.ceil(this.height + 3)

    for (let i = layersCount; i > 0; i--) {
      let offset = (layersCount - i) / 400

      let size = this.islandSize + offset

      const material = new THREE.MeshBasicMaterial({
        color: this.DARK_COLORS[i],
        transparent: true,
      })

      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.y = this.position.y
      mesh.position.x = 2 - offset * 100
      mesh.position.z = i * 0.5 - 12

      mesh.scale.set(size, size, this.thickness)

      this.experience.scene.add(mesh)

      this.layers.push(mesh)
    }

    this.experience.MONTHS_ARRAY.push(this)
  }

  setupModels() {
    const treesCount = Math.random() * 4 + 2
    for (let i = 0; i < treesCount; i++) {
      this.addModelFromType("tree")
    }

    const vegetation = Math.random() * 4 + 2
    for (let i = 0; i < treesCount; i++) {
      this.addModelFromType("vegetation")
    }

    // this.addModelFromType("bird")
  }

  addModelFromType(type) {
    let pos = new THREE.Vector3(0, 0, 0)
    pos.x = 7.5 * (Math.random() - 0.5) + this.islandSize * 180
    pos.y = 5 * (Math.random() - 0.5) + this.position.y + 5
    pos.z = 2 * (Math.random() - 0.5) - 2

    // const threshold = 0.2
    // let hasEnoughSpace = true

    // do {
    //   pos.x = 7.5 * (Math.random() - 0.5) + this.islandSize * 180
    //   pos.y = 5 * (Math.random() - 0.5) + this.position.y + 5
    //   pos.z = 2 * (Math.random() - 0.5) - 2

    //   for (const model of this.models) {
    //     const dist = pos.distanceTo(model.element.position)
    //     if (dist < threshold) {
    //       console.log('oups')
    //       console.log(dist)
    //       hasEnoughSpace = false
    //     }
    //   }
    //   console.log('loop!')
    // } while (!hasEnoughSpace)

    let season = this.data.season

    if (!this.experience.MODELS_COLLECTION[season][type]) {
      season = "all"
    }

    const modelsArray = this.experience.MODELS_COLLECTION[season][type]
    console.log(this.experience.MODELS_COLLECTION)
    console.log(season)
    console.log(type)
    console.log(modelsArray)
    const model = getRandomFromArray(modelsArray)

    const clone = model.clone()
    clone.position.x = pos.x
    clone.position.y = pos.y
    clone.position.z = pos.z

    clone.rotation.x = 1.5
    clone.scale.set(0, 0, 0)

    this.experience.scene.add(clone)

    this.models.push({
      z: this.layers[0].position.z + this.thickness * 30,
      element: clone,
    })
  }

  setColorTheme(theme) {
    let i = this.layers.length
    for (let layer of this.layers) {
      i--

      if (theme === "happy") {
        // const seasonalColors = SEASONS[this.index]?.gradient
        const seasonalColors = THEMES[theme].gradient
        layer.material.color.setHex(`0x${seasonalColors[i]?.replace("#", "")}`)
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

    // Animation des models
    for (let model of this.models) {
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
