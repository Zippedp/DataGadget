import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// var for movement smooth
let targetXOffset = 0;
let moveSpeed = 0.05;
let numberTester = 0;

// create scene
const scene = new THREE.Scene();
// scene.fog = new THREE.Fog( 0x3f7b9d, 1, 20 );
const canvas = document.querySelector('.webgl');

// create renderer
// const renderer = new THREE.WebGLRenderer({ canvas , alpha: true });
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
const loader = new GLTFLoader();
const jarGroup = new THREE.Group();
const cubeGroup = new THREE.Group();
const unitGroup = new THREE.Group();
const BIGGroup = new THREE.Group();
let jar;

const textPlane = createTextPlane('Hello, World!', 'LOL', { x: 0, y: -0.5, z: 1 });
createCubeFrame(20, 0, 0, 0);
unitGroup.add(jarGroup);
unitGroup.add(cubeGroup);
unitGroup.add(textPlane);
BIGGroup.add(unitGroup);
scene.add(BIGGroup);
// scene.add(jarGroup);
// scene.add(cubeGroup);
// scene.add(textPlane);

animate();

// Animation function
function animate() {
  requestAnimationFrame(animate); // Loop the animation function

  // Smoothly move all meshes to the target position
  BIGGroup.position.x += (targetXOffset - BIGGroup.position.x) * moveSpeed;
  cubeGroup.rotation.x += 0.002;
  cubeGroup.rotation.z += 0.002;

  controls.update();
  renderer.render(scene, camera);
}

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
          opacity: 0.2, // Set opacity
        });
        child.receiveShadow = true;
        child.material = glassToonMaterial; // Replace the material of the child object
      }
    });
    jarGroup.add(jar);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);
// add copies of the jar to the scene
function addJarCopies(count, spacing) {
  if (!jar) return;

  for (let i = 1; i <= count; i++) {
    const jarCopy = jar.clone();
    jarCopy.position.set(i * spacing, 0, 0); // Set position of each copy, spacing along the X-axis
    jarGroup.add(jarCopy);
  }
}

function facetedBox(w, h, d, f, isWireframed) { // @author prisoner849

  let hw = w * 0.5, hh = h * 0.5, hd = d * 0.5;
  let vertices = [
      // px
      hw, hh - f, -hd + f,   // 0
      hw, -hh + f, -hd + f,  // 1
      hw, -hh + f, hd - f,   // 2
      hw, hh - f, hd - f,    // 3

      // pz
      hw - f, hh - f, hd,    // 4
      hw - f, -hh + f, hd,   // 5
      -hw + f, -hh + f, hd,  // 6
      -hw + f, hh - f, hd,   // 7

      // nx
      -hw, hh - f, hd - f,   // 8
      -hw, -hh + f, hd - f,  // 9
      -hw, -hh + f, -hd + f, // 10
      -hw, hh - f, -hd + f,  // 11

      // nz
      -hw + f, hh - f, -hd,  // 12
      -hw + f, -hh + f, -hd, // 13
      hw - f, -hh + f, -hd,  // 14
      hw - f, hh - f, -hd,   // 15

      // py
      hw - f, hh, -hd + f,   // 16
      hw - f, hh, hd - f,    // 17
      -hw + f, hh, hd - f,   // 18
      -hw + f, hh, -hd + f,  // 19

      // ny
      hw - f, -hh, -hd + f,  // 20
      hw - f, -hh, hd - f,   // 21
      -hw + f, -hh, hd - f,  // 22
      -hw + f, -hh, -hd + f  // 23
  ];

  let indices = [
      0, 2, 1, 3, 2, 0,
      4, 6, 5, 7, 6, 4,
      8, 10, 9, 11, 10, 8,
      12, 14, 13, 15, 14, 12,
      16, 18, 17, 19, 18, 16,
      20, 21, 22, 23, 20, 22,
      3, 5, 2, 4, 5, 3,
      7, 9, 6, 8, 9, 7,
      11, 13, 10, 12, 13, 11,
      15, 1, 14, 0, 1, 15,
      16, 3, 0, 17, 3, 16,
      17, 7, 4, 18, 7, 17,
      18, 11, 8, 19, 11, 18,
      19, 15, 12, 16, 15, 19,
      1, 21, 20, 2, 21, 1,
      5, 22, 21, 6, 22, 5,
      9, 23, 22, 10, 23, 9,
      13, 20, 23, 14, 20, 13,
      3, 17, 4,
      7, 18, 8,
      11, 19, 12,
      15, 16, 0,
      2, 5, 21,
      6, 9, 22,
      10, 13, 23,
      14, 1, 20
  ];

  let indicesWire = [
      0, 1, 1, 2, 2, 3, 3, 0,
      4, 5, 5, 6, 6, 7, 7, 4,
      8, 9, 9, 10, 10, 11, 11, 8,
      12, 13, 13, 14, 14, 15, 15, 12,
      16, 17, 17, 18, 18, 19, 19, 16,
      20, 21, 21, 22, 22, 23, 23, 20,
      2, 5, 3, 4,
      6, 9, 7, 8,
      10, 13, 11, 12,
      15, 0, 14, 1,
      16, 0, 17, 3,
      17, 4, 18, 7,
      18, 8, 19, 11,
      19, 12, 16, 15,
      20, 1, 21, 2,
      21, 5, 22, 6,
      22, 9, 23, 10,
      23, 13, 20, 14
  ];

  let geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geom.setIndex(isWireframed ? indicesWire : indices);
  if (!isWireframed) geom.computeVertexNormals();
  return geom;
}

function createCubeFrame(inputCount, centerX, centerY, centerZ) {
  const cubeSize = 0.3;
  const gap = 0.02;
  const framePositions = [
    // bottom
    [-1, -1, -1], [0, -1, -1], [1, -1, -1],
    [1, -1, 0], [1, -1, 1], [0, -1, 1],
    [-1, -1, 1], [-1, -1, 0],
    // mid
    [-1, 0, -1], [1, 0, -1],
    [1, 0, 1], [-1, 0, 1],
    // top
    [-1, 1, -1], [0, 1, -1], [1, 1, -1],
    [1, 1, 0], [1, 1, 1], [0, 1, 1],
    [-1, 1, 1], [-1, 1, 0]
  ]; 

  let currentCount = 0; 
  for (let i = 0; i < framePositions.length; i++) {
      if (currentCount >= inputCount) break;

      const [dx, dy, dz] = framePositions[i];
      const x = centerX + dx * (cubeSize + gap);
      const y = centerY + dy * (cubeSize + gap);
      const z = centerZ + dz * (cubeSize + gap);

      // 创建立方体
      const geometry = facetedBox(cubeSize, cubeSize, cubeSize , 0.08, false);
      // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x94848e,
        emissive: 0xff4294,
        sheen: 0.6
      });
      // const material = new THREE.MeshToonMaterial({
      //   color: 0xff4294,
      // });
      const cube = new THREE.Mesh(geometry, material);

      // 设置立方体位置
      cube.position.set(x, y, z);
      // cube.castShadow = true;
      cubeGroup.add(cube);

      currentCount++;
  }
}

// update renderer on window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// keydown events for 3js cam movments
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    targetXOffset += 4;
  } else if (event.key === 'ArrowRight') {
    targetXOffset -= 4;
  } else if (event.key === 'ArrowUp') {
    numberTester += 1;
  } else if (event.key === 'ArrowDown') {
    // numberTester -= 1;
    addJarCopies(5, 4);
  }
});

export function targetOP(opInput){
  if(opInput === 1){
    targetXOffset += 4;
  }else if (opInput === 2) {
    targetXOffset -= 4;
  }
}

function createTextPlane(text_line1, text_line2, position, fontSize = 50, color = '#000000', backgroundColor = '#f7e7dd') {
  // 创建一个Canvas来绘制文本
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // 设置Canvas的尺寸
  canvas.width = 512-128;
  canvas.height = 128;

  // 设置背景颜色
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 设置文本样式
  context.font = `${fontSize}px Arial`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // 绘制文本
  context.fillText(text_line1, canvas.width / 2, canvas.height / 2 - fontSize/2);
  context.fillText(text_line2, canvas.width / 2, canvas.height / 2 + fontSize/2);

  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);

  // 创建材质
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  material.transparent = true;

  // 创建平面几何体
  const geometry = new THREE.PlaneGeometry(0.75, 0.25);

  // 创建Mesh
  const plane = new THREE.Mesh(geometry, material);

  // 设置平面位置
  plane.position.set(position.x, position.y, position.z);

  return plane;
}

function data2Obj(){

}

// const geometry = new THREE.BoxGeometry(1, 1, 1); // Cube geometry
// const material = new THREE.MeshStandardMaterial({ color: 0x00ff83 }); // Basic material, green
// const cube = new THREE.Mesh(geometry, material); // Create mesh object
// cube.castShadow = true;
// cube.position.set(0,1,0);
// scene.add(cube);