import * as THREE from 'three';

import '../styles/style.scss';

let scene = null;
let camera = null;
let renderer = null;
let canvas = null;

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
  canvas.style.backgroundColor = 'red';
  updateSizes();
}

const setupScene = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height);
}

const tick = () => {
  
  requestAnimationFrame(tick);
}

const startExperience = () => {

  setupCanvas();
  setupScene();

  tick();

}

startExperience();
