'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

interface Scene3DProps {
  photos?: string[];
  autoRotate?: boolean;
  startAnimation?: number;
  onSceneReady?: (refs: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer }) => void;
}

export default function Scene3D({ photos = [], autoRotate = true, startAnimation = 0, onSceneReady }: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef(autoRotate);
  const rotationFactorRef = useRef(1);
  const animatingRef = useRef(false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // ===== SCENE SETUP (match index.html) =====
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 60, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ===== BLOOM SETUP (match original: layer 1 = bloom, layer 0 = normal) =====
    const BLOOM_LAYER = 1;
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.25, 0
    ));

    // ===== CONTROLS =====
    const controls = new OrbitControls(camera, renderer.domElement);
    cameraRef.current = camera;
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.14;
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 0.6;
    controls.minDistance = 50;
    controls.maxDistance = 2000;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI - 0.35;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    // ===== AMBIENT LIGHT =====
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const l1 = new THREE.PointLight(0xffffff, 1, 500);
    l1.position.set(100, 100, 100); scene.add(l1);
    const l2 = new THREE.PointLight(0xffffff, 0.5, 500);
    l2.position.set(-100, -100, -100); scene.add(l2);

    // ===== CIRCLE TEXTURE =====
    const ct = document.createElement('canvas'); ct.width = ct.height = 28;
    const cctx = ct.getContext('2d')!;
    cctx.beginPath(); cctx.arc(14, 14, 14, 0, Math.PI * 2); cctx.fillStyle = 'white'; cctx.fill();
    const circleTex = new THREE.CanvasTexture(ct);

    // ===== PARTICLESYSTEM (particles.js merged) =====
    // Background stars (4000)
    const bgCount = 4000;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3); const bgCol = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount * 3; i += 3) {
      bgPos[i] = (Math.random() - 0.5) * 3000; bgPos[i + 1] = (Math.random() - 0.5) * 3000; bgPos[i + 2] = (Math.random() - 0.5) * 3000;
      const c = new THREE.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.3 + 0.7, Math.random() * 0.5 + 0.5);
      bgCol[i] = c.r; bgCol[i + 1] = c.g; bgCol[i + 2] = c.b;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
    const bgPts = new THREE.Points(bgGeo, new THREE.PointsMaterial({ size: 6, vertexColors: true, transparent: true, opacity: 0.8, map: circleTex, blending: THREE.NormalBlending }));
    scene.add(bgPts);

    // Inner disk (6000, r 0-110, size 0.7, NormalBlending)
    function mkDisk(n: number, iR: number, oR: number, hr: number, sz: number, bl: THREE.Blending, colFn: (i: number) => THREE.Color) {
      const g = new THREE.BufferGeometry(); const p = new Float32Array(n * 3); const cl = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = iR + Math.random() * (oR - iR); const a = Math.random() * Math.PI * 2; const h = (Math.random() - 0.5) * hr * 2;
        p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = h; p[i * 3 + 2] = Math.sin(a) * r;
        const c = colFn(i); cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b;
      }
      g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
      const m = new THREE.PointsMaterial({ size: sz, vertexColors: true, transparent: true, opacity: 1, map: circleTex, blending: bl, depthWrite: false });
      const mesh = new THREE.Points(g, m); scene.add(mesh); return mesh;
    }
    const pink = new THREE.Color(1.0, 0.8, 0.9);
    const innerDisk = mkDisk(6000, 0, 110, 4, 0.7, THREE.NormalBlending, () => new THREE.Color(1.0, 0.8, 0.9));

    // Main disk (100000, r 110-350, size 0.3, AdditiveBlending) - uses pow(1.5) formula
    const mCount = 100000; const mGeo = new THREE.BufferGeometry();
    const mPos = new Float32Array(mCount * 3); const mCol = new Float32Array(mCount * 3);
    for (let i = 0; i < mCount; i++) {
      const rand = Math.pow(Math.random(), 1.5);
      const r = Math.sqrt(350 * 350 * rand + (1 - rand) * 110 * 110);
      const a = Math.random() * Math.PI * 2; const h = (Math.random() - 0.5) * 2;
      mPos[i * 3] = Math.cos(a) * r; mPos[i * 3 + 1] = h; mPos[i * 3 + 2] = Math.sin(a) * r;
      mCol[i * 3] = 1.0; mCol[i * 3 + 1] = 0.8; mCol[i * 3 + 2] = 0.9;
    }
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
    const mDisk = new THREE.Points(mGeo, new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 1, map: circleTex, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(mDisk);

    // Outermost disk (100000, r 350-520, size 0.5, ShaderMaterial, AdditiveBlending)
    const oCount = 100000; const oGeo = new THREE.BufferGeometry();
    const oPos = new Float32Array(oCount * 3); const oCol = new Float32Array(oCount * 3);
    for (let i = 0; i < oCount; i++) {
      const r = 350 + Math.random() * 170; const a = Math.random() * Math.PI * 2; const h = (Math.random() - 0.5) * 4;
      oPos[i * 3] = Math.cos(a) * r; oPos[i * 3 + 1] = h; oPos[i * 3 + 2] = Math.sin(a) * r;
      const c = new THREE.Color(Math.random() * 0.2 + 0.8, Math.random() * 0.2 + 0.8, Math.random() * 0.2 + 0.8);
      oCol[i * 3] = c.r; oCol[i * 3 + 1] = c.g; oCol[i * 3 + 2] = c.b;
    }
    oGeo.setAttribute('position', new THREE.BufferAttribute(oPos, 3));
    oGeo.setAttribute('color', new THREE.BufferAttribute(oCol, 3));
    const oMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `attribute vec3 color; varying vec3 vColor; void main() { vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = 2.0*(300.0/-mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vColor; void main() { float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vColor, smoothstep(0.5,0.1,d)*0.6); }`,
      transparent: true, depthTest: false, blending: THREE.AdditiveBlending,
    });
    const oDisk = new THREE.Points(oGeo, oMat); scene.add(oDisk);

    // ===== CENTRAL SPHERE (sphere.js - GPU shader via onBeforeCompile) =====
    const SPHERE = 15000;
    const sConfig = { color1: '#a855f7', color2: '#ec4899', size: 9, particleSpeed: 2.0, rotationSpeed: 0.002, points: SPHERE, radius: { MIN: 55, MAX: 60 }, isGradient: true };
    const sPts: THREE.Vector3[] = []; const sSizes: number[] = []; const sShifts: number[] = [];
    for (let i = 0; i < SPHERE; i++) {
      sSizes.push(Math.random() * 1.5 + 0.5);
      sShifts.push(Math.random() * Math.PI, Math.random() * Math.PI * 2, (Math.random() * 0.9 + 0.1) * Math.PI, Math.random() * 0.9 + 0.1);
      sPts.push(new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * (sConfig.radius.MAX - sConfig.radius.MIN) + sConfig.radius.MIN));
    }
    const sGeo = new THREE.BufferGeometry().setFromPoints(sPts);
    sGeo.setAttribute('sizes', new THREE.Float32BufferAttribute(sSizes, 1));
    sGeo.setAttribute('shift', new THREE.Float32BufferAttribute(sShifts, 4));
    const sMat = new THREE.PointsMaterial({ size: 0.15 * sConfig.size, transparent: true, depthTest: false, blending: THREE.AdditiveBlending });
    let sUniforms: Record<string, THREE.IUniform> = {};
    sMat.onBeforeCompile = (shader) => {
      const c1 = new THREE.Color(sConfig.color1); const c2 = new THREE.Color(sConfig.color2);
      shader.uniforms.time = { value: 0 };
      shader.uniforms.particleSpeed = { value: sConfig.particleSpeed };
      shader.uniforms.color1 = { value: new THREE.Vector3(c1.r, c1.g, c1.b) };
      shader.uniforms.color2 = { value: new THREE.Vector3(c2.r, c2.g, c2.b) };
      shader.uniforms.isGradient = { value: sConfig.isGradient };
      shader.vertexShader = `uniform float time; uniform float particleSpeed; uniform vec3 color1; uniform vec3 color2; uniform bool isGradient; attribute float sizes; attribute vec4 shift; varying vec3 vColor; void main() { if(isGradient) { float cm = mod(shift.x+shift.y,1.0); vColor = mix(color1,color2,cm); } else { vColor = color1; } vec3 pos = position; float t = time*particleSpeed; float mt = mod(shift.x+shift.z*t,6.28318530718); float ms = mod(shift.y+shift.z*t,6.28318530718); pos += vec3(cos(ms)*sin(mt),cos(mt),sin(ms)*sin(mt))*shift.w; vec4 mv = modelViewMatrix*vec4(pos,1.0); gl_PointSize = sizes*(300.0/-mv.z); gl_Position = projectionMatrix*mv; }`;
      shader.fragmentShader = `varying vec3 vColor; void main() { float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vColor,smoothstep(0.5,0.1,d)*0.8); }`;
      sUniforms = shader.uniforms;
    };
    const sphereMesh = new THREE.Points(sGeo, sMat);
    sphereMesh.rotation.order = 'ZYX'; sphereMesh.rotation.z = 0.2;
    scene.add(sphereMesh);

    // ===== NEBULA (nebula-system.js) =====
    const nebCols = ['#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#feca57','#ff9ff3','#54a0ff','#5f27cd','#00d2d3','#ff9f43'];
    for (let i = 0; i < 25; i++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      const cx = cv.getContext('2d')!;
      const gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, nebCols[Math.floor(Math.random() * nebCols.length)]);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.15 + Math.random() * 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
      const sc = 150 + Math.random() * 150; sp.scale.set(sc, sc, 1);
      sp.position.set((Math.random() - 0.5) * 40000, (Math.random() - 0.5) * 40000, (Math.random() - 0.5) * 40000);
      scene.add(sp);
    }

    // ===== FLOWER RING (imageRing.js) =====
    const flowerGroup = new THREE.Group(); scene.add(flowerGroup);
    const fSprites: THREE.Sprite[] = []; let fLoaded = false;
    function loadFlowers(urls: string[]) {
      fSprites.forEach(s => { flowerGroup.remove(s); s.material.dispose(); }); fSprites.length = 0; fLoaded = false;
      if (urls.length === 0) return;
      const imgs: HTMLImageElement[] = []; let ld = 0;
      urls.forEach((src, i) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => { imgs[i] = img; ld++; if (ld === urls.length) {
          // Pre-process each unique photo once (max 256px) and cache material
          const matCache: THREE.SpriteMaterial[] = [];
          for (let k = 0; k < urls.length; k++) {
            const img3 = imgs[k];
            const iw = img3.naturalWidth || img3.width; const ih2 = img3.naturalHeight || img3.height;
            const canvasW = iw, canvasH = ih2;
            const cv2 = document.createElement('canvas'); cv2.width = canvasW; cv2.height = canvasH;
            const cx2 = cv2.getContext('2d')!;
            cx2.drawImage(img3, 0, 0);
            const imgData = cx2.getImageData(0, 0, canvasW, canvasH); const d2 = imgData.data;
            const rad2 = Math.min(canvasW, canvasH) * 0.1;
            for (let y = 0; y < canvasH; y++) for (let x = 0; x < canvasW; x++) {
              const idx2 = (y * canvasW + x) * 4; const dX = Math.min(x, canvasW - x); const dY = Math.min(y, canvasH - y);
              const dd = Math.sqrt(dX * dX + dY * dY);
              if (dd < rad2) d2[idx2 + 3] = Math.floor(255 * Math.pow(dd / rad2, 0.5));
            }
            cx2.putImageData(imgData, 0, 0);
            const tex = new THREE.CanvasTexture(cv2);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.NearestFilter; tex.magFilter = THREE.NearestFilter;
            tex.needsUpdate = true;
            matCache[k] = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true, depthWrite: false, sizeAttenuation: true, toneMapped: false, alphaTest: 0.01 });
          }
          // Create 800 sprites sharing the pre-processed materials
          for (let j = 0; j < 800; j++) {
            const mat = matCache[j % urls.length];
            const spr = new THREE.Sprite(mat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 130 + Math.random() * 400;
            const pY = (Math.random() - 0.5) * 16;
            spr.position.set(Math.cos(angle) * radius, pY, Math.sin(angle) * radius);
            const sprSz = 10 + Math.random() * 3;
            spr.scale.set(sprSz, sprSz, 1);
            spr.lookAt(0, pY, 0);
            flowerGroup.add(spr); fSprites.push(spr);
          }
          fLoaded = true;
        }};
        img.onerror = () => { ld++; if (ld === urls.length) fLoaded = true; };
        img.src = src;
      });
    }
    if (photos.length > 0) loadFlowers(photos);

    // ===== HEART MODEL (modelGlb.js) =====
    let heartGroup: THREE.Group | null = null;
    (async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        new GLTFLoader().load('/assets/images/heart_in_love.glb', (gltf) => {
          heartGroup = new THREE.Group();
          const m = gltf.scene; m.scale.set(1.2, 1.2, 1.2);
          heartGroup.add(m); heartGroup.position.set(0, 115, 0); heartGroup.visible = false;
          scene.add(heartGroup);
          const hl = new THREE.PointLight(0xffffff, 2, 1000); hl.position.set(0, 200, 100); scene.add(hl);
          const hd = new THREE.DirectionalLight(0xffffff, 1); hd.position.set(0, 200, -100); scene.add(hd);
        });
      } catch (_) { /* silent */ }
    })();

    // ===== METEOR SHOWER (meteors.js) =====
    const mCanvas = document.createElement('canvas');
    mCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:2;';
    mCanvas.width = window.innerWidth; mCanvas.height = window.innerHeight;
    container.appendChild(mCanvas);
    const mCtx = mCanvas.getContext('2d')!;
    const G = 15; const GI = 200; const gd: number[] = []; for (let g = 0; g < G; g++) gd[g] = g * GI;
    const meteors = Array.from({ length: 200 }, (_, i) => {
      const gi = i % G; const sw = window.innerWidth; const rw = sw / G;
      return { gi, gd: gd[gi], id: Math.random() * 8000, ls: Date.now(), active: false,
        x: gi * rw + Math.random() * rw, y: -50, length: Math.random() * 80 + 60,
        speed: 2 + Math.random() * 3, angle: Math.PI / 12 + (Math.random() - 0.5) * 0.2,
        opacity: 0.1, color: '#ffffff', particles: [] as any[] };
    });

    function updateMeteors() {
      const sw = window.innerWidth; const sh = window.innerHeight;
      if (mCanvas.width !== sw || mCanvas.height !== sh) { mCanvas.width = sw; mCanvas.height = sh; }
      mCtx.clearRect(0, 0, sw, sh);
      meteors.forEach(m => {
        const now = Date.now();
        if (!m.active) { if (now - m.ls > m.gd + m.id) m.active = true; else return; }
        m.x += Math.cos(m.angle) * m.speed; m.y += Math.sin(m.angle) * m.speed; m.opacity -= 0.002;
        if (Math.random() < 0.7) m.particles.push({ x: m.x, y: m.y, vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() + 0.5) * 1.5, size: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.5 + 0.5 });
        m.particles.forEach((p: any) => { p.x += p.vx; p.y += p.vy; p.opacity -= 0.02; });
        m.particles = m.particles.filter((p: any) => p.opacity > 0);
        const tx = m.x - Math.cos(m.angle) * m.length; const ty = m.y - Math.sin(m.angle) * m.length;
        const grd = mCtx.createLinearGradient(m.x, m.y, tx, ty);
        grd.addColorStop(0, `rgba(255,255,255,${m.opacity})`); grd.addColorStop(1, 'rgba(255,255,255,0)');
        mCtx.strokeStyle = grd; mCtx.lineWidth = 2; mCtx.beginPath(); mCtx.moveTo(m.x, m.y); mCtx.lineTo(tx, ty); mCtx.stroke();
        mCtx.beginPath(); mCtx.arc(m.x, m.y, 5, 0, Math.PI * 2);
        const hg = mCtx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 8);
        hg.addColorStop(0, 'rgba(255,255,255,1)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
        mCtx.fillStyle = hg; mCtx.fill();
        m.particles.forEach((p: any) => { mCtx.beginPath(); mCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2); mCtx.fillStyle = `rgba(255,255,255,${p.opacity})`; mCtx.fill(); });
        if (m.y > sh || m.opacity <= 0) { const rw = sw / G; m.x = m.gi * rw + Math.random() * rw; m.y = -50; m.length = Math.random() * 80 + 60; m.speed = 2 + Math.random() * 3; m.angle = Math.PI / 12 + (Math.random() - 0.5) * 0.2; m.opacity = 1; m.particles = []; m.ls = now; m.active = false; }
      });
    }

    // ===== ANIMATION LOOP =====
    const sClock = new THREE.Clock(); const pClock = new THREE.Clock();
    const diskSpeed = 0.001; let animId = 0;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const t = sClock.getElapsedTime();

      // Smooth rotation factor (ease in/out — match original)
      const rotTarget = autoRotateRef.current ? 1 : 0;
      rotationFactorRef.current += (rotTarget - rotationFactorRef.current) * 0.05;
      const rf = rotationFactorRef.current;

      // Update sphere (GPU shader) — guard: uniforms may not be ready on first frame
      if (sUniforms.time) {
        sUniforms.time.value = t;
        sUniforms.particleSpeed.value = sConfig.particleSpeed;
      }
      sphereMesh.rotation.y = t * sConfig.rotationSpeed;

      // Rotate disks (always)
      bgPts.rotation.y += 0.0001;
      innerDisk.rotation.y += diskSpeed;
      mDisk.rotation.y += diskSpeed;
      oMat.uniforms.time.value = pClock.getElapsedTime();
      oDisk.rotation.y += diskSpeed;

      // Rotate photo group (smooth stop on pause)
      if (fLoaded) flowerGroup.rotation.y += 0.0002 * rf;

      controls.update();
      controls.autoRotateSpeed = 1 * rf;

      // Two-pass rendering (match original exactly)
      camera.layers.set(BLOOM_LAYER);
      composer.render();
      camera.layers.set(0);
      renderer.render(scene, camera);

      // Meteor shower
      updateMeteors();
    };
    loop();

    onSceneReady?.({ scene, camera, renderer });

    // ===== RESIZE =====
    const onResize = () => {
      const w2 = window.innerWidth; const h2 = window.innerHeight;
      camera.aspect = w2 / h2; camera.updateProjectionMatrix();
      renderer.setSize(w2, h2); composer.setSize(w2, h2);
      mCanvas.width = w2; mCanvas.height = h2;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      controls.dispose(); renderer.dispose(); composer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // Camera animation trigger (component-level useEffect)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (!startAnimation || animatingRef.current) return;
    animatingRef.current = true;
    const cam = cameraRef.current;
    const ctrls = controlsRef.current;
    ctrls.enabled = false;
    gsap.to(cam.position, { x: 0, y: 10, z: 80, duration: 5, ease: 'power2.inOut',
      onUpdate: () => cam.lookAt(0, 0, 0),
      onComplete: () => {
        gsap.to(cam.position, { x: 0, y: 30, z: 600, duration: 12, ease: 'power2.inOut',
          onUpdate: () => cam.lookAt(0, 0, 0),
          onComplete: () => {
            gsap.to(cam.position, { x: -200, y: 400, z: -700, duration: 5, ease: 'power2.inOut',
              onUpdate: () => cam.lookAt(0, 0, 0),
              onComplete: () => { animatingRef.current = false; ctrls.enabled = true; }
            });
          }
        });
      }
    });
  }, [startAnimation]);

  return <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }} />;
}
