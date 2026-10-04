import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import { playGameMerge, playGameLose } from "../../../utils/audio";
import { hapticMerge, hapticLose, hapticMove } from "../../../utils/haptics";
import { createCombo } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

// ── 5 Thế giới 3D & Chặng thi đấu ──────────────────────────────────────────
const STAGES = [
  {
    key: "snakeStage1",
    nameVi: "Vườn Neon",
    nameEn: "Neon Nexus",
    accent: 0x22d3ee,       // Cyan
    accentHex: "#22d3ee",
    accent2: 0xa78bfa,      // Purple
    accent2Hex: "#a78bfa",
    bg: 0x050414,
    fog: 0x060517,
    gridColor: 0x38bdf8,
    mines: 0,
    speed: 10.5,            // Mượt mà, dễ điều khiển trên điện thoại
  },
  {
    key: "snakeStage2",
    nameVi: "Vùng Nhiệt Hạch",
    nameEn: "Crimson Core",
    accent: 0xfb7185,       // Rose
    accentHex: "#fb7185",
    accent2: 0xf97316,      // Orange
    accent2Hex: "#f97316",
    bg: 0x130308,
    fog: 0x17040a,
    gridColor: 0xf43f5e,
    mines: 2,
    speed: 12.0,
  },
  {
    key: "snakeStage3",
    nameVi: "Vực Lượng Tử",
    nameEn: "Quantum Rift",
    accent: 0x818cf8,       // Indigo
    accentHex: "#818cf8",
    accent2: 0x06b6d4,      // Teal
    accent2Hex: "#06b6d4",
    bg: 0x030d1a,
    fog: 0x041122,
    gridColor: 0x6366f1,
    mines: 2,
    portals: true,
    speed: 13.5,
  },
  {
    key: "snakeStage4",
    nameVi: "Điện Thần Kim Cương",
    nameEn: "Golden Citadel",
    accent: 0xfbbf24,       // Amber Gold
    accentHex: "#fbbf24",
    accent2: 0xf43f5e,      // Rose
    accent2Hex: "#f43f5e",
    bg: 0x150d03,
    fog: 0x1a1004,
    gridColor: 0xeab308,
    mines: 3,
    goldenEvery: 3,
    speed: 15.0,
  },
  {
    key: "snakeStage5",
    nameVi: "Cõi Ma Trận",
    nameEn: "Matrix Nexus",
    accent: 0x34d399,       // Emerald
    accentHex: "#34d399",
    accent2: 0xa3e635,      // Lime
    accent2Hex: "#a3e635",
    bg: 0x02130b,
    fog: 0x03180e,
    gridColor: 0x10b981,
    mines: 4,
    portals: true,
    goldenEvery: 3,
    speed: 16.5,
  },
];

const STAGE_GOAL = 6;
const ARENA_RADIUS = 28; // Tường biên ở [-28, +28]
const SEGMENT_SPACING = 0.95;

// Shared Geometries (Zero-GC Optimization)
const sharedSegGeo = new THREE.IcosahedronGeometry(0.58, 1);
const sharedRingGeo = new THREE.TorusGeometry(0.72, 0.05, 8, 16);

function createGridTexture(gridColorHex, bgColorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = bgColorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Lưới Cyber neon
  ctx.strokeStyle = gridColorHex;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.22;
  const step = 32;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Chấm giao điểm neon
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = gridColorHex;
  for (let x = 0; x <= 512; x += step) {
    for (let y = 0; y <= 512; y += step) {
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

export default function GameSnake({ paused = false, onGameOver }) {
  const { t, i18n } = useTranslation();
  const isVi = (i18n.resolvedLanguage || i18n.language || "vi").startsWith("vi");

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [countdown, setCountdown] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [stageBanner, setStageBanner] = useState(null);
  const bannerTimerRef = useRef(null);
  const [boostLevel, setBoostLevel] = useState(100);
  const [isBoostingUI, setIsBoostingUI] = useState(false);

  const [hud, setHud] = useState({
    score: 0,
    eaten: 0,
    mines: 0,
    combo: 0,
    mult: 1,
    notice: "",
    stage: 1,
    stageName: STAGES[0].nameVi,
  });

  const reportedRef = useRef(false);

  // State game chạy trong requestAnimationFrame độc lập
  const gameRef = useRef({
    // Vị trí và hướng của Linh Thú
    head: { x: 0, y: 0.8, z: 0 },
    heading: 0, // radian
    steerInput: 0,
    isBoosting: false,
    boostEnergy: 100,

    // Chuỗi mắt xích thân rắn 3D
    segments: [], // [{ x, y, z, mesh, ringMesh }]
    segmentCount: 16,

    // Điểm số và trạng thái
    score: 0,
    eaten: 0,
    stage: 1,
    dead: false,
    combo: createCombo({ windowMs: 2800, step: 0.25, max: 3 }),

    // Reusable Vectors (Zero Allocations in Game Loop)
    tempCamTarget: new THREE.Vector3(),
    tempLookTarget: new THREE.Vector3(),

    // Vật phẩm và chướng ngại vật
    foodPos: { x: 0, y: 0.8, z: 10 },
    goldenPos: null, // { x, y, z, ttl }
    mines: [],       // [{ x, y, z, mesh }]
    portals: [],     // [portalA, portalB]
    portalCooldown: 0,

    // Three.js instances
    scene: null,
    camera: null,
    renderer: null,
    headGroup: null,
    headLight: null,
    foodMesh: null,
    goldenMesh: null,
    portalMeshes: [],
    groundMesh: null,
    wallGroup: null,
    particleSystem: null,

    // Pools & Particles
    particles: [], // [{ x, y, z, vx, vy, vz, life, maxLife, color, size }]
  });

  // ── Countdown mở đầu ──────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) {
      setPlaying(true);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 850);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Thông báo chặng chuyển tiếp
  const showStageBanner = useCallback((stageIndex) => {
    const s = STAGES[(stageIndex - 1) % STAGES.length];
    setStageBanner(s);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setStageBanner(null), 2500);
  }, []);

  // ── Khởi tạo Three.js và Vòng Lặp Trò Chơi ────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const g = gameRef.current;
    const curStage = STAGES[(g.stage - 1) % STAGES.length];
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;
    const isMobile = window.innerWidth < 768;

    // 1. Khởi tạo Renderer tối ưu 60fps cho điện thoại
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    g.renderer = renderer;

    // 2. Khởi tạo Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(curStage.bg);
    scene.fog = new THREE.FogExp2(curStage.fog, 0.016);
    g.scene = scene;

    // 3. Khởi tạo Camera Góc Nhìn Thứ 3 (Chase Cam) Adaptive cho Mobile
    const fov = isMobile ? 62 : 56;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.2, 400);
    camera.position.set(0, isMobile ? 7.2 : 5.0, isMobile ? -11.5 : -8.0);
    g.camera = camera;

    // 4. Ánh sáng môi trường
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // 5. Mặt sàn Cyber Arena
    const gridTexture = createGridTexture(curStage.accentHex, "#060515");
    const groundGeo = new THREE.PlaneGeometry(ARENA_RADIUS * 2 + 8, ARENA_RADIUS * 2 + 8);
    const groundMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.06,
      metalness: 0.9,
      color: 0xffffff,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    scene.add(groundMesh);
    g.groundMesh = groundMesh;

    // 6. Tường biên phát sáng (4 bức tường giới hạn)
    const wallGroup = new THREE.Group();
    const railMat = new THREE.MeshBasicMaterial({ color: curStage.accent, transparent: true, opacity: 0.85 });
    const wallHeight = 2.5;

    // Tường Bắc/Nam/Đông/Tây
    const bGeoX = new THREE.BoxGeometry(ARENA_RADIUS * 2, wallHeight, 0.3);
    const bGeoZ = new THREE.BoxGeometry(0.3, wallHeight, ARENA_RADIUS * 2);

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

    // 7. Bụi sao không gian nền (Starfield)
    const starCount = 450;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 220;
      starPositions[i * 3 + 1] = Math.random() * 80 + 5;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.7,
      transparent: true,
      opacity: 0.8,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 8. TẠO ĐẦU LINH THÚ CYBER SERPENT 3D (AVATAR)
    const headGroup = new THREE.Group();

    // Sọ chính (Chassis hình khối vát khí động học)
    const skullGeo = new THREE.ConeGeometry(0.85, 2.2, 5);
    const skullMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      metalness: 0.9,
      roughness: 0.15,
      emissive: curStage.accent,
      emissiveIntensity: 0.35,
    });
    const skullMesh = new THREE.Mesh(skullGeo, skullMat);
    skullMesh.rotation.x = Math.PI / 2;
    headGroup.add(skullMesh);

    // Mắt thần Neon / Cyber Visor kép
    const eyeGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.38, 0.25, 0.4);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.38, 0.25, 0.4);
    headGroup.add(eyeL, eyeR);

    // Cánh fin / vây sừng hai bên
    const finGeo = new THREE.BoxGeometry(0.1, 0.4, 1.2);
    const finMat = new THREE.MeshStandardMaterial({
      color: curStage.accent,
      metalness: 0.8,
      roughness: 0.2,
      emissive: curStage.accent,
      emissiveIntensity: 0.6,
    });
    const finL = new THREE.Mesh(finGeo, finMat);
    finL.position.set(0.7, 0.2, -0.2);
    finL.rotation.z = -0.3;
    const finR = new THREE.Mesh(finGeo, finMat);
    finR.position.set(-0.7, 0.2, -0.2);
    finR.rotation.z = 0.3;
    headGroup.add(finL, finR);

    // Đèn pha trước đầu rọi đường
    const headLight = new THREE.SpotLight(curStage.accent, 3.5, 28, Math.PI / 3.8, 0.5, 1.2);
    headLight.position.set(0, 0.4, 0.5);
    headLight.target.position.set(0, 0, 10);
    headGroup.add(headLight);
    headGroup.add(headLight.target);

    scene.add(headGroup);
    g.headGroup = headGroup;
    g.headLight = headLight;

    // 9. Khởi tạo Thân Rắn 3D (Segments Chain với Shared Geometries)
    g.segments = [];
    for (let i = 0; i < g.segmentCount; i++) {
      const segMat = new THREE.MeshStandardMaterial({
        color: curStage.accent,
        metalness: 0.85,
        roughness: 0.2,
        emissive: curStage.accent2,
        emissiveIntensity: Math.max(0.15, 0.5 - i * 0.015),
      });
      const segMesh = new THREE.Mesh(sharedSegGeo, segMat);

      const ringMat = new THREE.MeshBasicMaterial({
        color: curStage.accent,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(sharedRingGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;

      const segGroup = new THREE.Group();
      segGroup.add(segMesh);
      segGroup.add(ringMesh);

      const initZ = -((i + 1) * SEGMENT_SPACING);
      segGroup.position.set(0, 0.8, initZ);
      scene.add(segGroup);

      g.segments.push({
        x: 0,
        y: 0.8,
        z: initZ,
        group: segGroup,
        segMesh,
        ringMesh,
      });
    }

    // 10. Lõi Năng Lượng 3D (Food Orb)
    const foodGroup = new THREE.Group();
    const foodGeo = new THREE.OctahedronGeometry(0.75, 0);
    const foodMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff007f,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
    });
    const foodCore = new THREE.Mesh(foodGeo, foodMat);
    foodGroup.add(foodCore);

    const fRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    const fRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 8, 24), fRingMat);
    const fRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.04, 8, 24), fRingMat);
    fRing2.rotation.x = Math.PI / 2;
    foodGroup.add(fRing1, fRing2);

    const foodLight = new THREE.PointLight(0xff007f, 3.0, 10);
    foodGroup.add(foodLight);

    foodGroup.position.set(g.foodPos.x, g.foodPos.y, g.foodPos.z);
    scene.add(foodGroup);
    g.foodMesh = foodGroup;

    // 11. Cổng Dịch Chuyển Không Gian 3D (Portals)
    const createPortalMesh = (color) => {
      const pGroup = new THREE.Group();
      const pTorusMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.8,
        metalness: 0.9,
      });
      const pTorus = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.22, 16, 32), pTorusMat);
      pGroup.add(pTorus);

      const pVortexMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const pVortex = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), pVortexMat);
      pGroup.add(pVortex);

      const pLight = new THREE.PointLight(color, 2.0, 12);
      pGroup.add(pLight);
      return pGroup;
    };

    g.portalMeshes = [createPortalMesh(0x38bdf8), createPortalMesh(0xa855f7)];
    g.portalMeshes.forEach((p) => {
      p.visible = false;
      scene.add(p);
    });

    // 12. Hệ Thống Hạt Hào Quang 3D (Particle Pool)
    const maxParticles = 200;
    const partGeo = new THREE.BufferGeometry();
    const partPositions = new Float32Array(maxParticles * 3);
    const partColors = new Float32Array(maxParticles * 3);
    partGeo.setAttribute("position", new THREE.BufferAttribute(partPositions, 3));
    partGeo.setAttribute("color", new THREE.BufferAttribute(partColors, 3));

    const partMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(partGeo, partMat);
    scene.add(particleSystem);
    g.particleSystem = particleSystem;

    // Xử lý Resize Màn Hình
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 600;
      const mob = window.innerWidth < 768;
      camera.fov = mob ? 62 : 56;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      starGeo.dispose();
      groundGeo.dispose();
      partGeo.dispose();
    };
  }, []);

  // ── Spawn Items Helpers ──────────────────────────────────────────────────
  const spawnFood = useCallback(() => {
    const g = gameRef.current;
    const margin = 5;
    g.foodPos = {
      x: (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2),
      y: 0.8,
      z: (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2),
    };
    if (g.foodMesh) {
      g.foodMesh.position.set(g.foodPos.x, g.foodPos.y, g.foodPos.z);
    }
  }, []);

  const spawnGolden = useCallback(() => {
    const g = gameRef.current;
    const margin = 6;
    g.goldenPos = {
      x: (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2),
      y: 1.0,
      z: (Math.random() - 0.5) * (ARENA_RADIUS * 2 - margin * 2),
      ttl: 420, // ~7 giây
    };

    if (!g.goldenMesh && g.scene) {
      const goldGroup = new THREE.Group();
      const goldGeo = new THREE.DodecahedronGeometry(0.9, 0);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 2.0,
        metalness: 0.95,
        roughness: 0.1,
      });
      const goldMesh = new THREE.Mesh(goldGeo, goldMat);
      goldGroup.add(goldMesh);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.05, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffe600 })
      );
      halo.rotation.x = Math.PI / 2;
      goldGroup.add(halo);

      const pLight = new THREE.PointLight(0xffcc00, 3.0, 12);
      goldGroup.add(pLight);

      g.scene.add(goldGroup);
      g.goldenMesh = goldGroup;
    }

    if (g.goldenMesh) {
      g.goldenMesh.position.set(g.goldenPos.x, g.goldenPos.y, g.goldenPos.z);
      g.goldenMesh.visible = true;
    }
  }, []);

  const updateStageEnvironment = useCallback((stageNum) => {
    const g = gameRef.current;
    const stage = STAGES[(stageNum - 1) % STAGES.length];
    if (!g.scene) return;

    g.scene.background.set(stage.bg);
    g.scene.fog.color.set(stage.fog);

    if (g.headLight) g.headLight.color.set(stage.accent);
    if (g.wallGroup) {
      g.wallGroup.children.forEach((w) => {
        w.material.color.set(stage.accent);
      });
    }

    // Cập nhật mìn (Mines)
    if (g.minesMeshGroup) {
      g.scene.remove(g.minesMeshGroup);
    }
    const minesGroup = new THREE.Group();
    g.mines = [];

    if (stage.mines > 0) {
      const mineGeo = new THREE.IcosahedronGeometry(0.75, 0);
      const spikeGeo = new THREE.ConeGeometry(0.18, 0.7, 5);

      for (let i = 0; i < stage.mines; i++) {
        const mx = (Math.random() - 0.5) * (ARENA_RADIUS * 1.5);
        const mz = (Math.random() - 0.5) * (ARENA_RADIUS * 1.5);

        const mSingle = new THREE.Group();
        const core = new THREE.Mesh(
          mineGeo,
          new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            metalness: 0.9,
            emissive: 0xef4444,
            emissiveIntensity: 0.9,
          })
        );
        mSingle.add(core);

        // Gai nhọn chĩa 4 phía
        for (let sp = 0; sp < 6; sp++) {
          const spike = new THREE.Mesh(spikeGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
          if (sp === 0) spike.position.y = 0.8;
          if (sp === 1) { spike.position.y = -0.8; spike.rotation.x = Math.PI; }
          if (sp === 2) { spike.position.x = 0.8; spike.rotation.z = -Math.PI / 2; }
          if (sp === 3) { spike.position.x = -0.8; spike.rotation.z = Math.PI / 2; }
          if (sp === 4) { spike.position.z = 0.8; spike.rotation.x = Math.PI / 2; }
          if (sp === 5) { spike.position.z = -0.8; spike.rotation.x = -Math.PI / 2; }
          mSingle.add(spike);
        }

        mSingle.position.set(mx, 0.8, mz);
        minesGroup.add(mSingle);
        g.mines.push({ x: mx, y: 0.8, z: mz, group: mSingle });
      }
      g.scene.add(minesGroup);
      g.minesMeshGroup = minesGroup;
    }

    // Cập nhật Cổng Dịch Chuyển (Portals)
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

  // Sinh hạt nổ 3D
  const spawnBurst3D = useCallback((x, y, z, colorHex, count = 18) => {
    const g = gameRef.current;
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 4.5;
      g.particles.push({
        x,
        y: y + 0.2,
        z,
        vx: Math.cos(angle) * speed,
        vy: 2.0 + Math.random() * 3.5,
        vz: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        color,
      });
    }
  }, []);

  // Cập nhật Hạt 3D
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

    const maxParts = 200;
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

  // Nối thêm mắt xích thân rắn 3D (Reuses shared geometries)
  const addSnakeSegments = useCallback((count) => {
    const g = gameRef.current;
    const curStage = STAGES[(g.stage - 1) % STAGES.length];
    const lastSeg = g.segments[g.segments.length - 1] || g.head;

    for (let k = 0; k < count; k++) {
      const segMat = new THREE.MeshStandardMaterial({
        color: curStage.accent,
        metalness: 0.85,
        roughness: 0.2,
        emissive: curStage.accent2,
        emissiveIntensity: 0.2,
      });
      const segMesh = new THREE.Mesh(sharedSegGeo, segMat);
      const ringMat = new THREE.MeshBasicMaterial({ color: curStage.accent, transparent: true, opacity: 0.7 });
      const ringMesh = new THREE.Mesh(sharedRingGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;

      const segGroup = new THREE.Group();
      segGroup.add(segMesh);
      segGroup.add(ringMesh);

      segGroup.position.set(lastSeg.x, 0.8, lastSeg.z);
      g.scene.add(segGroup);

      g.segments.push({
        x: lastSeg.x,
        y: 0.8,
        z: lastSeg.z,
        group: segGroup,
        segMesh,
        ringMesh,
      });
    }
  }, []);

  // Đồng bộ HUD
  const syncHud = useCallback((notice) => {
    const g = gameRef.current;
    const curStage = STAGES[(g.stage - 1) % STAGES.length];
    setHud((prev) => ({
      score: g.score,
      eaten: g.eaten,
      mines: g.mines.length,
      combo: g.combo.chain + (g.combo.chain > 0 ? 1 : 0),
      mult: g.combo.mult,
      stage: g.stage,
      stageName: isVi ? curStage.nameVi : curStage.nameEn,
      notice: notice !== undefined ? notice : prev.notice,
    }));
  }, [isVi]);

  // Xử lý Thua Cuộc
  const handleDeath = useCallback(() => {
    const g = gameRef.current;
    if (g.dead) return;
    g.dead = true;

    playGameLose();
    hapticLose();
    spawnBurst3D(g.head.x, g.head.y, g.head.z, 0xff3b30, 40);

    setTimeout(() => {
      if (onGameOver && !reportedRef.current) {
        reportedRef.current = true;
        onGameOver(g.score, g.score >= 1200 ? "win" : "lose");
      }
    }, 1100);
  }, [onGameOver, spawnBurst3D]);

  // ── Vòng Lặp Chính (Game Loop với Zero-Allocation Cam Lerp) ───────────────
  useEffect(() => {
    if (!playing || paused) return;

    let animId;
    let lastTime = performance.now();
    const g = gameRef.current;

    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      if (!g.dead) {
        const curStage = STAGES[(g.stage - 1) % STAGES.length];
        const isMobile = window.innerWidth < 768;

        // 1. Quản lý Boost Stamina
        if (g.isBoosting && g.boostEnergy > 2) {
          g.boostEnergy = Math.max(0, g.boostEnergy - 32 * dt);
        } else {
          g.isBoosting = false;
          g.boostEnergy = Math.min(100, g.boostEnergy + 20 * dt);
        }
        setBoostLevel(Math.round(g.boostEnergy));
        setIsBoostingUI(g.isBoosting);

        // 2. Vận tốc và Đổi hướng mượt mà
        const baseSpeed = curStage.speed;
        const currentSpeed = g.isBoosting ? baseSpeed * 1.55 : baseSpeed;
        const turnSpeed = g.isBoosting ? 3.2 : 3.8;

        g.heading += g.steerInput * turnSpeed * dt;

        // Tiến bước đầu rắn
        g.head.x += Math.sin(g.heading) * currentSpeed * dt;
        g.head.z += Math.cos(g.heading) * currentSpeed * dt;

        // Cập nhật Mesh đầu
        if (g.headGroup) {
          g.headGroup.position.set(g.head.x, g.head.y, g.head.z);
          g.headGroup.rotation.y = g.heading;
          g.headGroup.rotation.z = -g.steerInput * 0.35;
        }

        // 3. Chuỗi Mắt Xích Thân Rắn 3D (Distance-Constraint Trail)
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

          // Hiệu ứng uốn lượn hình sin (Sinuous undulation)
          const wavePhase = timeSec * (g.isBoosting ? 10 : 7) + i * 0.45;
          const undulationY = 0.8 + Math.sin(wavePhase) * (g.isBoosting ? 0.28 : 0.16);
          const lateralWiggle = Math.cos(wavePhase) * (g.isBoosting ? 0.18 : 0.12);

          seg.group.position.set(
            seg.x + Math.cos(g.heading) * lateralWiggle,
            undulationY,
            seg.z - Math.sin(g.heading) * lateralWiggle
          );

          // Xoay hướng theo mắt xích trước
          const segAngle = Math.atan2(dx, dz);
          seg.group.rotation.y = segAngle;

          prevPos = { x: seg.x, y: seg.y, z: seg.z };
        }

        // 4. Camera Thứ 3 (Chase Camera Nâng Cao Góc Nhìn Toàn Cảnh Trên Mobile)
        if (g.camera) {
          const camDist = isMobile ? (g.isBoosting ? 12.8 : 11.2) : (g.isBoosting ? 9.8 : 8.2);
          const camHeight = isMobile ? (g.isBoosting ? 6.2 : 7.2) : (g.isBoosting ? 4.2 : 4.8);
          const lookDist = isMobile ? 6.5 : 4.5;

          const targetCamX = g.head.x - Math.sin(g.heading) * camDist;
          const targetCamY = g.head.y + camHeight;
          const targetCamZ = g.head.z - Math.cos(g.heading) * camDist;

          // Zero-GC Camera Lerp
          g.tempCamTarget.set(targetCamX, targetCamY, targetCamZ);
          g.camera.position.lerp(g.tempCamTarget, 0.14);

          const lookTargetX = g.head.x + Math.sin(g.heading) * lookDist;
          const lookTargetY = g.head.y + 0.6;
          const lookTargetZ = g.head.z + Math.cos(g.heading) * lookDist;

          g.tempLookTarget.set(lookTargetX, lookTargetY, lookTargetZ);
          g.camera.lookAt(g.tempLookTarget);

          g.camera.rotation.z = -g.steerInput * 0.08;
          const targetFov = isMobile ? (g.isBoosting ? 70 : 62) : (g.isBoosting ? 68 : 56);
          g.camera.fov = THREE.MathUtils.lerp(g.camera.fov, targetFov, 0.1);
          g.camera.updateProjectionMatrix();
        }

        // 5. Va chạm Tường Biên (Arena Walls)
        if (
          Math.abs(g.head.x) >= ARENA_RADIUS - 0.5 ||
          Math.abs(g.head.z) >= ARENA_RADIUS - 0.5
        ) {
          handleDeath();
        }

        // 6. Tự cắn đuôi (Self collision sau mắt xích thứ 6)
        for (let i = 6; i < g.segments.length; i++) {
          const s = g.segments[i];
          if (Math.hypot(g.head.x - s.x, g.head.z - s.z) < 0.72) {
            handleDeath();
            break;
          }
        }

        // 7. Va chạm Mìn (Mines)
        for (let i = 0; i < g.mines.length; i++) {
          const m = g.mines[i];
          if (Math.hypot(g.head.x - m.x, g.head.z - m.z) < 1.4) {
            spawnBurst3D(m.x, m.y, m.z, 0xff3b30, 35);
            handleDeath();
            break;
          }
          if (m.group) {
            m.group.rotation.y += dt * 1.5;
          }
        }

        // 8. Cổng Dịch Chuyển (Portals)
        if (g.portalCooldown > 0) {
          g.portalCooldown -= dt;
        } else if (g.portals.length === 2) {
          const pA = g.portals[0];
          const pB = g.portals[1];
          if (Math.hypot(g.head.x - pA.x, g.head.z - pA.z) < 2.0) {
            g.head.x = pB.x + Math.sin(g.heading) * 3.5;
            g.head.z = pB.z + Math.cos(g.heading) * 3.5;
            g.portalCooldown = 2.0;
            spawnBurst3D(pA.x, pA.y, pA.z, 0x38bdf8, 25);
            spawnBurst3D(pB.x, pB.y, pB.z, 0xa855f7, 25);
            hapticMove();
          } else if (Math.hypot(g.head.x - pB.x, g.head.z - pB.z) < 2.0) {
            g.head.x = pA.x + Math.sin(g.heading) * 3.5;
            g.head.z = pA.z + Math.cos(g.heading) * 3.5;
            g.portalCooldown = 2.0;
            spawnBurst3D(pB.x, pB.y, pB.z, 0xa855f7, 25);
            spawnBurst3D(pA.x, pA.y, pA.z, 0x38bdf8, 25);
            hapticMove();
          }
        }

        // 9. Ăn Lõi Năng Lượng Thường (Food Orb)
        if (Math.hypot(g.head.x - g.foodPos.x, g.head.z - g.foodPos.z) < 1.85) {
          g.eaten += 1;
          const comboMult = g.combo.hit();
          const boostBonus = g.isBoosting ? 1.5 : 1.0;
          const pts = Math.round(100 * comboMult * boostBonus);
          g.score += pts;

          playGameMerge();
          hapticMerge();
          spawnBurst3D(g.foodPos.x, g.foodPos.y, g.foodPos.z, curStage.accentHex, 24);

          addSnakeSegments(2);

          const goldenFreq = curStage.goldenEvery || 5;
          if (g.eaten % goldenFreq === 0) {
            spawnGolden();
          }

          const nextStageNum = Math.floor(g.eaten / STAGE_GOAL) + 1;
          if (nextStageNum > g.stage) {
            g.stage = nextStageNum;
            updateStageEnvironment(nextStageNum);
          }

          spawnFood();
          syncHud();
        }

        // 10. Ăn Mồi Vàng (Golden Relic)
        if (g.goldenPos) {
          g.goldenPos.ttl -= 1;
          if (g.goldenPos.ttl <= 0) {
            g.goldenPos = null;
            if (g.goldenMesh) g.goldenMesh.visible = false;
          } else if (Math.hypot(g.head.x - g.goldenPos.x, g.head.z - g.goldenPos.z) < 2.0) {
            const goldPts = Math.round(350 * g.combo.mult);
            g.score += goldPts;
            playGameMerge();
            hapticMerge();
            spawnBurst3D(g.goldenPos.x, g.goldenPos.y, g.goldenPos.z, 0xffd700, 35);
            g.goldenPos = null;
            if (g.goldenMesh) g.goldenMesh.visible = false;
            syncHud(t("arcadeGame.g2048Triple", "LÕI VÀNG +350"));
          }
        }

        // Xoay vật phẩm 3D
        if (g.foodMesh) {
          g.foodMesh.rotation.y += dt * 2.2;
          g.foodMesh.children[0].rotation.x += dt * 1.5;
          g.foodMesh.position.y = 0.8 + Math.sin(timeSec * 3) * 0.2;
        }
        if (g.goldenMesh && g.goldenPos) {
          g.goldenMesh.rotation.y += dt * 3.0;
          g.goldenMesh.position.y = 1.0 + Math.sin(timeSec * 4) * 0.25;
        }
      }

      // 11. Cập nhật Hạt Hào Quang 3D
      updateParticles3D(dt);

      // 12. Render khung hình Three.js
      if (g.renderer && g.scene && g.camera) {
        g.renderer.render(g.scene, g.camera);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [playing, paused, spawnFood, spawnGolden, updateStageEnvironment, t, addSnakeSegments, handleDeath, syncHud, updateParticles3D, spawnBurst3D]);

  // ── Điều Khiển Bàn Phím (Desktop Keyboard) ───────────────────────────────
  useEffect(() => {
    const g = gameRef.current;

    const onKeyDown = (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        g.steerInput = -1;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        g.steerInput = 1;
      } else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space" || e.code === "ShiftLeft") {
        g.isBoosting = true;
      }
    };

    const onKeyUp = (e) => {
      if (
        (e.code === "ArrowLeft" || e.code === "KeyA") && g.steerInput < 0 ||
        (e.code === "ArrowRight" || e.code === "KeyD") && g.steerInput > 0
      ) {
        g.steerInput = 0;
      } else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space" || e.code === "ShiftLeft") {
        g.isBoosting = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── Điều Khiển Cảm Ứng (Touch Drag & Dual-Thumb Virtual Controls) ────────
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;

    if (Math.abs(dx) > 10) {
      gameRef.current.steerInput = Math.max(-1, Math.min(1, dx / 40));
    } else {
      gameRef.current.steerInput = 0;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    gameRef.current.steerInput = 0;
  };

  const triggerBoost = (active) => {
    gameRef.current.isBoosting = active;
    if (active) hapticMove();
  };

  const setSteer = (val) => {
    gameRef.current.steerInput = val;
    if (val !== 0) hapticMove();
  };

  const curStage = STAGES[(hud.stage - 1) % STAGES.length];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden select-none bg-[#050611] touch-none"
      style={{ "--snake-stage": curStage.accentHex, "--snake-stage-2": curStage.accent2Hex }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* HUD Trên Cùng */}
      <div className="relative z-20 w-full max-w-4xl px-4 pt-3 flex flex-col gap-1.5 pointer-events-none">
        <ArcadeHud
          gameId="snake"
          score={hud.score}
          combo={hud.combo}
          multiplier={hud.mult}
          stats={[
            { label: isVi ? "LÕI" : "CORES", value: hud.eaten },
            { label: isVi ? "CHẶNG" : "STAGE", value: hud.stage },
            { label: isVi ? "MÌN" : "MINES", value: hud.mines },
          ]}
          notice={hud.notice}
        />

        {/* Thanh Năng Lượng Lướt Nhanh (Boost Stamina Gauge) */}
        <div className="w-full max-w-md mx-auto flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
          <span className="material-symbols-outlined text-[16px] text-cyan-400" aria-hidden="true">
            speed
          </span>
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${boostLevel}%`,
                background: isBoostingUI
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : "linear-gradient(90deg, #22d3ee, #818cf8)",
                boxShadow: isBoostingUI ? "0 0 12px #ef4444" : "0 0 8px #22d3ee",
              }}
            />
          </div>
          <span className="text-[13px] font-mono font-bold text-white/90">
            {isBoostingUI ? (isVi ? "TĂNG TỐC" : "HYPER") : `${boostLevel}%`}
          </span>
        </div>
      </div>

      {/* Canvas 3D WebGL */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Banner Chặng Thông Báo */}
      {stageBanner && (
        <div className="absolute top-24 z-30 flex flex-col items-center justify-center pointer-events-none animate-bounce">
          <div className="px-6 py-2 rounded-full border border-white/20 bg-black/75 backdrop-blur-xl shadow-2xl flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ background: stageBanner.accentHex, boxShadow: `0 0 14px ${stageBanner.accentHex}` }}
            />
            <span className="text-[16px] font-black tracking-wider uppercase text-white">
              {isVi ? `CHẶNG ${hud.stage}: ${stageBanner.nameVi}` : `STAGE ${hud.stage}: ${stageBanner.nameEn}`}
            </span>
          </div>
        </div>
      )}

      {/* Countdown Khởi Động */}
      {countdown > 0 && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="w-32 h-32 rounded-full border-2 border-cyan-400/80 bg-cyan-950/40 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.5)] animate-pulse">
            <small className="text-[13px] font-bold tracking-widest text-cyan-200">READY</small>
            <span className="text-[64px] font-black leading-none text-white">{countdown}</span>
          </div>
        </div>
      )}

      {/* Nút Điều Khiển Dưới Cùng (Dual-Thumb Ergonomic Mobile Controls) */}
      <div className="relative z-20 w-full max-w-lg px-4 pb-4 flex items-center justify-between pointer-events-auto">
        {/* Cụm Phím Lái Trái / Phải Cho Ngón Cái Trái */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="w-16 h-16 rounded-2xl bg-black/60 active:bg-cyan-500/30 border border-white/20 active:border-cyan-400 flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-all shadow-lg"
            onPointerDown={() => setSteer(-1)}
            onPointerUp={() => setSteer(0)}
            onPointerLeave={() => setSteer(0)}
            aria-label="Rẽ Trái"
          >
            <span className="material-symbols-outlined text-[32px] text-cyan-300">arrow_left</span>
          </button>
          <button
            type="button"
            className="w-16 h-16 rounded-2xl bg-black/60 active:bg-cyan-500/30 border border-white/20 active:border-cyan-400 flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-all shadow-lg"
            onPointerDown={() => setSteer(1)}
            onPointerUp={() => setSteer(0)}
            onPointerLeave={() => setSteer(0)}
            aria-label="Rẽ Phải"
          >
            <span className="material-symbols-outlined text-[32px] text-cyan-300">arrow_right</span>
          </button>
        </div>

        {/* Nút LƯỚT / BOOST Cực Lớn Cho Ngón Cái Phải */}
        <button
          type="button"
          className={`h-16 px-6 rounded-2xl flex items-center gap-2 text-white font-black tracking-wide border shadow-xl backdrop-blur-md transition-all active:scale-95 ${
            isBoostingUI
              ? "bg-gradient-to-r from-amber-500 to-rose-600 border-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.6)]"
              : "bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.4)]"
          }`}
          onPointerDown={() => triggerBoost(true)}
          onPointerUp={() => triggerBoost(false)}
          onPointerLeave={() => triggerBoost(false)}
          aria-label="Lướt Tăng Tốc"
        >
          <span className="material-symbols-outlined text-[26px]">bolt</span>
          <span className="text-[15px]">{isVi ? "LƯỚT (BOOST)" : "BOOST"}</span>
        </button>
      </div>

      {/* Hướng dẫn bàn phím cho Desktop */}
      <div className="relative z-20 pb-2 text-center text-white/50 text-[13px] hidden md:block">
        {isVi
          ? "Phím A / D hoặc ◀ / ▶ để bẻ lái · Giữ Space hoặc W để LƯỚT TĂNG TỐC"
          : "Use A / D or ◀ / ▶ to steer · Hold Space or W to BOOST"}
      </div>
    </div>
  );
}
