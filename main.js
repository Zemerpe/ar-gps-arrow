// Use full CDN URLs for all modules
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let arrow;
let userHeading = 0;

// 🎯 Target GPS (change this to your destination)
const targetLat = 11.0245585;
const targetLon = 124.0111658;

// ---------- INIT ----------
function initAR() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // ✅ WebXR AR button
    document.body.appendChild(
        ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] })
    );

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    loadArrowModel();
    startSensors();

    renderer.setAnimationLoop(render);
}

// ---------- LOAD ARROW MODEL ----------
function loadArrowModel() {
    const loader = new GLTFLoader();
    loader.load(
        './arrow.glb',  // must be in same folder
        function (gltf) {
            arrow = gltf.scene;
            arrow.scale.set(0.5, 0.5, 0.5); 
            arrow.rotation.x = Math.PI / 2;
            arrow.position.set(0, 0, -1.5);

            camera.add(arrow);
            scene.add(camera);
        },
        undefined,
        function (error) {
            console.error('Error loading arrow.glb:', error);
        }
    );
}

// ---------- GPS + Compass ----------
function startSensors() {
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            updateArrowDirection,
            err => alert("GPS error: " + err.message),
            { enableHighAccuracy: true }
        );
    } else {
        alert("Geolocation not supported");
    }

    window.addEventListener('deviceorientationabsolute', e => {
        if (e.alpha !== null) userHeading = e.alpha;
    }, true);
}

// ---------- MATH ----------
function toRad(d) { return d * Math.PI / 180; }

function calculateBearing(lat1, lon1, lat2, lon2) {
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2))
            - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ---------- UPDATE ARROW ----------
function updateArrowDirection(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    if (!arrow) return;

    const bearing = calculateBearing(lat, lon, targetLat, targetLon);
    const rotation = THREE.MathUtils.degToRad(bearing - userHeading);

    arrow.rotation.z = rotation;
}

// ---------- RENDER ----------
function render() {
    renderer.render(scene, camera);
}

// ---------- START AR ON BUTTON CLICK ----------
document.getElementById('startBtn').onclick = () => {
    initAR();
    document.getElementById('startBtn').style.display = 'none';
};
