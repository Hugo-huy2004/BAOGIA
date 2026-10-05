import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import { hapticMerge, hapticLose, hapticMove } from "../../../utils/haptics";
import { createCombo } from "./arcadeProgression";
import {
  playChomp,
  playDonutChime,
  playMagnetWhoosh,
  playStarFever,
  playBananaZip,
  playCartoonBoing,
  playBoostWhoosh,
  playCandySmash,
  playLevelUpFanfare,
  playCartoonLose,
  startCartoonBgm,
  setBgmFever,
  stopCartoonBgm,
  toggleAudioMuted,
  isAudioMuted,
} from "./snakeAudio";
import {
  SNAKE_SKINS,
  STORY_STAGES,
  createCartoonSnakeHead,
  createCartoonSegmentMesh,
  create3DKiwi,
  create3DStrawberry,
  create3DDonut,
  create3DBananaSlice,
  create3DCandyCube,
  create3DGoldenStar,
  create3DCandyBomb,
  createCartoonFloorTexture,
} from "./snakeModels";
import SnakeHud from "./snake/SnakeHud";
import SnakeControls from "./snake/SnakeControls";
import SnakeSkinModal from "./snake/SnakeSkinModal";

const ARENA_RADIUS = 28;
const SEGMENT_SPACING = 0.88;

export default function GameSnake({ paused = false, onGameOver }) {
  const { i18n } = useTranslation();
  const isVi = (i18n.resolvedLanguage || i18n.language || "vi").startsWith("vi");

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const boostBarRef = useRef(null);
  const boostTextRef = useRef(null);

  const [countdown, setCountdown] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState("blue");
  const [showSkinMenu, setShowSkinMenu] = useState(false);
  const [muted, setMuted] = useState(isAudioMuted());
  const [isFeverUI, setIsFeverUI] = useState(false);
  const [isMagnetUI, setIsMagnetUI] = useState(false);
  const [isBoostingUI, setIsBoostingUI] = useState(false);

  // Story & Stage Banner
  const [stageBanner, setStageBanner] = useState(null);
  const bannerTimerRef = useRef(null);

  // Floating Popups on screen
  const [popups, setPopups] = useState([]);

  const [hud, setHud] = useState({
    score: 0,
    eaten: 0,
    bombs: 0,
    combo: 0,
    mult: 1,
    notice: "",
    stage: 1,
    stageName: STORY_STAGES[0].nameVi,
  });

  const reportedRef = useRef(false);
  const lastBoostingRef = useRef(false);

  // Swipe touch state - Vuốt hướng nào sang hướng đó
  const touchStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [swipeUI, setSwipeUI] = useState({ active: false, currX: 0, currY: 0 });

  // Game Core State inside requestAnimationFrame
  const gameRef = useRef({
    head: { x: 0, y: 0.8, z: 0 },
    heading: 0,
    steerInput: 0,
    targetHeading: null,
    isBoosting: false,
    boostEnergy: 100,

    feverTimeLeft: 0,
    magnetTimeLeft: 0,

    segments: [],
    segmentCount: 14,
    skinKey: "blue",

    score: 0,
    eaten: 0,
    stage: 1,
    dead: false,
    combo: createCombo({ windowMs: 3000, step: 0.25, max: 4 }),

    tempCamTarget: new THREE.Vector3(),
    tempLookTarget: new THREE.Vector3(),

    foodItems: [],
    nextFoodId: 1,

    goldenStarMesh: null,
    goldenStarPos: null,

    bombs: [],
    bombsGroup: null,
    portals: [],
    portalMeshes: [],
    portalCooldown: 0,

    scene: null,
    camera: null,
    renderer: null,
    headData: null,
    groundMesh: null,
    wallGroup: null,
    particleSystem: null,

    particles: [],
  });

  useEffect(() => {
    gameRef.current.skinKey = selectedSkin;
  }, [selectedSkin]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) {
      setPlaying(true);
      startCartoonBgm();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 750);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    return () => {
      stopCartoonBgm();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const addPopup = useCallback((text, color = "#facc15") => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev.slice(-4), { id, text, color }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1200);
  }, []);

  const showStageBanner = useCallback((stageIndex) => {
    const s = STORY_STAGES[(stageIndex - 1) % STORY_STAGES.length];
    setStageBanner(s);
    playLevelUpFanfare();
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setStageBanner(null), 3600);
  }, []);

  // Spawn Thức Ăn
  const spawnFoodItem = useCallback((specificType = null) => {
    const g = gameRef.current;
    if (!g.scene) return;

    const curStage = STORY_STAGES[(g.stage - 1) % STORY_STAGES.length];
    const margin = 5.5;
    const x = (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2);
    const z = (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2);

    let type = specificType;
    if (!type) {
      const rand = Math.random();
      if (curStage.chapter >= 2 && rand < 0.22) {
        type = "donut";
      } else if (curStage.chapter >= 3 && rand < 0.40) {
        type = "strawberry";
      } else if (rand < 0.60) {
        type = "banana";
      } else if (rand < 0.78) {
        type = "candycube";
      } else {
        type = "kiwi";
      }
    }

    let mesh;
    if (type === "donut") mesh = create3DDonut();
    else if (type === "strawberry") mesh = create3DStrawberry();
    else if (type === "banana") mesh = create3DBananaSlice();
    else if (type === "candycube") {
      const colors = [0xf97316, 0xa855f7, 0x06b6d4, 0xec4899];
      mesh = create3DCandyCube(colors[Math.floor(Math.random() * colors.length)]);
    } else {
      mesh = create3DKiwi();
    }

    mesh.position.set(x, 0.8, z);
    g.scene.add(mesh);

    const item = {
      id: g.nextFoodId++,
      mesh,
      type: mesh.userData.type || type,
      perk: mesh.userData.perk || null,
      points: mesh.userData.points || 100,
      nameVi: mesh.userData.nameVi || "Trái Cây",
      x,
      y: 0.8,
      z,
      rotationSpeed: 1.5 + Math.random() * 1.5,
      floatPhase: Math.random() * Math.PI * 2,
    };

    g.foodItems.push(item);
  }, []);

  const spawnGoldenStar = useCallback(() => {
    const g = gameRef.current;
    if (!g.scene) return;

    const margin = 6;
    const x = (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2);
    const z = (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2);

    if (!g.goldenStarMesh) {
      g.goldenStarMesh = create3DGoldenStar();
      g.scene.add(g.goldenStarMesh);
    }

    g.goldenStarPos = { x, y: 1.0, z, ttl: 480 };
    g.goldenStarMesh.position.set(x, 1.0, z);
    g.goldenStarMesh.visible = true;
  }, []);

  const spawnJuiceBurst = useCallback((x, y, z, colorHex, count = 18) => {
    const g = gameRef.current;
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.5;
      g.particles.push({
        x,
        y: y + 0.3,
        z,
        vx: Math.cos(angle) * speed,
        vy: 2.0 + Math.random() * 3.0,
        vz: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        decay: 0.03 + Math.random() * 0.02,
        color,
      });
    }
  }, []);

  const updateStageEnvironment = useCallback((stageNum) => {
    const g = gameRef.current;
    const stage = STORY_STAGES[(stageNum - 1) % STORY_STAGES.length];
    if (!g.scene) return;

    g.scene.background.set(stage.bgHex);
    g.scene.fog.color.set(stage.fogHex);

    if (g.groundMesh) {
      const floorTex = createCartoonFloorTexture(stage.floorPrimary, stage.floorSecondary);
      g.groundMesh.material.map = floorTex;
      g.groundMesh.material.needsUpdate = true;
    }

    if (g.wallGroup) {
      g.wallGroup.children.forEach((w) => {
        w.material.color.set(stage.barrierColor);
      });
    }

    if (g.bombsGroup) {
      g.scene.remove(g.bombsGroup);
    }
    const bombsGroup = new THREE.Group();
    g.bombs = [];

    const bombCount = stage.mines || 0;
    if (bombCount > 0) {
      for (let i = 0; i < bombCount; i++) {
        const bx = (Math.random() - 0.5) * (ARENA_RADIUS * 1.5);
        const bz = (Math.random() - 0.5) * (ARENA_RADIUS * 1.5);
        const bMesh = create3DCandyBomb();
        bMesh.position.set(bx, 0.8, bz);
        bombsGroup.add(bMesh);
        g.bombs.push({ x: bx, y: 0.8, z: bz, mesh: bMesh });
      }
      g.scene.add(bombsGroup);
      g.bombsGroup = bombsGroup;
    }

    if (stage.portals && g.portalMeshes.length === 2) {
      g.portals = [
        { x: -16, y: 1.2, z: 12 },
        { x: 16, y: 1.2, z: -12 },
      ];
      g.portalMeshes[0].position.set(g.portals[0].x, g.portals[0].y, g.portals[0].z);
      g.portalMeshes[0].visible = true;
      g.portalMeshes[1].position.set(g.portals[1].x, g.portals[1].y, g.portals[1].z);
      g.portalMeshes[1].visible = true;
    } else if (g.portalMeshes.length === 2) {
      g.portals = [];
      g.portalMeshes[0].visible = false;
      g.portalMeshes[1].visible = false;
    }

    showStageBanner(stageNum);
  }, [showStageBanner]);

  const updateParticles3D = useCallback((dt) => {
    const g = gameRef.current;
    if (!g.particleSystem) return;

    const posAttr = g.particleSystem.geometry.attributes.position;
    const colAttr = g.particleSystem.geometry.attributes.color;

    for (let i = g.particles.length - 1; i >= 0; i--) {
      const p = g.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 9.8 * dt;
      p.life -= p.decay;

      if (p.life <= 0 || p.y < 0) {
        g.particles.splice(i, 1);
      }
    }

    const maxParts = 90;
    for (let i = 0; i < maxParts; i++) {
      if (i < g.particles.length) {
        const p = g.particles[i];
        posAttr.setXYZ(i, p.x, p.y, p.z);
        colAttr.setXYZ(i, p.color.r * p.life, p.color.g * p.life, p.color.b * p.life);
      } else {
        posAttr.setXYZ(i, 0, -999, 0);
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }, []);

  const addSnakeSegments = useCallback((count) => {
    const g = gameRef.current;
    const lastSeg = g.segments[g.segments.length - 1] || g.head;

    for (let k = 0; k < count; k++) {
      const index = g.segments.length;
      const { segGroup, segMesh, bellyMesh, size } = createCartoonSegmentMesh(g.skinKey, index);
      segGroup.position.set(lastSeg.x, 0.8, lastSeg.z);
      g.scene.add(segGroup);

      g.segments.push({
        x: lastSeg.x,
        y: 0.8,
        z: lastSeg.z,
        group: segGroup,
        segMesh,
        bellyMesh,
        size,
      });
    }
  }, []);

  const applySkin = useCallback((newSkinKey) => {
    setSelectedSkin(newSkinKey);
    const g = gameRef.current;
    g.skinKey = newSkinKey;

    if (g.scene && g.headData) {
      g.scene.remove(g.headData.headGroup);
      const newHead = createCartoonSnakeHead(newSkinKey);
      newHead.headGroup.position.set(g.head.x, g.head.y, g.head.z);
      g.scene.add(newHead.headGroup);
      g.headData = newHead;
    }

    const skin = SNAKE_SKINS[newSkinKey] || SNAKE_SKINS.blue;
    g.segments.forEach((seg, idx) => {
      const isAlt = idx % 2 === 1;
      seg.segMesh.material.color.set(isAlt ? skin.accentColor : skin.headColor);
      seg.bellyMesh.material.color.set(skin.bellyColor);
    });

    addPopup(isVi ? `Đã chọn: ${skin.nameVi}` : `Skin: ${skin.nameEn}`, skin.glowHex);
  }, [addPopup, isVi]);

  const syncHud = useCallback((notice) => {
    const g = gameRef.current;
    const curStage = STORY_STAGES[(g.stage - 1) % STORY_STAGES.length];
    setHud((prev) => ({
      score: g.score,
      eaten: g.eaten,
      bombs: g.bombs.length,
      combo: g.combo.chain + (g.combo.chain > 0 ? 1 : 0),
      mult: g.combo.mult,
      stage: g.stage,
      stageName: isVi ? curStage.nameVi : curStage.nameEn,
      notice: notice !== undefined ? notice : prev.notice,
    }));
  }, [isVi]);

  const handleDeath = useCallback(() => {
    const g = gameRef.current;
    if (g.dead) return;
    g.dead = true;

    stopCartoonBgm();
    playCartoonLose();
    hapticLose();
    spawnJuiceBurst(g.head.x, g.head.y, g.head.z, 0xf43f5e, 35);

    setTimeout(() => {
      if (onGameOver && !reportedRef.current) {
        reportedRef.current = true;
        onGameOver(g.score, g.score >= 1200 ? "win" : "lose");
      }
    }, 1100);
  }, [onGameOver, spawnJuiceBurst]);

  // ── Khởi tạo Three.js Scene ───────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const g = gameRef.current;
    const curStage = STORY_STAGES[(g.stage - 1) % STORY_STAGES.length];
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;
    const isMobile = window.innerWidth < 768;

    // WebGL Renderer: Tối ưu di động, tắt antialias, precision mediump, pixelRatio 1.0
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      powerPreference: "default",
      precision: isMobile ? "mediump" : "highp",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    g.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(curStage.bgHex);
    scene.fog = new THREE.FogExp2(curStage.fogHex, 0.015);
    g.scene = scene;

    const fov = isMobile ? 60 : 52;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.2, 400);
    camera.position.set(0, isMobile ? 21.0 : 16.5, isMobile ? -14.5 : -11.5);
    camera.lookAt(0, 0.5, 1.2);
    g.camera = camera;

    // Ánh sáng toàn cảnh tiết kiệm năng lượng
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    sunLight.position.set(25, 45, 20);
    scene.add(sunLight);

    // Mặt sàn kẻ ô
    const floorTexture = createCartoonFloorTexture(curStage.floorPrimary, curStage.floorSecondary);
    const groundGeo = new THREE.PlaneGeometry(ARENA_RADIUS * 2 + 6, ARENA_RADIUS * 2 + 6);
    const groundMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    scene.add(groundMesh);
    g.groundMesh = groundMesh;

    // Rào chắn kẹo
    const wallGroup = new THREE.Group();
    const railMat = new THREE.MeshStandardMaterial({
      color: curStage.barrierColor,
      roughness: 0.2,
      metalness: 0.1,
    });
    const wallHeight = 2.2;
    const bGeoX = new THREE.BoxGeometry(ARENA_RADIUS * 2, wallHeight, 0.6);
    const bGeoZ = new THREE.BoxGeometry(0.6, wallHeight, ARENA_RADIUS * 2);

    const wallN = new THREE.Mesh(bGeoX, railMat);
    wallN.position.set(0, wallHeight / 2, ARENA_RADIUS);
    const wallS = new THREE.Mesh(bGeoX, railMat);
    wallS.position.set(0, wallHeight / 2, -ARENA_RADIUS);
    const wallE = new THREE.Mesh(bGeoZ, railMat);
    wallE.position.set(ARENA_RADIUS, wallHeight / 2, 0);
    const wallW = new THREE.Mesh(bGeoZ, railMat);
    wallW.position.set(-ARENA_RADIUS, wallHeight / 2, 0);

    wallGroup.add(wallN, wallS, wallE, wallW);
    scene.add(wallGroup);
    g.wallGroup = wallGroup;

    // Đầu Bé Rắn
    const headData = createCartoonSnakeHead(g.skinKey);
    headData.headGroup.position.set(g.head.x, g.head.y, g.head.z);
    scene.add(headData.headGroup);
    g.headData = headData;

    // Thân Bé Rắn
    g.segments = [];
    for (let i = 0; i < g.segmentCount; i++) {
      const { segGroup, segMesh, bellyMesh, size } = createCartoonSegmentMesh(g.skinKey, i);
      const initZ = -((i + 1) * SEGMENT_SPACING);
      segGroup.position.set(0, 0.8, initZ);
      scene.add(segGroup);

      g.segments.push({
        x: 0,
        y: 0.8,
        z: initZ,
        group: segGroup,
        segMesh,
        bellyMesh,
        size,
      });
    }

    // Sinh hoa quả
    g.foodItems = [];
    for (let f = 0; f < 5; f++) {
      spawnFoodItem();
    }

    // Cổng Cầu Vồng (Zero PointLights)
    const createRainbowPortalMesh = (colorHex) => {
      const pGroup = new THREE.Group();
      const pTorusMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      });
      const pTorus = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.22, 10, 18), pTorusMat);
      pGroup.add(pTorus);

      const pVortexMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const pVortex = new THREE.Mesh(new THREE.CircleGeometry(2.2, 18), pVortexMat);
      pGroup.add(pVortex);
      return pGroup;
    };

    g.portalMeshes = [createRainbowPortalMesh(0x38bdf8), createRainbowPortalMesh(0xc084fc)];
    g.portalMeshes.forEach((p) => {
      p.visible = false;
      scene.add(p);
    });

    // Hệ thống Hạt
    const maxParticles = 90;
    const partGeo = new THREE.BufferGeometry();
    const partPositions = new Float32Array(maxParticles * 3);
    const partColors = new Float32Array(maxParticles * 3);
    partGeo.setAttribute("position", new THREE.BufferAttribute(partPositions, 3));
    partGeo.setAttribute("color", new THREE.BufferAttribute(partColors, 3));

    const partMat = new THREE.PointsMaterial({
      size: 0.9,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const particleSystem = new THREE.Points(partGeo, partMat);
    scene.add(particleSystem);
    g.particleSystem = particleSystem;

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 600;
      const mob = window.innerWidth < 768;
      camera.fov = mob ? 62 : 55;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      groundGeo.dispose();
      partGeo.dispose();
    };
  }, [spawnFoodItem]);

  // ── Vòng Lặp Game Loop (Tối ưu hóa: 0 React re-renders trong tick) ─────────
  useEffect(() => {
    if (!playing || paused) return;

    let animId;
    let lastTime = performance.now();
    const g = gameRef.current;

    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!g.dead) {
        const curStage = STORY_STAGES[(g.stage - 1) % STORY_STAGES.length];
        const isMobile = window.innerWidth < 768;

        // Power-ups countdown
        if (g.feverTimeLeft > 0) {
          g.feverTimeLeft -= dt;
          if (g.feverTimeLeft <= 0) {
            g.feverTimeLeft = 0;
            setIsFeverUI(false);
            setBgmFever(false);
          }
        }

        if (g.magnetTimeLeft > 0) {
          g.magnetTimeLeft -= dt;
          if (g.magnetTimeLeft <= 0) {
            g.magnetTimeLeft = 0;
            setIsMagnetUI(false);
          }
        }

        // Boost stamina
        if (g.isBoosting && g.boostEnergy > 2) {
          g.boostEnergy = Math.max(0, g.boostEnergy - 30 * dt);
        } else {
          g.isBoosting = false;
          g.boostEnergy = Math.min(100, g.boostEnergy + 24 * dt);
        }

        // Cập nhật Stamina DOM trực tiếp — KHÔNG gọi setState để tránh lag CPU
        if (boostBarRef.current) {
          boostBarRef.current.style.width = `${Math.round(g.boostEnergy)}%`;
        }
        if (boostTextRef.current) {
          boostTextRef.current.textContent = g.isBoosting ? (isVi ? "TĂNG TỐC!" : "BOOST!") : `${Math.round(g.boostEnergy)}%`;
        }

        if (lastBoostingRef.current !== g.isBoosting) {
          lastBoostingRef.current = g.isBoosting;
          setIsBoostingUI(g.isBoosting);
        }

        // Vận tốc & Hướng
        const isFever = g.feverTimeLeft > 0;
        let baseSpeed = curStage.speed;
        if (isFever) baseSpeed *= 1.45;
        const currentSpeed = g.isBoosting ? baseSpeed * 1.55 : baseSpeed;

        if (g.targetHeading !== null) {
          let diff = g.targetHeading - g.heading;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          g.heading += diff * Math.min(1, 22.0 * dt);
        } else {
          const turnSpeed = g.isBoosting ? 3.3 : 3.9;
          g.heading += g.steerInput * turnSpeed * dt;
        }

        g.head.x += Math.sin(g.heading) * currentSpeed * dt;
        g.head.z += Math.cos(g.heading) * currentSpeed * dt;

        // Biểu cảm đầu bé rắn
        if (g.headData) {
          const h = g.headData;
          h.headGroup.position.set(g.head.x, g.head.y, g.head.z);
          h.headGroup.rotation.y = g.heading;

          const timeSec = now * 0.001;
          const tongueWiggle = Math.sin(timeSec * 12) > 0.4 ? 0.08 : 0;
          h.tongueMesh.position.z = 1.15 + tongueWiggle;
        }

        // Đốt thân
        let prevPos = { x: g.head.x, y: g.head.y, z: g.head.z };
        const timeSec = now * 0.001;

        for (let i = 0; i < g.segments.length; i++) {
          const seg = g.segments[i];
          const dx = prevPos.x - seg.x;
          const dz = prevPos.z - seg.z;
          const dist = Math.hypot(dx, dz);

          if (dist > SEGMENT_SPACING) {
            const ratio = (dist - SEGMENT_SPACING) / dist;
            seg.x += dx * ratio;
            seg.z += dz * ratio;
          }

          const wavePhase = timeSec * (g.isBoosting || isFever ? 11 : 7.5) + i * 0.42;
          const undulationY = 0.8 + Math.sin(wavePhase) * (g.isBoosting ? 0.22 : 0.14);
          const lateralWiggle = Math.cos(wavePhase) * (g.isBoosting ? 0.16 : 0.1);

          seg.group.position.set(
            seg.x + Math.cos(g.heading) * lateralWiggle,
            undulationY,
            seg.z - Math.sin(g.heading) * lateralWiggle
          );

          const segAngle = Math.atan2(dx, dz);
          seg.group.rotation.y = segAngle;

          prevPos = { x: seg.x, y: seg.y, z: seg.z };
        }

        // Camera góc nhìn 3D Isometric cố định hướng, bám theo Bé Rắn
        // Đảm bảo "Vuốt hướng nào sang hướng đó": Vuốt Lên -> đi Lên, Vuốt Xuống -> đi Xuống, Trái/Phải không bị xoay lộn xộn
        if (g.camera) {
          const boostZoom = g.isBoosting || isFever;
          const camHeight = isMobile ? (boostZoom ? 23.0 : 20.5) : (boostZoom ? 18.5 : 16.0);
          const camZDist = isMobile ? (boostZoom ? -16.0 : -14.0) : (boostZoom ? -13.0 : -11.5);

          const targetCamX = g.head.x;
          const targetCamY = camHeight;
          const targetCamZ = g.head.z + camZDist;

          g.tempCamTarget.set(targetCamX, targetCamY, targetCamZ);
          g.camera.position.lerp(g.tempCamTarget, 0.14);

          const lookTargetX = g.head.x;
          const lookTargetY = 0.5;
          const lookTargetZ = g.head.z + 1.2;

          g.tempLookTarget.set(lookTargetX, lookTargetY, lookTargetZ);
          g.camera.lookAt(g.tempLookTarget);
        }

        // Va chạm tường biên
        if (Math.abs(g.head.x) >= ARENA_RADIUS - 0.6 || Math.abs(g.head.z) >= ARENA_RADIUS - 0.6) {
          if (isFever) {
            g.heading += Math.PI * 0.8;
            playCartoonBoing();
            spawnJuiceBurst(g.head.x, g.head.y, g.head.z, 0xfacc15, 15);
          } else {
            handleDeath();
          }
        }

        // Va chạm kẹo nổ
        for (let i = g.bombs.length - 1; i >= 0; i--) {
          const b = g.bombs[i];
          const dist = Math.hypot(g.head.x - b.x, g.head.z - b.z);
          if (dist < 1.35) {
            if (isFever) {
              playCandySmash();
              spawnJuiceBurst(b.x, b.y, b.z, 0xf43f5e, 25);
              g.scene.remove(b.mesh);
              g.bombs.splice(i, 1);
              g.score += 250;
              addPopup("+250 SMASH! 💥", "#f43f5e");
            } else {
              spawnJuiceBurst(b.x, b.y, b.z, 0xf43f5e, 30);
              handleDeath();
              break;
            }
          }
        }

        // Cổng dịch chuyển
        if (g.portalCooldown > 0) {
          g.portalCooldown -= dt;
        } else if (g.portals.length === 2) {
          const [pA, pB] = g.portals;
          if (Math.hypot(g.head.x - pA.x, g.head.z - pA.z) < 2.0) {
            g.head.x = pB.x + Math.sin(g.heading) * 3.5;
            g.head.z = pB.z + Math.cos(g.heading) * 3.5;
            g.portalCooldown = 2.2;
            playCartoonBoing();
            hapticMove();
          } else if (Math.hypot(g.head.x - pB.x, g.head.z - pB.z) < 2.0) {
            g.head.x = pA.x + Math.sin(g.heading) * 3.5;
            g.head.z = pA.z + Math.cos(g.heading) * 3.5;
            g.portalCooldown = 2.2;
            playCartoonBoing();
            hapticMove();
          }
        }

        // Ăn hoa quả
        const hasMagnet = g.magnetTimeLeft > 0;
        for (let i = g.foodItems.length - 1; i >= 0; i--) {
          const item = g.foodItems[i];

          if (hasMagnet) {
            const mDist = Math.hypot(g.head.x - item.x, g.head.z - item.z);
            if (mDist < 9.0 && mDist > 0.5) {
              const pullSpeed = 14.0 * dt;
              item.x += ((g.head.x - item.x) / mDist) * pullSpeed;
              item.z += ((g.head.z - item.z) / mDist) * pullSpeed;
              item.mesh.position.set(item.x, item.y, item.z);
            }
          }

          item.mesh.rotation.y += dt * item.rotationSpeed;

          const eatDist = Math.hypot(g.head.x - item.x, g.head.z - item.z);
          if (eatDist < 1.75) {
            g.eaten += 1;
            const comboMult = g.combo.hit();
            const feverBonus = isFever ? 2.0 : 1.0;
            const boostBonus = g.isBoosting ? 1.5 : 1.0;
            const pts = Math.round(item.points * comboMult * feverBonus * boostBonus);
            g.score += pts;

            let splashColor = 0x22c55e;
            if (item.type === "donut") {
              splashColor = 0xf472b6;
              playDonutChime();
              addSnakeSegments(2);
              addPopup(`+${pts} BÁNH DONUT! 🍩`, "#f472b6");
            } else if (item.type === "strawberry") {
              splashColor = 0xef4444;
              playChomp("strawberry");
              playMagnetWhoosh();
              g.magnetTimeLeft = 6.0;
              setIsMagnetUI(true);
              addSnakeSegments(1);
              addPopup(`+${pts} DÂU TỪ TÍNH! 🧲`, "#ef4444");
            } else if (item.type === "banana") {
              splashColor = 0xfacc15;
              playBananaZip();
              g.boostEnergy = Math.min(100, g.boostEnergy + 40);
              addSnakeSegments(1);
              addPopup(`+${pts} CHUỐI TỐC ĐỘ! 🍌`, "#facc15");
            } else if (item.type === "candycube") {
              splashColor = 0xf97316;
              playChomp("normal");
              g.boostEnergy = 100;
              addSnakeSegments(1);
              addPopup(`+${pts} KẸO NĂNG LƯỢNG! 🍬`, "#f97316");
            } else {
              splashColor = 0x22c55e;
              playChomp("kiwi");
              addSnakeSegments(1);
              addPopup(`+${pts} KIWI XANH! 🥝`, "#4ade80");
            }

            hapticMerge();
            spawnJuiceBurst(item.x, item.y, item.z, splashColor, 18);

            g.scene.remove(item.mesh);
            g.foodItems.splice(i, 1);
            spawnFoodItem();

            const feverGoal = curStage.feverEvery || 6;
            if (g.eaten % feverGoal === 0 && !g.goldenStarPos) {
              spawnGoldenStar();
            }

            const nextStageNum = Math.floor(g.eaten / curStage.goalFruits) + 1;
            if (nextStageNum > g.stage) {
              g.stage = nextStageNum;
              updateStageEnvironment(nextStageNum);
            }

            syncHud();
          }
        }

        // Ăn Trái Sao Hoàng Kim
        if (g.goldenStarPos && g.goldenStarMesh) {
          g.goldenStarPos.ttl -= 1;
          g.goldenStarMesh.rotation.y += dt * 3.0;

          if (g.goldenStarPos.ttl <= 0) {
            g.goldenStarPos = null;
            g.goldenStarMesh.visible = false;
          } else {
            const starDist = Math.hypot(g.head.x - g.goldenStarPos.x, g.head.z - g.goldenStarPos.z);
            if (starDist < 2.1) {
              const goldPts = Math.round(500 * g.combo.mult);
              g.score += goldPts;
              playStarFever();
              hapticMerge();
              spawnJuiceBurst(g.goldenStarPos.x, g.goldenStarPos.y, g.goldenStarPos.z, 0xffd700, 30);

              g.feverTimeLeft = 7.0;
              setIsFeverUI(true);
              setBgmFever(true);

              g.goldenStarPos = null;
              g.goldenStarMesh.visible = false;
              addPopup(`FEVER BẤT TỬ! ⭐ +${goldPts}`, "#ffd700");
              syncHud("FEVER TIME!");
            }
          }
        }
      }

      updateParticles3D(dt);

      if (g.renderer && g.scene && g.camera) {
        g.renderer.render(g.scene, g.camera);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    playing,
    paused,
    spawnFoodItem,
    spawnGoldenStar,
    updateStageEnvironment,
    addSnakeSegments,
    handleDeath,
    syncHud,
    updateParticles3D,
    spawnJuiceBurst,
    addPopup,
    isVi,
  ]);

  const triggerBoost = useCallback((active) => {
    gameRef.current.isBoosting = active;
    if (active) {
      playBoostWhoosh();
      hapticMove();
    }
  }, []);

  // Keyboard controls: Hỗ trợ 4 hướng W/A/S/D & Phím Mũi Tên chuẩn trực quan
  useEffect(() => {
    const g = gameRef.current;

    const onKeyDown = (e) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        g.targetHeading = 0; // Lên (Bắc)
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        g.targetHeading = Math.PI / 2; // Phải (Đông)
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        g.targetHeading = Math.PI; // Xuống (Nam)
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        g.targetHeading = -Math.PI / 2; // Trái (Tây)
      } else if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        triggerBoost(true);
      }
    };

    const onKeyUp = (e) => {
      if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        triggerBoost(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [triggerBoost]);

  // Touch controls: Vuốt hướng nào sang hướng đó trên toàn bộ màn hình điện thoại
  const handleTouchStart = (e) => {
    if (e.target.closest("button")) return;
    const touch = e.touches[0];
    const t = touchStateRef.current;
    t.active = true;
    t.startX = touch.clientX;
    t.startY = touch.clientY;
    t.currentX = touch.clientX;
    t.currentY = touch.clientY;

    setSwipeUI({ active: true, currX: touch.clientX, currY: touch.clientY });
  };

  const handleTouchMove = (e) => {
    const t = touchStateRef.current;
    if (!t.active) return;
    const touch = e.touches[0];
    t.currentX = touch.clientX;
    t.currentY = touch.clientY;

    const dx = touch.clientX - t.startX;
    const dy = touch.clientY - t.startY;
    const dist = Math.hypot(dx, dy);

    if (dist > 10) {
      // Vuốt hướng nào sang hướng đó:
      // dx > 0 (vuốt phải)  -> angle = PI/2 (+X)
      // dx < 0 (vuốt trái)  -> angle = -PI/2 (-X)
      // dy < 0 (vuốt lên)   -> angle = 0 (+Z)
      // dy > 0 (vuốt xuống) -> angle = PI (-Z)
      const angle = Math.atan2(dx, -dy);
      gameRef.current.targetHeading = angle;

      // Di chuyển mốc bắt đầu nếu ngón tay kéo dài để người chơi bẻ lái liên tục mượt mà
      if (dist > 45) {
        const pull = (dist - 45) / dist;
        t.startX += dx * pull;
        t.startY += dy * pull;
      }
    }

    setSwipeUI({ active: true, currX: touch.clientX, currY: touch.clientY });
  };

  const handleTouchEnd = () => {
    const t = touchStateRef.current;
    if (!t.active) return;
    t.active = false;

    const dx = t.currentX - t.startX;
    const dy = t.currentY - t.startY;
    const dist = Math.hypot(dx, dy);
    if (dist > 12) {
      const angle = Math.atan2(dx, -dy);
      gameRef.current.targetHeading = angle;
    }

    // Bé rắn tiếp tục bò theo hướng vừa vuốt, không dừng lại
    setSwipeUI((prev) => ({ ...prev, active: false }));
  };

  const curStage = STORY_STAGES[(hud.stage - 1) % STORY_STAGES.length];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden select-none touch-none"
      style={{ backgroundColor: curStage.bgHex }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* HUD Component */}
      <SnakeHud
        curStage={curStage}
        hud={hud}
        isVi={isVi}
        muted={muted}
        isFeverUI={isFeverUI}
        isMagnetUI={isMagnetUI}
        isBoostingUI={isBoostingUI}
        stageBanner={stageBanner}
        popups={popups}
        countdown={countdown}
        boostBarRef={boostBarRef}
        boostTextRef={boostTextRef}
        onOpenSkinMenu={() => setShowSkinMenu(true)}
        onToggleMute={() => setMuted(toggleAudioMuted())}
      />

      {/* WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Wardrobe Modal */}
      <SnakeSkinModal
        isOpen={showSkinMenu}
        onClose={() => setShowSkinMenu(false)}
        selectedSkin={selectedSkin}
        onSelectSkin={applySkin}
        isVi={isVi}
      />

      {/* Controls Component */}
      <SnakeControls
        isBoostingUI={isBoostingUI}
        onTriggerBoost={triggerBoost}
        swipeUI={swipeUI}
        isVi={isVi}
      />
    </div>
  );
}
