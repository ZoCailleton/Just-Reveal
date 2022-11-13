import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import '../styles/style.scss';

/**
 * TODO :
 * - Add wall mesh
 * - Mouse lerp
 * - Add tiles
 * - Add UI
 */

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

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}

window.addEventListener('resize', updateSizes);

const setupCanvas = () => {

  canvas = document.getElementById('webgl');

}

const setupRenderer = () => {

  renderer = new THREE.WebGLRenderer({
    canvas
  });

}

const setupScene = () => {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
  scene.add(camera);

  camera.position.z = 12;
  camera.position.y = -12;

  new OrbitControls(camera, canvas);

}

const setupLights = () => {

  ambiantLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambiantLight);

}

const setupWorld = () => {

  const boardSizes = {
    x: 30,
    y: 20
  }

  let geo = new THREE.PlaneGeometry(boardSizes.x, boardSizes.y, boardSizes.x, boardSizes.y);

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
  setupRenderer();
  setupScene();
  setupLights();
  setupWorld();

  updateSizes();

  tick();

}

startExperience();
