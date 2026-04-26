import * as THREE from "three";
import {
  createNebulaSystem,
  getDefaultNebulaColors,
  createGlowMaterial,
} from "./nebula-system.js";

export class CentralSphere {
  constructor(scene) {
    this.scene = scene;
    this.config = {
      color1: "#a855f7",
      color2: "#ec4899",
      diskColor: "#a855f7",
      innerDiskColor: "#f5d0fe",
      backgroundColor: "#ec4899",
      outermostColor: "#a855f7",
      size: 9,
      rotationSpeed: 0.002,
      particleSpeed: 2.0,
      points: 15000,
      radius: { MIN: 55, MAX: 60 },
      isGradient: true,
    };

    this.points = [];
    this.sizes = [];
    this.shifts = [];
    this.uniforms = {
      time: { value: 0 },
      particleSpeed: { value: this.config.particleSpeed },
    };
    this.object = null;
    this.clock = new THREE.Clock();
    this.particleSystem = null;
    this.flowerRing = null;
    this.nebulas = []; // Mảng chứa các tinh vân
    this.createBody();

    // Khởi tạo mưa sao băng mặc định
    if (typeof window.checkMeteorConfig === 'function') window.checkMeteorConfig();
    if (typeof window.toggleMeteorShower === 'function' && !window.isMeteorShowerActive) {
      window.toggleMeteorShower();
    }

    window.dispatchEvent(new CustomEvent('sphere_ready'));
  }

  generatePoints() {
    this.points = [];
    this.sizes = [];
    this.shifts = [];

    for (let i = 0; i < this.config.points; i++) {
      this.sizes.push(Math.random() * 1.5 + 0.5);
      this.pushShift();
      this.points.push(this.createPoint());
    }
  }

  createPoint() {
    return new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(
        Math.random() * (this.config.radius.MAX - this.config.radius.MIN) +
        this.config.radius.MIN,
      );
  }

  pushShift() {
    this.shifts.push(
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2,
      (Math.random() * 0.9 + 0.1) * Math.PI * 1.0,
      Math.random() * 0.9 + 0.1,
    );
  }

  createBody() {
    this.generatePoints();

    const geometry = new THREE.BufferGeometry().setFromPoints(this.points);
    geometry.setAttribute(
      "sizes",
      new THREE.Float32BufferAttribute(this.sizes, 1),
    );
    geometry.setAttribute(
      "shift",
      new THREE.Float32BufferAttribute(this.shifts, 4),
    );

    const material = this.createMaterial();
    const body = new THREE.Points(geometry, material);

    body.rotation.order = "ZYX";
    body.rotation.z = 0.2;

    if (this.object) {
      this.scene.remove(this.object);
    }

    this.object = body;
    this.scene.add(body);
  }

  createMaterial() {
    const material = new THREE.PointsMaterial({
      size: 0.15 * this.config.size,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const vertexShader = `
            uniform float time;
            uniform float particleSpeed;
            uniform float size;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform bool isGradient;
            attribute float sizes;
            attribute vec4 shift;
            varying vec3 vColor;
            const float PI2 = 6.28318530718;

            void main() {
                if (isGradient) {
                    float colorMix = mod(shift.x + shift.y, 1.0);
                    vColor = mix(color1, color2, colorMix);
                } else {
                    vColor = color1;
                }
                
                vec3 pos = position;
                float t = time * particleSpeed;
                float moveT = mod(shift.x + shift.z * t, PI2);
                float moveS = mod(shift.y + shift.z * t, PI2);
                pos += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * sizes * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

    const fragmentShader = `
            varying vec3 vColor;

            void main() {
                float d = length(gl_PointCoord.xy - 0.5);
                if (d > 0.5) discard;
                gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, d) * 0.8);
            }
        `;

    material.onBeforeCompile = (shader) => {
      const color1 = new THREE.Color(this.config.color1);
      const color2 = new THREE.Color(this.config.color2);

      shader.uniforms.time = { value: 0 };
      shader.uniforms.particleSpeed = { value: this.config.particleSpeed };
      shader.uniforms.color1 = {
        value: new THREE.Vector3(color1.r, color1.g, color1.b),
      };
      shader.uniforms.color2 = {
        value: new THREE.Vector3(color2.r, color2.g, color2.b),
      };
      shader.uniforms.isGradient = { value: this.config.isGradient };

      shader.vertexShader = vertexShader;
      shader.fragmentShader = fragmentShader;
      this.uniforms = shader.uniforms;
    };

    return material;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.object) {
      const newMaterial = this.createMaterial();
      this.object.material = newMaterial;
      newMaterial.needsUpdate = true;
    }

    // Update particle system colors if provided
    let ps = this.particleSystem;
    if (!ps && window.particleSystem) {
      ps = window.particleSystem;
      this.particleSystem = ps;
    }
    if (
      ps &&
      (newConfig.diskColor ||
        newConfig.innerDiskColor ||
        newConfig.outermostColor ||
        newConfig.backgroundColor)
    ) {
      ps.updateColors(
        newConfig.backgroundColor || null,
        newConfig.diskColor || null,
        newConfig.innerDiskColor || null,
        newConfig.outermostColor || null,
      );
    }

    // Apply nebula state if provided
    if (newConfig.nebulaEnabled !== undefined) {
      if (newConfig.nebulaEnabled) {
        if (newConfig.nebulaConfig && newConfig.nebulaConfig.positions) {
          this.loadNebulaConfig(newConfig.nebulaConfig);
        } else {
          this.createNebulas();
        }
      } else {
        this.clearNebulas();
      }
    }

    // Apply 3D text settings if provided
    const t3d = newConfig.text3d;
    if (window.heartText && t3d) {
      if (typeof window.heartText.setText === "function" && t3d.text !== undefined) {
        window.heartText.setText(t3d.text);
      }
      if (typeof window.heartText.setFont === "function" && t3d.fontName) {
        window.heartText.setFont(t3d.fontName);
      }
      if (typeof window.heartText.setSize === "function" && t3d.size !== undefined) {
        window.heartText.setSize(t3d.size);
      }
      if (typeof window.heartText.setColor === "function" && t3d.color !== undefined) {
        window.heartText.setColor(t3d.color);
      }
      if (typeof window.heartText.setEffect === "function" && t3d.effectType) {
        window.heartText.setEffect(t3d.effectType, 1.0, 1.0);
      }
      if (t3d.appearEffect === "fadein" && typeof window.heartText.showFadeInEffect === "function") {
        window.heartText.showFadeInEffect(t3d.text || "", 3500);
      }
    }

    // Apply central heart state if provided
    if (newConfig.centralHeartEnabled !== undefined) {
      this.applyCentralHeartState(newConfig.centralHeartEnabled);
    }

    // Apply text visibility if provided
    if (newConfig.text3dEnabled !== undefined && window.heartText) {
      if (newConfig.text3dEnabled) {
        window.heartText.show();
      } else {
        window.heartText.hide();
      }
    }
  }

  applyCentralHeartState(enabled) {
    if (window.heart3D) {
      window.heart3D.visible = enabled;
      console.log("Central Heart state:", enabled);
    }
  }

  animate() {
    if (this.object) {
      const elapsedTime = this.clock.getElapsedTime();
      this.uniforms.time.value = elapsedTime;
      this.uniforms.particleSpeed.value = this.config.particleSpeed;
      this.object.rotation.y = elapsedTime * this.config.rotationSpeed;
    }
  }

  setParticleSystem(particleSystem) {
    this.particleSystem = particleSystem;
    // Apply default colors to the particle system immediately
    if (this.particleSystem && this.particleSystem.updateColors) {
      this.particleSystem.updateColors(
        this.config.backgroundColor,
        this.config.diskColor,
        this.config.innerDiskColor,
        this.config.outermostColor
      );
    }
  }

  setFlowerRing(flowerRing) {
    this.flowerRing = flowerRing;
  }

  createNebulas() {
    this.clearNebulas();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const nebulaOptions = isIOS ? {
      count: 8,
      minSize: 600,
      maxSize: 1400,
      minOpacity: 0.15,
      maxOpacity: 0.4,
      spreadRadius: 450,
      colorPalette: getDefaultNebulaColors(),
      centralGlow: false,
      minScale: 200,
      maxScale: 350,
    } : {
      count: 18,
      minSize: 1000,
      maxSize: 3000,
      minOpacity: 0.2,
      maxOpacity: 0.6,
      spreadRadius: 700,
      colorPalette: getDefaultNebulaColors(),
      centralGlow: false,
      minScale: 350,
      maxScale: 450,
    };

    this.nebulas = createNebulaSystem(this.scene, nebulaOptions);
  }

  clearNebulas() {
    if (this.nebulas) {
      this.nebulas.forEach((nebula) => {
        this.scene.remove(nebula);
      });
      this.nebulas = [];
    }
  }

  loadNebulaConfig(nebulaConfig) {
    this.clearNebulas();

    if (nebulaConfig.positions && nebulaConfig.positions.length > 0) {
      nebulaConfig.positions.forEach((pos) => {
        const color = getDefaultNebulaColors()[Math.floor(Math.random() * getDefaultNebulaColors().length)];
        const nebula = createGlowMaterial(color, 100, 0.3);
        nebula.position.set(pos.x, pos.y, pos.z);
        nebula.scale.set(pos.scale, pos.scale, 1);
        this.scene.add(nebula);
        this.nebulas.push(nebula);
      });
    }
  }
}
