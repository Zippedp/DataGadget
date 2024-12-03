/*
  Acknowledgment: 
    3js.js is kick started by Three.js Crash Course by developedbyed
    Details at https://www.youtube.com/watch?v=_OwJV2xL8M8&t=1641s

    Some of the function is adapted frome 2018 Basic examples from /Basisbeispiele von
    Detials at https://hofk.de/main/discourse.threejs/2018/index2018.html

  LLMDiscloser:
    Code created using generative tools will be clearly marked in comments.

  ToDoList:
    + Uniform naming with Arduino, ble.js and itself.
    + add playground mode for anyone to put absurd number in to the visualizer to play with
    + add optional pillars for emphasis the amount of jars
    + rewrite jar size randanmize part to make it switchable
    + add color local storage for constant color for each lable
    + figer out a way to handle new lable color once local storage added
    + try adding a wireframe ground
    + add cam path for circle arrangement
    + add post processing glow effect
    + add post processing depth of field effect
    + add a emulator for fully online exprenece
*/

import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {totalKeys, totalValues_2num, totalKeys_1, totalValues_1_2num, data_is_loaded, recivedValue, inputRecivedIndex} from '../JavaScript/ble.js'

// get doc elements
const canvas = document.querySelector('.webgl');
const changeDispalyButton = document.getElementById('changeDispalyButton');
const dataDisplayText = document.getElementById('dataDisplay');
const bleStateContainer = document.getElementById('bleState');
const circularToggle = document.getElementById('expCircularToggle');
const circularText = document.getElementById('expCircularText');
const expErrorMessage = document.getElementById('expErrorMessage');

// marking data transfered & selected data type
let need_init = true;
let senceSelector = 0;
// var for movement smooth
let targetXOffset = 0;
let moveSpeed = 0.05;
// for handle divice inpute
let reciveIndexCount = 0;
let disable_keyInput = false;
// for color gen function
let colorPalette = [];
let unitIndexArray = [];
// for jar & copys
let jar;
let jar_for_Timer;
let jarIndexInArray = 0;
let modleFilePath = '../Res/test_2.gltf';
// array for mid data display
let dataDisplayIndex = 0;
let displayText_timer = [];
let displayText_counter = [];
// array for store imported data frome ble.js
let allTimerKey = [];
let allTimerValue = [];
let allCounterKey = [];
let allCounterValue = [];
let uniqueKeys = [];
// for future development
let arrangeRadius = 0;
let cheatCode = false;
let is_quickFixSkip = false;

// all cubegroups, for changing rotation & pos indivisually
let cubeIndexInArray = 0;
const cubeGroup_Counter = [];
const cubeGroup_Timer = [];
// one clear as a unit, for moving unit indivisually
const unitGroup_Counter = [];
const unitGroup_Timer = [];
// big group for moving everything together
const BIGGroup_Timer = new THREE.Group();
const BIGGroup_Counter = new THREE.Group();

// creat new 3d noise
const noise3D = createNoise3D();
// load GLTF model
const loader = new GLTFLoader();

// create scenes
const scene = new THREE.Scene();
const scene_Timer = new THREE.Scene();
// scene.fog = new THREE.Fog( 0x3f7b9d, 1, 20 );

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
const ambientLight = new THREE.AmbientLight(0x404040, 4);
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

// for testing
const allKeys_test = [
  ['testA', 'testB', 'testC','runtime'],
  ['A', 'B', 'C','runtime'],
  ['t23', '*(&s', 'lol','runtime'],
  ['testA', 'testB', 'testC','runtime'],
  ['A', 'B', 'C','runtime'],
  ['t23', '*(&s', 'lol','runtime']
];
const allValues_test = [
  [10, 20, 11, 206],
  [12, 50, 11, 20600],
  [12, 25, 11, 20600],
  [10, 20, 11, 206],
  [12, 50, 11, 20600],
  [12, 25, 101, 20600]
];
const allTimers_test = [
  [1000000, 20080000, 1100000, 2060],
  [12000000, 500000, 11000, 20600],
  [12008000, 250000, 100001, 20600],
  [100000, 200800, 11000800, 2000000],
  [1000002, 5000000, 1100000, 2060008],
  [12000000, 2500000, 10001, 20600000]
];

// loop
animate();

// add EventListener
changeDispalyButton.addEventListener('click', changeData);
circularToggle.addEventListener('change', switchArrangeMod);

// update renderer on window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// keydown events for biggroup movments
window.addEventListener('keydown', (event) => {
  if(!disable_keyInput){ // disable if in Circular mode
    // swith arrayLenth based on sence selected
    let arrayLenth = 0;
    if(senceSelector === 0){
      arrayLenth = allCounterKey.length-1;
    }else if(senceSelector === 1){
      arrayLenth = allTimerKey.length-1;
    }

    if (event.key === 'ArrowLeft') { // left shift 4
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

    } else if (event.key === 'ArrowRight') { // right shift 4
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

    } else if (event.key === 'ArrowUp') { // enable cheatCode & load sudo data for testing
      // cheatCode = true;
      // allTimerKey = allKeys_test;
      // allTimerValue = allTimers_test;
      // allCounterKey = allKeys_test;
      // allCounterValue = allValues_test;
    }
    console.log(dataDisplayIndex);
  }
});

// for load jar modle
loader.load(
  // file path
  modleFilePath, 
  // loaded
  function (gltf) {
    jar = gltf.scene;
    // replace loaded modle material code is partly assisted by ChatGPT
    jar.traverse((child) => {
      if (child.isMesh) {
        const glassToonMaterial = new THREE.MeshToonMaterial({
          color: 0xb1d8ec,
          transparent: true,
          opacity: 0.2,
        });
        child.receiveShadow = true;
        child.material = glassToonMaterial;
      }
    });
    jar_for_Timer = jar.clone();
    scene.add(jar);
    scene_Timer.add(jar_for_Timer);
  },
  // on load
  function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
  // error massage
  function (error) {
    console.error(error);
  }
);

// animation function
function animate() {
  requestAnimationFrame(animate); // loop animation
  diviceInputUpdate(inputRecivedIndex, recivedValue); // update input from divice
  controls.update(); // update OrbitControls
  
  const time = performance.now();
  // if ble transfer finished start scene init
  if(data_is_loaded && need_init || cheatCode && need_init){
    bleStateContainer.style.color = '#24af37';
    bleStateContainer.className = '';
    bleStateContainer.innerHTML = "Done";
    need_init = false;
    scene.remove(jar);
    scene_Timer.remove(jar_for_Timer);

    // for sikp load real data if needed
    if(!cheatCode){
      allTimerKey = totalKeys;
      allTimerValue =  runTime2Duration(totalValues_2num);
      allCounterKey = totalKeys_1;
      allCounterValue = runTime2Duration(totalValues_1_2num);
    }
    
    // creat arr for display on the mid
    displayText_timer = makeDisplayArray(allTimerKey,  allTimerValue, 3600000, ' hrs.');
    displayText_counter = makeDisplayArray(allCounterKey,  allCounterValue);

    // linear arrangement mid text update
    if(!circularToggle.checked){
      if(senceSelector === 0){
        targetXOffset = -(allCounterKey.length-1)*4;
        dataDisplayIndex = allCounterKey.length-1;
        dataDisplayText.innerHTML = displayText_counter[dataDisplayIndex].join('<br>');
        dataDisplayText.style.color = 'rgb(195, 195, 210)';
      }else if(senceSelector === 1){
        targetXOffset = -(allTimerKey.length-1)*4;
        dataDisplayIndex = allTimerKey.length-1;
        dataDisplayText.innerHTML = displayText_timer[dataDisplayIndex].join('<br>');
        dataDisplayText.style.color = 'rgb(195, 195, 210)';
      }
    }

    // process & creat jars for Timer
    handleTimerData(allTimerKey, allTimerValue);
    console.log(allTimerKey, allTimerValue);
    // process & creat jars for Counters
    handleCounterData(allCounterKey, allCounterValue);
    console.log(allCounterKey, allCounterValue);

    // linear arrangement setup
    unitGroup_Counter.forEach((Counter, index) => {
      Counter.position.set(index*4, 0, 0);
    });
    unitGroup_Timer.forEach((Timer, index) =>{
      Timer.position.set(index*4, 0, 0);
    })

    // add everything to big group
    unitGroup_Timer.forEach(unit => {
      BIGGroup_Timer.add(unit);
    });
    scene_Timer.add(BIGGroup_Timer);

    unitGroup_Counter.forEach(unit => {
      BIGGroup_Counter.add(unit);
    });

    scene.add(BIGGroup_Counter);
  }

  // smoothly all meshes move to the target position
  BIGGroup_Timer.position.x += (targetXOffset - BIGGroup_Timer.position.x) * moveSpeed;
  BIGGroup_Counter.position.x += (targetXOffset - BIGGroup_Counter.position.x) * moveSpeed;
  
  // cube animation
  if(senceSelector === 0){ // for Counter
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

  }else if(senceSelector ===1){ // for Timer
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

// chang between Linear and circular arrange
function switchArrangeMod(){
  if(data_is_loaded || cheatCode){
    expErrorMessage.innerHTML = '';
    if(circularToggle.checked){
      circularText.style.color = 'rgb(66, 66, 68)';
      dataDisplayText.innerHTML = ['- : -', '- : -', '- : -'].join('<br>')

      disable_keyInput = true;
      moveSpeed = 1;
      if(senceSelector === 0){
        BIGGroup_Counter.position.x = -4*dataDisplayIndex;
      }else if(senceSelector === 1){
        BIGGroup_Timer.position.x = -4*dataDisplayIndex;
      }
      targetXOffset = 0;
      dataDisplayIndex = 0;

      unitGroup_Counter.forEach(Counter => {
        resetToWorldOrigin(Counter);
      });
      unitGroup_Timer.forEach(Timer =>{
        resetToWorldOrigin(Timer);
      })

      setTimeout(() => {
        positionMeshesOnCircle(unitGroup_Counter);
        positionMeshesOnCircle(unitGroup_Timer);
      }, 10)

    }else{
      circularText.style.color = 'rgb(195, 195, 210)';

      if(senceSelector === 0){
        dataDisplayText.innerHTML = displayText_counter[dataDisplayIndex].join('<br>');
        dataDisplayText.style.color = 'rgb(195, 195, 210)';
      }else if(senceSelector === 1){
        dataDisplayText.innerHTML = displayText_timer[dataDisplayIndex].join('<br>');
        dataDisplayText.style.color = 'rgb(195, 195, 210)';
      }
      
      moveSpeed = 0.05;
      disable_keyInput = false;
      unitGroup_Counter.forEach((Counter, index) => {
        resetToWorldOrigin(Counter);
        Counter.position.set(index*4, 0, 0);
      });
      unitGroup_Timer.forEach((Timer, index) =>{
        resetToWorldOrigin(Timer);
        Timer.position.set(index*4, 0, 0);
      })

    }
  }else{
    circularToggle.checked = false;
    expErrorMessage.innerHTML = 'Load data first';
  }
}

// change displayed sence
function changeData(){
  if(senceSelector === 0){
    senceSelector = 1;
    changeDispalyButton.innerHTML = 'Go to Counter';
  }else if(senceSelector === 1){
    senceSelector = 0;
    changeDispalyButton.innerHTML = 'Go to Timer';
  }

  if(data_is_loaded){
    if(!circularToggle.checked){
      if(senceSelector === 0){
        if(dataDisplayIndex > allCounterKey.length-1){
          dataDisplayIndex = allCounterKey.length-1;
          targetXOffset = (allCounterKey.length-1)*-4;
          console.log('nonono');
        }
        dataDisplayText.innerHTML = displayText_counter[dataDisplayIndex].join('<br>');
        dataDisplayText.style.color = 'rgb(195, 195, 210)';
      }else if(senceSelector === 1){
        if(dataDisplayIndex > allTimerKey.length-1){
          dataDisplayIndex = allTimerKey.length-1;
          targetXOffset = (allTimerKey.length-1)*-4;
          console.log('nonono');
        }
        dataDisplayText.innerHTML = displayText_timer[dataDisplayIndex].join('<br>');
        dataDisplayText.style.color = 'rgb(195, 195, 210)';
      }
    }
  }
}

// update input based on import values 
function diviceInputUpdate(reciveIndex, value){
  if(reciveIndexCount < reciveIndex){
    reciveIndexCount = reciveIndex;
    
    let arrayLenth = 0;
    if(senceSelector === 0){
      arrayLenth = allCounterKey.length-1;
    }else if(senceSelector === 1){
      arrayLenth = allTimerKey.length-1;
    }

    if (value === 3 && !disable_keyInput) {
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

    } else if (value === 1 && !disable_keyInput) {
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

    } else if (value === 2) {
      changeData();
    }
    console.log(reciveIndex, value, dataDisplayIndex);
  }
}

// process data & handle mash creation ofr timer
function handleTimerData(allKeys, allValues){
  let timeCandys = convertTimersToHours(allValues, mili2Hour);
  uniqueKeys = [...new Set(allKeys.flat())];
  colorPalette = generateColorPalette(uniqueKeys.length-1);
  let numJars = 0;
  jarIndexInArray = 0;

  timeCandys.forEach((values, index) => {
    const array20 = splitArray(values);
    numJars += array20.length;
  });

  for(let i=0; i<numJars; i++){
    cubeGroup_Timer.push(new THREE.Group);
  }
  
  allKeys.forEach((keys, index) => {
    // data2Unit(keys, timeCandys[index], unitGroup_Timer, cubeGroup_Timer ,index*4);
    data2Unit(keys, timeCandys[index], unitGroup_Timer, cubeGroup_Timer);
  });
}

// process data & handle mash creation ofr counter
function handleCounterData(allKeys, allValues){
  uniqueKeys = [...new Set(allKeys.flat())];
  colorPalette = generateColorPalette(uniqueKeys.length-1);
  let numJars = 0;
  jarIndexInArray = 0;

  allValues.forEach((values, index) => {
    const array20 = splitArray(values);
    numJars += array20.length;
  });

  for(let i=0; i<numJars; i++){
    cubeGroup_Counter.push(new THREE.Group);
  }
  
  allKeys.forEach((keys, index) => {
    // data2Unit(keys, allValues[index], unitGroup_Counter, cubeGroup_Counter ,index*4);
    data2Unit(keys, allValues[index], unitGroup_Counter, cubeGroup_Counter);
  });
}

// add jars & cubes for one unit/clearGroup
function data2Unit(keys, values, unitGroupContainer, contentGroupContainer, shiftX=0, shiftY=0, shiftZ=0){
  const unitContainer = new THREE.Group();
  const array20 = splitArray(values);
  let numJarTemp = 0;
  array20.forEach((value, index) => {
    const { x, y, z } = getBowlingPosition(index);
    data2jar(jarIndexInArray, keys, value, unitContainer, contentGroupContainer, shiftX+x, shiftY+y, shiftZ+z);
    jarIndexInArray += 1;
    numJarTemp += 1;
  });
  unitGroupContainer.push(unitContainer);
  unitIndexArray.push(numJarTemp);
  
}

// add jar & cubes
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
        createCubeFrame(cubeIndexInArray, 0, 0, 0, contentGroupContainer[jarIndex], colorPalette[paletteIndex]);
        cubeIndexInArray += 1;
      }
    }
    if(index === 3){
      textArr.push(item + ': ' + Math.floor((values[index]/(60*60))*10)/10 + ' h');
    }else{
      textArr.push(item + ': ' + values[index]);
    }
  });

  cubeIndexInArray = 0;
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

// create facetedBox from 2018 Basic examples. Adaptation to new version of 3js lib is made using ChatGPT.
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

// create cube on given position by index. 
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

// create lable for each jar. This part is mostly generated by ChatGPT.
function createTextPlane(text_lines, position, fontSize = 50, color = '#000000', backgroundColor = '#f7e7dd') {
  // Create a Canvas to draw the text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set the size of the Canvas
  canvas.width = 512-128;
  canvas.height = 256;

  // Set the background color
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Setting text styles
  context.font = `${fontSize}px Arial`;
  context.fillStyle = color;
  context.textAlign = 'left';
  context.textBaseline = 'middle';

  // Draw text, starting on the left
  const padding = 20; // Add some padding
  text_lines.forEach((line, index) => {
    context.fillText(line, padding, canvas.height / 4 - fontSize/2 + (fontSize+10)*index);
  });

  // Creating Textures
  const texture = new THREE.CanvasTexture(canvas);

  // Creating Materials
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  material.transparent = true;

  // Creating Plane Geometry
  const geometry = new THREE.PlaneGeometry(0.75, 0.5);

  // Creating a Mesh
  const plane = new THREE.Mesh(geometry, material);

  // Set plane position
  plane.position.set(position.x, position.y, position.z);

  return plane;
}

// Returns a given number of colors with the same spacing on the color wheel. This part is mostly generated by ChatGPT.
function generateColorPalette(numColors = 3) {
  // Randomly generate a baseColor HSL value
  const baseHue = Math.floor(Math.random() * 360);
  const baseSaturation = 70;
  const baseLightness = 50;
  if(numColors === 3){
    // Define the hue offset that complies with the color matching principle
    const offset1 = 70;
    const offset2 = 140; 

    // Generate three colors
    const colors = [
    hslToRgbHex(baseHue, baseSaturation, baseLightness), 
    hslToRgbHex((baseHue + offset1) % 360, baseSaturation, baseLightness), 
    hslToRgbHex((baseHue + offset2) % 360, baseSaturation, baseLightness), 
    ];

    return colors;

  }else{
    // Dynamically calculate the hue offset based on the number of colors that need to be generated
    const offsetStep = 360 / numColors;

    // Generates the specified number of colors
    const colors = Array.from({ length: numColors }, (_, i) => {
    const hue = (baseHue + i * offsetStep) % 360;
    return hslToRgbHex(hue, baseSaturation, baseLightness);
  });

  return colors;

  }
}

// Return the coordinates of the triangle arrangement according to index. This part is mostly generated by ChatGPT.
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

// Auxiliary function for get fixed difference colors for base & Luminescence. This part is all generated by ChatGPT.
function calculateMatchingColor(inputColor, colorA, colorB) {
  const delta = calculateColorDelta(colorA, colorB);
  const inputRgb = hexToRgb(inputColor);

  const resultRgb = {
    r: Math.max(0, Math.min(255, inputRgb.r + delta.r)),
    g: Math.max(0, Math.min(255, inputRgb.g + delta.g)),
    b: Math.max(0, Math.min(255, inputRgb.b + delta.b)),
  };

  return rgbToHex(resultRgb);
}

// Auxiliary function for color format conversion. This part is all generated by ChatGPT.
function hexToRgb(hex) {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

// Auxiliary function for color format conversion. This part is all generated by ChatGPT.
function rgbToHex(rgb) {
  return (rgb.r << 16) | (rgb.g << 8) | rgb.b; // 返回数字类型
}

// Auxiliary function for color format conversion. This part is all generated by ChatGPT.
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

// Auxiliary function for calculate color difference. This part is all generated by ChatGPT.
function calculateColorDelta(colorA, colorB) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);

  return {
    r: rgbB.r - rgbA.r,
    g: rgbB.g - rgbA.g,
    b: rgbB.b - rgbA.b,
  };
}

// split Array to fit unit group & cube count. This part is all generated by ChatGPT.
function splitArray(arr) {
  const result = [];
  let [a, b, c, parm] = arr; // Deconstruct the first three numbers and parm

  while (a > 0 || b > 0 || c > 0) {
      // Calculate the current available total so that it is no greater than 20
      const sum = Math.min(20, a + b + c);
      const newA = Math.min(a, sum); // The value currently assigned to A
      const newB = Math.min(b, sum - newA); // The value currently assigned to B
      const newC = Math.min(c, sum - newA - newB); // The current value of C assignment

      // Push the currently allocated array into result
      result.push([newA, newB, newC, parm]);

      // Update the remaining values
      a -= newA;
      b -= newB;
      c -= newC;
  }

  return result;
}

// Auxiliary function for miliseconds to hours
function mili2Hour(miliseconds){
  let hoursArry = [];
  miliseconds.forEach(time => {
    hoursArry.push(Math.round(time/1800000));
  });
  return hoursArry;
}

// miliseconds to hours
function convertTimersToHours(allTimers, mili2Hour) {
  return allTimers.map(timerSet => {
      const convertedTimes = mili2Hour(timerSet.slice(0, 3));
      return [...convertedTimes, timerSet[3]];
  });
}

// set jars to a circle and no overlays. This part is simplify and rewrite by ChatGPT.
function positionMeshesOnCircle(meshArray) {
  const totalGroups = meshArray.length;
  const cubeSize = 0.5;

  // Count the number of blocks in each row of each group
  const groupRows = meshArray.map(group => {
      const numCubes = group.children.length;
      return getCubesPerRow(numCubes);
  });

  // Find the maximum number of rows in all groups
  const maxRows = Math.max(...groupRows.map(rows => rows.length));

  const angleStep = (2 * Math.PI) / totalGroups; // Equidistant angular spacing
  let maxRadius = 0;

  // Calculate for each row
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
      // Calculate the width of each group in the current row
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

      // The maximum group width in the current row
      const maxGroupWidthAtRow = Math.max(...groupWidthsAtRow);

      // Calculate the minimum radius required for the current line
      const radiusRow = (maxGroupWidthAtRow / 2) / Math.sin(angleStep / 2);

      // Update maximum radius
      if (radiusRow > maxRadius) {
          maxRadius = radiusRow;
      }
  }
  if(maxRadius<5){
    maxRadius = 5;
  }
  arrangeRadius = maxRadius;

  // Use the calculated maximum radius to set the position of each group
  for (let i = 0; i < totalGroups; i++) {
      const angle = i * angleStep;
      const x = maxRadius * Math.cos(angle);
      const z = maxRadius * Math.sin(angle);

      meshArray[i].position.set(x, 0, z);
      meshArray[i].lookAt(0, 0, 0);
  }
}

// Auxiliary function for get row infor
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

// return a joint & modified arr for mid text data display
function makeDisplayArray(allKeys, allValues, valueMod = 1, endUnit = ''){
  let outputArray = [];
  let unitArray = [];
  allKeys.forEach((keys, index) => {
    unitArray = [];
    keys.forEach((key, pndex) => {
      if(pndex === 3){
        unitArray.push('Duration' + ': ' + Math.round(allValues[index][pndex]*10/3600)/10 + ' hrs.');
      }else{
        unitArray.push(key + ': ' + Math.round(allValues[index][pndex]*10/valueMod)/10 + endUnit);
      }
    });
    outputArray.push(unitArray);
  });
  return outputArray;
}

// calculate duration based on logged runtime. This part is simplify and rewrite by ChatGPT.
function runTime2Duration(allValue) {
  const result = allValue.map((timer, index, array) => {
      const newTimer = [...timer];
      if (index === 0) {
          return newTimer;
      }
      newTimer[newTimer.length - 1] = timer[timer.length - 1] - array[index - 1][array[index - 1].length - 1];
      return newTimer;
  });
  return result;
}

// reset xyz to word 0,0,0. This part is all generated by ChatGPT.
function resetToWorldOrigin(object) {
  if (!object || !(object instanceof THREE.Object3D)) {
      console.error("Invalid object. Please provide a valid THREE.Object3D instance.");
      return;
  }

  // Step 1: Calculate the object's world position and rotation
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  
  object.getWorldPosition(worldPosition); // Get current world position
  object.getWorldQuaternion(worldQuaternion); // Get current world rotation (quaternion)
  
  // Step 2: Calculate the offset to bring the object to the origin
  const parentWorldPosition = new THREE.Vector3();
  const parentWorldQuaternion = new THREE.Quaternion();
  
  if (object.parent) {
      // Get parent world position and rotation
      object.parent.getWorldPosition(parentWorldPosition);
      object.parent.getWorldQuaternion(parentWorldQuaternion);
  }

  // Offset the position relative to the parent
  const localPositionOffset = new THREE.Vector3().subVectors(
      new THREE.Vector3(0, 0, 0),
      parentWorldPosition
  );

  // Offset the rotation relative to the parent
  const localRotationOffset = new THREE.Quaternion().invert(parentWorldQuaternion);

  // Step 3: Apply the offset to the object
  object.position.copy(localPositionOffset); // Set the local position to bring it to world origin
  object.quaternion.copy(localRotationOffset); // Set the local rotation to align with world axes

  // Ensure the object matrix is updated
  object.updateMatrixWorld(true);
}