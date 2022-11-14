import * as THREE from 'three';
import { Vector3 } from 'three';
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
let wallMesh = null;

let scroll = 0;

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
    canvas,
    antialias: true
  });

}

const setupScene = () => {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
  scene.add(camera);

  camera.position.z = 12;
  camera.position.y = -12;
  camera.rotation.x = 1;

  //new OrbitControls(camera, canvas);

}

const setupLights = () => {

  ambiantLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambiantLight);

}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const ISLANDS_ARRAY = [];

const DARK_COLORS_ARRAY = [
  '#BBBBBB',
  '#AAAAAA',
  '#999999',
  '#888888',
  '#777777',
  '#666666',
  '#555555',
  '#444444',
  '#333333',
  '#222222',
];

class Month {

  constructor(nom, height, position) {

    this.nom = nom;
    this.height = height;
    this.position = position;

    // Tableau contenant tous les plans de l'île
    this.ISLAND_ARRAY = [];

    this.setupIsland();

  }
  
  setupIsland() {

    for(let i=0; i<this.height; i++) {
  
      let size = 5 - i * .15;
  
      const geometry = new THREE.CircleGeometry(size, 20);
      const material = new THREE.MeshBasicMaterial( { color: DARK_COLORS_ARRAY[i] } );
      const mesh = new THREE.Mesh( geometry, material ) ;
      mesh.position.y = this.position;
      mesh.position.z = (i * 0.2) + 0.1;
      scene.add( mesh );
      
      this.ISLAND_ARRAY.push(mesh);
  
    }
      
    ISLANDS_ARRAY.push( this.ISLAND_ARRAY );

  }

  /* 
  const x = 0, y = 0;
  const level1 = new THREE.Shape();
  level1.moveTo( x, y );
  level1.quadraticCurveTo( 1, 1, 2, 2 );
  let extrudeSettings = { depth: .05, bevelEnabled: false };
  */

}

addEventListener('wheel', e => {
  scroll += e.deltaY * 0.01;
  console.log(scroll);
});

const setupWorld = () => {

  const boardSizes = {
    x: 20,
    y: 200
  }

  let boardGeo = new THREE.PlaneGeometry(boardSizes.x, boardSizes.y, boardSizes.x, boardSizes.y);

  let boardMat = new THREE.MeshLambertMaterial({
    color: 0xffffff
  });
  
  boardMesh = new THREE.Mesh(boardGeo, boardMat);
  scene.add(boardMesh);

  new Month('Décembre 2021', 10, 0);
  new Month('Décembre 2021', 5, 25);
  new Month('Décembre 2021', 8, 50);
  new Month('Décembre 2021', 3, 75);

}

const tick = () => {

  renderer.render(scene, camera);

  camera.position.y = scroll;
  
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
