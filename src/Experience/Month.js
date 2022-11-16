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
    this.gradient = data.gradient.reverse()
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
    this.crumbles = []
    this.light

    // Tableau contenant les modèles 3D
    this.models = []

    this.setupLayers()
    this.setupModels()
  }

  setupLayers() {
    const island = getRandomFromArray(SHAPES)
    const islandGeometry = getGeometryFromSVG(island.main)

    const layersCount = Math.ceil(this.height + 5)

    for (let i = layersCount; i > 0; i--) {
      let offset = (layersCount - i) / 400

      let size = this.islandSize + offset

      const material = new THREE.MeshLambertMaterial({
        color: this.DARK_COLORS[i],
        transparent: true,
        opacity: 1,
      })

      const mesh = new THREE.Mesh(islandGeometry, material)

      const pos = {
        x: 2 - offset * 100,
        y: this.position.y,
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

    this.light = new THREE.PointLight(0xff0000, 0, 50)
    this.light.position.set(2, this.position.y, layersCount * 0.5 - 12)
    this.light.castShadow = true
    this.experience.group.add(this.light)

    this.experience.MONTHS.push(this)
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
      element: clone,
    })
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
