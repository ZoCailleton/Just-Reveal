import * as THREE from 'three';

import '../styles/style.scss';

let scene = null;
let camera = null;
let renderer = null;
let canvas = null;
let ambiantLight = null;
let boardMesh = null;

const sizes = {
  width: 0,
  height: 0
}

const updateSizes = () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  canvas.width = sizes.width;
  canvas.height = sizes.height;
  canvas.style.width = sizes.width;
  canvas.style.height = sizes.height;
}

window.addEventListener('resize', updateSizes);

const setupCanvas = () => {

  canvas = document.getElementById('webgl');
  updateSizes();
  
}

const setupScene = () => {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();

}

const setupLights = () => {

  ambiantLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambiantLight);

}

const setupWorld = () => {

  let geo = new THREE.BoxGeometry(2, 2, 2);

  let mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true
  });
  
  boardMesh = new THREE.Mesh(geo, mat);
  scene.add(boardMesh);

}

const tick = () => {

  renderer.render(scene, camera);
  
  requestAnimationFrame(tick);

}

const startExperience = () => {

  setupCanvas();
  setupScene();
  setupLights();
  setupWorld();

  tick();

}

startExperience();
