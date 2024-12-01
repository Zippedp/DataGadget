import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {totalKeys, totalValues_2num, totalKeys_1, totalValues_1_2num, data_is_loaded} from '../JavaScript/ble.js'

const canvas = document.querySelector('.webgl');
const changeDispalyButton = document.getElementById('changeDispalyButton');
const dataDisplayText = document.getElementById('dataDisplay');

// var for movement smooth
let targetXOffset = 0;
let moveSpeed = 0.05;
let numberTester = 0;
let cubeIndex = 0;
let senceSelector = 0;
let dataDisplayIndex = 0;

// create scene
const scene = new THREE.Scene();
const scene_Timer = new THREE.Scene();
// scene.fog = new THREE.Fog( 0x3f7b9d, 1, 20 );

changeDispalyButton.addEventListener('click', changeData);
// create renderer
// const renderer = new THREE.WebGLRenderer({ canvas , alpha: true });
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xeeeeee, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// create camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 10;
camera.position.y = 0.6;

// init orbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

// add lights
const ambientLight = new THREE.AmbientLight(0x404040, 2);
const cameraLight = new THREE.PointLight(0xffffff, 13, 100); 
cameraLight.position.set(1.5, 2, 2);
cameraLight.castShadow = true;

scene.add(ambientLight);
scene.add(cameraLight);

const ambientLight_1 = ambientLight.clone();
const cameraLight_1 = cameraLight.clone();
cameraLight.position.set(1.5, 2, 2);
cameraLight.castShadow = true;

scene_Timer.add(ambientLight_1);
scene_Timer.add(cameraLight_1);

// load GLTF model
const loader = new GLTFLoader();
const cubeGroup_Counter = [];
const cubeGroup_Timer = [];
const unitGroup_Counter = [];
const unitGroup_Timer = [];
const unitOne = new THREE.Group();
const BIGGroup_Timer = new THREE.Group();
const BIGGroup_Counter = new THREE.Group();
let colorPalette = [];
let uniqueKeys = [];
let unitIndexArray = [];
let need_init = true;
let jarIndex_test = 0;
let jar;
let jar_for_Timer;
let arrangeRadius;
let camPosition;

let displayText_timer = [];
let displayText_counter = [];

// let timeCandys = [];

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
  [12, 50, 11, 20600],
  [12, 25, 11, 20600],
  [10, 20, 11, 206],
  [12, 50, 11, 20600],
  [12, 25, 101, 20600]
];
const allTimers = [
  [1000000, 20080000, 1100000, 20600000],
  [12000000, 500000, 11000, 20600000],
  [12008000, 250000, 100001, 2060000],
  [100000, 200800, 11000800, 2000006],
  [1000002, 5000000, 1100000, 206000880],
  [12000000, 2500000, 10001, 20600]
];

animate();

// Animation function
function animate() {
  requestAnimationFrame(animate); // Loop the animation function

  const time = performance.now();
  if(data_is_loaded && need_init){
    need_init = false;
    scene.remove(jar);
    scene_Timer.remove(jar_for_Timer);

    // displayText_timer = makeDisplayArray(allKeys, allTimers, 3600000, 'h');
    // displayText_counter = makeDisplayArray(allKeys, allValues);

    displayText_timer = makeDisplayArray(totalKeys,  totalValues_2num, 3600000, 'h');
    displayText_counter = makeDisplayArray(totalKeys_1,  totalValues_1_2num);

    if(senceSelector === 0){
      dataDisplayText.innerHTML = displayText_counter[dataDisplayIndex].join('<br>');
      dataDisplayText.style.color = 'rgb(195, 195, 210)';
    }else if(senceSelector === 1){
      dataDisplayText.innerHTML = displayText_timer[dataDisplayIndex].join('<br>');
      dataDisplayText.style.color = 'rgb(195, 195, 210)';
    }
    
    // handleTimerData(allKeys, allTimers);
    // console.log(allKeys, allTimers);

    // handleCounterData(allKeys, allValues);
    // console.log(allKeys, allValues);

    handleTimerData(totalKeys, totalValues_2num);
    console.log(totalKeys, totalValues_2num);

    handleCounterData(totalKeys_1, totalValues_1_2num);
    console.log(totalKeys_1, totalValues_1_2num);

    // positionMeshesOnCircle(unitGroup_Counter);
    // camera.position.z = 0;
    // camera.rotation.set(0,0,0);

    unitGroup_Timer.forEach(unit => {
      BIGGroup_Timer.add(unit);
    });
    scene_Timer.add(BIGGroup_Timer);

    unitGroup_Counter.forEach(unit => {
      BIGGroup_Counter.add(unit);
    });
    scene.add(BIGGroup_Counter);
  }

  controls.update();

  // Smoothly move all meshes to the target position
  BIGGroup_Timer.position.x += (targetXOffset - BIGGroup_Timer.position.x) * moveSpeed;
  BIGGroup_Counter.position.x += (targetXOffset - BIGGroup_Counter.position.x) * moveSpeed;

  if(senceSelector === 0){
    let clearGroupIndex = 0;
    let indexTemp = 0;

    cubeGroup_Counter.forEach((group, index) => {
      if(indexTemp >= unitIndexArray[clearGroupIndex]){
        clearGroupIndex += 1;
        indexTemp = 0;
      }
      indexTemp += 1;
      group.rotation.x += (0.002 + noise3D(clearGroupIndex ,time/1000 , index/100)/1000);
      group.rotation.y += (0.002 + noise3D(clearGroupIndex ,time/1000 , index/100)/1000);
      group.position.y += Math.sin(time/1000 + clearGroupIndex)/1500;
    });
    renderer.render(scene, camera);

  }else if(senceSelector ===1){
    let clearGroupIndex = 0;
    let indexTemp = 0;

    cubeGroup_Timer.forEach((group, index) => {
      if(indexTemp >= unitIndexArray[clearGroupIndex]){
        clearGroupIndex += 1;
        indexTemp = 0;
      }
      indexTemp += 1;
      group.rotation.x += (0.002 + noise3D(clearGroupIndex ,time/1000 , index/100)/1000);
      group.rotation.y += (0.002 + noise3D(clearGroupIndex ,time/1000 , index/100)/1000);
      group.position.y += Math.sin(time/1000 + clearGroupIndex)/1500;
    });
    renderer.render(scene_Timer, camera);
  }
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
    jar_for_Timer = jar.clone();
    scene.add(jar);
    scene_Timer.add(jar_for_Timer);
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
  let arrayLenth = 0;
  if(senceSelector === 0){
    arrayLenth = totalKeys_1.length-1;
  }else if(senceSelector === 1){
    arrayLenth = totalKeys.length-1;
  }

  if (event.key === 'ArrowLeft') {
    if(dataDisplayIndex <= 0){
      targetXOffset = -arrayLenth*4;
      dataDisplayIndex = arrayLenth;
    }else{
      targetXOffset += 4;
      dataDisplayIndex -= 1;
    }

    if(senceSelector === 0){
      dataDisplayText.innerHTML = displayText_counter[dataDisplayIndex].join('<br>');
    }else if(senceSelector === 1){
      dataDisplayText.innerHTML = displayText_timer[dataDisplayIndex].join('<br>');
    }

  } else if (event.key === 'ArrowRight') {
    if(dataDisplayIndex >= arrayLenth){
      targetXOffset = 0;
      dataDisplayIndex = 0;
    }else{
      dataDisplayIndex += 1;
      targetXOffset -= 4;
    }

    if(senceSelector === 0){
      dataDisplayText.innerHTML = displayText_counter[dataDisplayIndex].join('<br>');
    }else if(senceSelector === 1){
      dataDisplayText.innerHTML = displayText_timer[dataDisplayIndex].join('<br>');
    }

  } else if (event.key === 'ArrowUp') {
    // numberTester += 1;
  }
  console.log(dataDisplayIndex);
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
  let coefficient = 1;
  let row = 0;
  let count = 0;
  while (count <= index) {
      row++;
      count += row;
  }
  const col = index - (count - row);

  const x = (col*2 - (row - 1))*coefficient; 
  const y = row*0.5; 
  const z = 2 -(row * 2)*coefficient;

  return { x, y, z };
}

function handleTimerData(allKeys, allValues){
  let timeCandys = convertTimersToHours(allValues, mili2Hour);
  uniqueKeys = [...new Set(allKeys.flat())];
  colorPalette = generateColorPalette(uniqueKeys.length-1);
  let numJars = 0;
  jarIndex_test = 0;

  timeCandys.forEach((values, index) => {
    const array20 = splitArray(values);
    numJars += array20.length;
  });

  for(let i=0; i<numJars; i++){
    cubeGroup_Timer.push(new THREE.Group);
  }
  
  allKeys.forEach((keys, index) => {
    data2Unit(keys, timeCandys[index], unitGroup_Timer, cubeGroup_Timer ,index*4);
  });
}

function handleCounterData(allKeys, allValues){
  uniqueKeys = [...new Set(allKeys.flat())];
  colorPalette = generateColorPalette(uniqueKeys.length-1);
  let numJars = 0;
  jarIndex_test = 0;

  allValues.forEach((values, index) => {
    const array20 = splitArray(values);
    numJars += array20.length;
  });

  for(let i=0; i<numJars; i++){
    cubeGroup_Counter.push(new THREE.Group);
  }
  
  allKeys.forEach((keys, index) => {
    data2Unit(keys, allValues[index], unitGroup_Counter, cubeGroup_Counter ,index*4);
    // data2Unit(keys, allValues[index], unitGroup_Counter, cubeGroup_Counter , 0);
  });
}

function data2Unit(keys, values, unitGroupContainer, contentGroupContainer, shiftX=0, shiftY=0, shiftZ=0){
  const unitContainer = new THREE.Group();
  const array20 = splitArray(values);
  let numJarTemp = 0;
  array20.forEach((value, index) => {
    const { x, y, z } = getBowlingPosition(index);
    data2jar(jarIndex_test, keys, value, unitContainer, contentGroupContainer, shiftX+x, shiftY+y, shiftZ+z);
    jarIndex_test += 1;
    numJarTemp += 1;
  });
  unitGroupContainer.push(unitContainer);
  unitIndexArray.push(numJarTemp);
  
}

function data2jar(jarIndex, keys, values, unitContainer, contentGroupContainer, centerX = 0, centerY = 0, centerZ = 0){
  // let sizeTemXZ = 1+(1-Math.random())*0.2;
  // let sizeTempY = 1+(1-Math.random())*0.5;
  let sizeTemXZ = 0;
  let sizeTempY = 0;

  contentGroupContainer[jarIndex].position.set(centerX, centerY, centerZ);
  // console.log(cubeGroup[jarIndex].position);
  const textArr = [];
  keys.forEach((item, index) => {
    const paletteIndex = uniqueKeys.indexOf(item);
    if(index != 3){
      for(let i=0; i<values[index]; i++){
        createCubeFrame(cubeIndex, 0, 0, 0, contentGroupContainer[jarIndex], colorPalette[paletteIndex]);
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
  // const textLable = createTextPlane(textArr, { x: centerX, y: centerY-0.4, z: centerZ+1+(sizeTemXZ-1) });
  const textLable = createTextPlane(textArr, { x: centerX, y: centerY-0.4, z: centerZ+1 });
  const jarrr = jar.clone();

  
  // jarrr.scale.set(sizeTemXZ, sizeTempY, sizeTemXZ);

  // jarrr.position.set(centerX, centerY+(sizeTempY-1), centerZ);
  jarrr.position.set(centerX, centerY, centerZ);
  unitContainer.add(jarrr);
  unitContainer.add(contentGroupContainer[jarIndex]);
  unitContainer.add(textLable);
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

function changeData(){
  if(senceSelector === 0){
    senceSelector = 1;
    changeDispalyButton.innerHTML = 'Go to Counter';
  }else if(senceSelector === 1){
    senceSelector = 0;
    changeDispalyButton.innerHTML = 'Go to Timer';
  }
  if(data_is_loaded){
    if(senceSelector === 0){
      dataDisplayText.innerHTML = displayText_counter[dataDisplayIndex].join('<br>');
      dataDisplayText.style.color = 'rgb(195, 195, 210)';
    }else if(senceSelector === 1){
      dataDisplayText.innerHTML = displayText_timer[dataDisplayIndex].join('<br>');
      dataDisplayText.style.color = 'rgb(195, 195, 210)';
    }
  }
}

function time2Score(times) {

  const numValues = times.length; // 输入数组的长度
  let maxScore = 0; // 用于存储最大得分
  let totalTime = 0; // 总计时间
  let tempScore = new Array(numValues).fill(0); // 临时存储未归一化的得分
  let normalizedScore = new Array(numValues).fill(0); // 最终归一化的得分

  const minTime = 60000.0; // 最小时间（10小时）
  const maxTime = 180000000.0; // 最大时间（50小时）
  let coefficient = 0; // 用于归一化计算的系数

  // 计算总时间
  totalTime = times.reduce((sum, time) => sum + time, 0);

  // 计算每个时间的临时得分（基于比例）
  for (let i = 0; i < numValues; i++) {
      tempScore[i] = (times[i] / totalTime) * times[i];
  }

  // 找到最大得分
  maxScore = Math.max(...times);

  // 根据总时间计算系数（用于得分调整）
  coefficient = 1.0 + ((totalTime - minTime) / (maxTime - minTime)) * 19;

  console.log("Max Score:", maxScore);
  console.log("Coefficient:", coefficient);

  // 将得分归一化到0-5的范围
  for (let i = 0; i < numValues; i++) {
      normalizedScore[i] = Math.round((tempScore[i] / maxScore) * coefficient);
      console.log(`Time: ${times[i]}, Temp Score: ${tempScore[i]}, Normalized Score: ${normalizedScore[i]}`);
  }

  return normalizedScore;
}

function mili2Hour(miliseconds){
  let hoursArry = [];
  miliseconds.forEach(time => {
    hoursArry.push(Math.round(time/1800000));
  });
  return hoursArry;
}

function convertTimersToHours(allTimers, mili2Hour) {
  return allTimers.map(timerSet => {
      const convertedTimes = mili2Hour(timerSet.slice(0, 3));
      return [...convertedTimes, timerSet[3]];
  });
}


function positionMeshesOnCircle(meshArray) {
  const totalGroups = meshArray.length;
  const cubeSize = 0.5; // 根据实际方块尺寸调整

  // 计算每个组的每一行方块数量
  const groupRows = meshArray.map(group => {
      const numCubes = group.children.length;
      return getCubesPerRow(numCubes);
  });

  // 找出所有组中最大的行数
  const maxRows = Math.max(...groupRows.map(rows => rows.length));

  const angleStep = (2 * Math.PI) / totalGroups; // 等距排列的角度间隔
  let maxRadius = 0;

  // 对每一行进行计算
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
      // 计算当前行中每个组的宽度
      const groupWidthsAtRow = [];
      for (let i = 0; i < totalGroups; i++) {
          const rows = groupRows[i];
          let groupWidthAtRow = 0;
          if (rowIndex < rows.length) {
              const cubesInRow = rows[rowIndex];
              groupWidthAtRow = cubesInRow * cubeSize;
          }
          groupWidthsAtRow.push(groupWidthAtRow);
      }

      // 当前行中最大的组宽度
      const maxGroupWidthAtRow = Math.max(...groupWidthsAtRow);

      // 计算当前行所需的最小半径
      const radiusRow = (maxGroupWidthAtRow / 2) / Math.sin(angleStep / 2);

      // 更新最大半径
      if (radiusRow > maxRadius) {
          maxRadius = radiusRow;
      }
  }
  if(maxRadius<5){
    maxRadius = 5;
  }
  arrangeRadius = maxRadius;

  // 使用计算出的最大半径来设置每个组的位置
  for (let i = 0; i < totalGroups; i++) {
      const angle = i * angleStep;
      const x = maxRadius * Math.cos(angle);
      const z = maxRadius * Math.sin(angle);

      meshArray[i].position.set(x, 0, z);
      meshArray[i].lookAt(0, 0, 0); // 使每个组朝向圆心
  }
}

// 辅助函数：获取每个组的每一行方块数量
function getCubesPerRow(numCubes) {
  let rows = [];
  let row = 1;
  let count = 0;
  while (count < numCubes) {
      let cubesInRow = row;
      if (count + cubesInRow > numCubes) {
          cubesInRow = numCubes - count;
      }
      rows.push(cubesInRow);
      count += cubesInRow;
      row++;
  }
  return rows;
}

function makeDisplayArray(allKeys, allValues, valueMod = 1, endUnit = ''){
  let outputArray = [];
  let unitArray = [];
  allKeys.forEach((keys, index) => {
    unitArray = [];
    keys.forEach((key, pndex) => {
      if(pndex === 3){
        unitArray.push(key + ': ' + Math.round(allValues[index][pndex]*10/3600)/10 + ' hrs.');
      }else{
        unitArray.push(key + ': ' + Math.round(allValues[index][pndex]*10/valueMod)/10 + endUnit);
      }
    });
    outputArray.push(unitArray);
  });
  return outputArray;
}