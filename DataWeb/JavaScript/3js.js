import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// var for movement smooth
let targetXOffset = 0;
let moveSpeed = 0.05;

// create scene
const scene = new THREE.Scene();
const canvas = document.querySelector('.webgl');

// create renderer
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xeeeeee, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// create camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

// init orbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

// add lights
const ambientLight = new THREE.AmbientLight(0x404040, 2); // for light up everything
const light = new THREE.PointLight(0xffffff, 13, 100); // for light up selected one
light.position.set(1.5, 2, 2);
light.castShadow = true;
scene.add(light);
scene.add(ambientLight);

// load GLTF model
let jar;
const loader = new GLTFLoader();
loader.load(
  '../Res/test_2.gltf',
  function (gltf) {
    jar = gltf.scene;
    jar.traverse((child) => {
      if (child.isMesh) {
        // Create and apply MeshToonMaterial material
        const glassToonMaterial = new THREE.MeshToonMaterial({
          color: 0xb1d8ec, // Base color (light blue)
          transparent: true, // Allow transparency
          opacity: 0.5, // Set opacity
        });
        child.receiveShadow = true;
        child.material = glassToonMaterial; // Replace the material of the child object
      }
    });
    scene.add(jar);
    addJarCopies(5, 4);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// create cube
const geometry = new THREE.BoxGeometry(1, 1, 1); // Cube geometry
const material = new THREE.MeshStandardMaterial({ color: 0x00ff83 }); // Basic material, green
const cube = new THREE.Mesh(geometry, material); // Create mesh object
cube.castShadow = true;
scene.add(cube); // Add cube to the scene

// add copies of the jar to the scene
function addJarCopies(count, spacing) {
  if (!jar) return;

  for (let i = 1; i <= count; i++) {
    const jarCopy = jar.clone();
    jarCopy.position.set(i * spacing, 0, 0); // Set position of each copy, spacing along the X-axis
    scene.add(jarCopy);
  }
}

// Animation function
function animate() {
  requestAnimationFrame(animate); // Loop the animation function

  // Smoothly move all meshes to the target position
  scene.traverse((child) => {
    if (child.isMesh) {
      child.position.x += (targetXOffset - child.position.x) * moveSpeed;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

// start animation
animate();