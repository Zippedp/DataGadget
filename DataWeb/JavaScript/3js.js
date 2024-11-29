import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {totalKeys_1, totalValues_1_2num, data_is_loaded} from '../JavaScript/ble.js'

// if(data_is_loaded && need_init){
//   need_init = false;
//   handleData(totalKeys_1, totalValues_1_2num);
//   BIGGroup.add(unitOne);
//   scene.add(BIGGroup);
// }
// var for movement smooth
let targetXOffset = 0;
let moveSpeed = 0.05;
let numberTester = 0;
let cubeIndex = 0;

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
camera.position.y = 0.6;

// init orbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// controls.enablePan = false;

// add lights
const ambientLight = new THREE.AmbientLight(0x404040, 2); // for light up everything
const light = new THREE.PointLight(0xffffff, 13, 100); // for light up selected one
light.position.set(1.5, 2, 2);
light.castShadow = true;
scene.add(light);
scene.add(ambientLight);

// load GLTF model
const loader = new GLTFLoader();
const cubeGroup = [];
const unitOne = new THREE.Group();
const BIGGroup = new THREE.Group();
let colorPalette = [];
let uniqueKeys = [];
let clearGroupIndexArray = [];
let need_init = true;
let jarIndex_test = 0;
let jar;

const noise3D = createNoise3D();

const allKeys = [
  ['testA', 'testB', 'testC','runtime'],
  ['A', 'B', 'C','runtime'],
  ['t23', '*(&s', 'lol','runtime'],
  ['testA', 'testB', 'testC','runtime'],
  ['A', 'B', 'C','runtime'],
  ['t23', '*(&s', 'lol','runtime']
];
const allValues = [
  [10, 20, 11, 206],
  [12, 5, 11, 20600],
  [12, 25, 11, 20600],
  [10, 20, 11, 206],
  [12, 5, 11, 20600],
  [12, 25, 11, 20600]
];

animate();

// Animation function
function animate() {
  const time = performance.now();
  if(data_is_loaded && need_init){
    need_init = false;
    scene.remove(jar);
    handleData(totalKeys_1, totalValues_1_2num);
    BIGGroup.add(unitOne);
    scene.add(BIGGroup);
    console.log(totalKeys_1, totalValues_1_2num);
  }
  requestAnimationFrame(animate); // Loop the animation function

  // Smoothly move all meshes to the target position
  BIGGroup.position.x += (targetXOffset - BIGGroup.position.x) * moveSpeed;
  // cubeGroup.rotation.x += 0.002;
  // cubeGroup.rotation.z += 0.002;
  var clearGroupIndex = 0;
  var indexTemp = 0;

  cubeGroup.forEach((groupC, index) => {
    if(indexTemp >= clearGroupIndexArray[clearGroupIndex]){
      clearGroupIndex += 1;
      indexTemp = 0;
    }
    indexTemp += 1;
    groupC.rotation.x += (0.002 + noise3D(clearGroupIndex ,time/1000 , index/100)/1000);
    groupC.rotation.y += (0.002 + noise3D(clearGroupIndex ,time/1000 , index/100)/1000);
    groupC.position.y += Math.sin(time/1000 + clearGroupIndex)/1500;
  });

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
    scene.add(jar);

    // handleData(allKeys, allValues);
    // BIGGroup.add(unitOne);
    // scene.add(BIGGroup);
    // console.log(cubeGroup.length);

  },
  function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
  function (error) {
    console.error(error);
  }
);

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

function createCubeFrame(positionIndex, centerX, centerY, centerZ, targetGroup, inputcolor=0xff4294) {
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

  const [dx, dy, dz] = framePositions[positionIndex];
  const x = centerX + dx * (cubeSize + gap);
  const y = centerY + dy * (cubeSize + gap);
  const z = centerZ + dz * (cubeSize + gap);

  const geometry = facetedBox(cubeSize, cubeSize, cubeSize , 0.08, false);

  const color2 = calculateMatchingColor(inputcolor, 0xff4294, 0x94848e)
  const material = new THREE.MeshPhysicalMaterial({
    color: color2,
    emissive: inputcolor,
    sheen: 0.6
  });

  const cubeChamfered = new THREE.Mesh(geometry, material);
  cubeChamfered.position.set(x, y, z);
  // cube.castShadow = true;
  targetGroup.add(cubeChamfered);
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
  }
});

export function targetOP(opInput){
  if(opInput === 1){
    targetXOffset += 4;
  }else if (opInput === 2) {
    targetXOffset -= 4;
  }
}

function createTextPlane(text_lines, position, fontSize = 50, color = '#000000', backgroundColor = '#f7e7dd') {
  // 创建一个Canvas来绘制文本
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // 设置Canvas的尺寸
  canvas.width = 512-128;
  canvas.height = 256;

  // 设置背景颜色
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 设置文本样式
  context.font = `${fontSize}px Arial`;
  context.fillStyle = color;
  context.textAlign = 'left';
  context.textBaseline = 'middle';

  // 绘制文本，起始位置在左侧
  const padding = 20; // 添加一些内边距
  text_lines.forEach((line, index) => {
    context.fillText(line, padding, canvas.height / 4 - fontSize/2 + (fontSize+10)*index);
  });

  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);

  // 创建材质
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  material.transparent = true;

  // 创建平面几何体
  const geometry = new THREE.PlaneGeometry(0.75, 0.5);

  // 创建Mesh
  const plane = new THREE.Mesh(geometry, material);

  // 设置平面位置
  plane.position.set(position.x, position.y, position.z);

  return plane;
}

function calculateMatchingColor(inputColor, colorA, colorB) {
  const delta = calculateColorDelta(colorA, colorB); // 计算 RGB 差值
  const inputRgb = hexToRgb(inputColor);

  // 根据输入颜色和差值计算新颜色
  const resultRgb = {
    r: Math.max(0, Math.min(255, inputRgb.r + delta.r)),
    g: Math.max(0, Math.min(255, inputRgb.g + delta.g)),
    b: Math.max(0, Math.min(255, inputRgb.b + delta.b)),
  };

  return rgbToHex(resultRgb);
}

function generateColorPalette(numColors = 3) {
  // 随机生成一个基准色 (baseColor) 的 HSL 值
  const baseHue = Math.floor(Math.random() * 360); // 色相 [0, 360)
  const baseSaturation = 70; // 固定饱和度为 70%
  const baseLightness = 50; // 固定亮度为 50%
  if(numColors === 3){
    // 定义符合配色原理的色相偏移量
    const offset1 = 70; // 第一个偏移角度（类比色）
    const offset2 = 140; // 第二个偏移角度（互补色）

    // 生成三种颜色
    const colors = [
    hslToRgbHex(baseHue, baseSaturation, baseLightness), 
    hslToRgbHex((baseHue + offset1) % 360, baseSaturation, baseLightness), 
    hslToRgbHex((baseHue + offset2) % 360, baseSaturation, baseLightness), 
    ];

    return colors;

  }else{
    // 根据需要生成的颜色数量，动态计算色相偏移量
    const offsetStep = 360 / numColors;

    // 生成指定数量的颜色
    const colors = Array.from({ length: numColors }, (_, i) => {
    const hue = (baseHue + i * offsetStep) % 360; // 计算色相
    return hslToRgbHex(hue, baseSaturation, baseLightness);
  });

  return colors;

  }
}

function getBowlingPosition(index) {
  let row = 0;
  let count = 0;
  while (count <= index) {
      row++;
      count += row;
  }
  const col = index - (count - row);

  const x = col*2 - (row - 1); 
  const y = row*0.5; 
  const z = 2 -row * 2;

  return { x, y, z };
}

function handleData(allKeys, allValues){
  uniqueKeys = [...new Set(allKeys.flat())];
  console.log(uniqueKeys);
  colorPalette = generateColorPalette(uniqueKeys.length-1);
  var numJars = 0;
  jarIndex_test = 0;

  allValues.forEach((values, index) => {
    const array20 = splitArray(values);
    numJars += array20.length;
  });

  for(var i=0; i<numJars; i++){
    cubeGroup.push(new THREE.Group);
  }
  
  allKeys.forEach((keys, index) => {
    data2Unit(keys, allValues[index], index*4);
  });

  console.log(clearGroupIndexArray);
}

function data2Unit(keys, values, shiftX=0, shiftY=0, shiftZ=0, ){
  const array20 = splitArray(values);
  var numJarTemp = 0;
  array20.forEach((value, index) => {
    const { x, y, z } = getBowlingPosition(index);
    data2jar(jarIndex_test, keys, value, shiftX+x, shiftY+y, shiftZ+z);
    jarIndex_test += 1;
    numJarTemp += 1;
  });
  clearGroupIndexArray.push(numJarTemp);
}

function data2jar(jarIndex, keys, values, centerX = 0, centerY = 0, centerZ = 0, numInputs = 3){
  cubeGroup[jarIndex].position.set(centerX, centerY, centerZ);
  // console.log(cubeGroup[jarIndex].position);
  const textArr = [];
  keys.forEach((item, index) => {
    const paletteIndex = uniqueKeys.indexOf(item);
    if(index != 3){
      for(var i=0; i<values[index]; i++){
        createCubeFrame(cubeIndex, 0, 0, 0, cubeGroup[jarIndex], colorPalette[paletteIndex]);
        cubeIndex += 1;
      }
    }
    if(index === 3){
      textArr.push(item + ': ' + Math.floor((values[index]/(60*60))*10)/10 + ' h');
    }else{
      textArr.push(item + ': ' + values[index]);
    }
  });

  cubeIndex = 0;
  const textLable = createTextPlane(textArr, { x: centerX, y: centerY-0.4, z: centerZ+1 });
  const jarrr = jar.clone();
  jarrr.position.set(centerX, centerY, centerZ);
  unitOne.add(jarrr);
  unitOne.add(cubeGroup[jarIndex]);
  unitOne.add(textLable);
  // unitOne.rotation.y = -0.55;
}

function hexToRgb(hex) {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

function rgbToHex(rgb) {
  return (rgb.r << 16) | (rgb.g << 8) | rgb.b; // 返回数字类型
}

function calculateColorDelta(colorA, colorB) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);

  return {
    r: rgbB.r - rgbA.r,
    g: rgbB.g - rgbA.g,
    b: rgbB.b - rgbA.b,
  };
}

function hslToRgbHex(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return rgbToHex({ r, g, b });
}

function splitArray(arr) {
  const result = [];
  let [a, b, c, parm] = arr; // 解构前三个数和parm

  while (a > 0 || b > 0 || c > 0) {
      // 计算当前可用的总和，使其不大于20
      const sum = Math.min(20, a + b + c);
      const newA = Math.min(a, sum); // 当前A分配的值
      const newB = Math.min(b, sum - newA); // 当前B分配的值
      const newC = Math.min(c, sum - newA - newB); // 当前C分配的值

      // 将当前分配的数组推入结果
      result.push([newA, newB, newC, parm]);

      // 更新剩余的数值
      a -= newA;
      b -= newB;
      c -= newC;
  }

  return result;
}