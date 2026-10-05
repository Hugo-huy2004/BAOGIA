import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { hapticMerge, hapticLose } from "../../../utils/haptics";
import {
  SURVIVOR_MAX_HP,
  MAX_WEAPON_LEVEL,
  WEAPON_TIERS,
  BASE_MINIONS_PER_STAGE,
  getStageConfig,
  createStageMinion,
  createStageBoss,
  choosePowerupDrop,
} from "./survivor/survivorLogic";
import {
  createPlayerStarfighter,
  createTieInterceptor,
  createPodSkimmer,
  createHyperspaceRingBoss,
  createLaserBoltMesh,
  createCosmicEnvironment,
  createExplosionInstance,
  updateExplosions,
  createImpactSparkBurst,
  updateImpactSparks,
  createMuzzleFlash,
  updateMuzzleFlashes,
} from "./survivor/survivorModels";
import {
  playLaserShot,
  playEnemyLaser,
  playExplosion3D,
  playHitMarker,
  playHyperLaserBeam,
  playUpgradePickup,
  playShieldHit,
  playWarpPortalOpen,
  startSpaceBgm,
  stopSpaceBgm,
  toggleAudioMuted,
  isAudioMuted,
} from "./survivor/survivorAudio";
import SurvivorHud from "./survivor/SurvivorHud";
import SurvivorControls from "./survivor/SurvivorControls";

export default function GameSpaceSurvivor({ paused = false, onGameOver }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const reportedRef = useRef(false);

  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // React UI States
  const [hp, setHp] = useState(SURVIVOR_MAX_HP);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);
  const [stageProgress, setStageProgress] = useState({ kills: 0, total: BASE_MINIONS_PER_STAGE, stage: 1 });
  const [bossInfo, setBossInfo] = useState(null);
  const [notice, setNotice] = useState("");
  const [muted, setMuted] = useState(isAudioMuted());
  const [isOverdriveReady, setIsOverdriveReady] = useState(false);
  const [isOverdriveActive, setIsOverdriveActive] = useState(false);
  const [overdrivePercent, setOverdrivePercent] = useState(0);
  const [isAutoFire, setIsAutoFire] = useState(true);
  const isAutoFireRef = useRef(isAutoFire);
  isAutoFireRef.current = isAutoFire;
  const [joystickUI, setJoystickUI] = useState({ active: false, x: 0, y: 0, dx: 0, dy: 0 });

  // Game internal state ref (hoạt động độc lập trong requestAnimationFrame)
  const gameRef = useRef({
    score: 0,
    hp: SURVIVOR_MAX_HP,
    weaponLevel: 1,
    stage: 1,
    stageState: "minions", // "minions" | "boss_incoming" | "boss" | "stage_clear"
    minionsSpawned: 0,
    minionsKilled: 0,
    totalMinions: BASE_MINIONS_PER_STAGE,
    maxActive: 4,
    shield: 1,
    overdrive: 0,
    isOverdriveActive: false,
    overdriveEndTime: 0,
    lastPlayerShot: 0,
    playerPos: { x: 0, y: 0, z: 0 },
    targetPos: { x: 0, y: 0 },
    keys: { a: false, d: false, w: false, s: false, space: false },
    touchSteer: { x: 0, y: 0 },
    playerLasers: [],
    enemyLasers: [],
    enemies: [],
    powerups: [],
    explosions: [],
    sparks: [],
    flashes: [],
    bossMesh: null,
    bossData: null,
    cameraShake: 0,
    superLaserMesh: null,
  });

  const handleToggleMute = useCallback(() => {
    const isNowMuted = toggleAudioMuted();
    setMuted(isNowMuted);
  }, []);

  const triggerOverdrive = useCallback(() => {
    const g = gameRef.current;
    if (g.overdrive < 100 || g.isOverdriveActive) return;
    g.overdrive = 0;
    g.isOverdriveActive = true;
    g.overdriveEndTime = Date.now() + 3200;
    setIsOverdriveActive(true);
    setIsOverdriveReady(false);
    setOverdrivePercent(0);
    playHyperLaserBeam();
    setNotice("SIÊU LASER LƯỢNG TỬ ĐÃ KÍCH HOẠT!");
    setTimeout(() => setNotice(""), 2200);
  }, []);

  // ── KHỞI TẠO THREE.JS VÀ VÒNG LẶP CHIẾN TRANH VŨ TRỤ 3D ─────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 540;

    // 1. Scene & Camera Góc Nhìn Tác Chiến Vũ Trụ Chuẩn Xác
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060919, 0.003);

    // Camera hơi nâng cao và nhìn chúi xuống mặt phẳng y=0
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 350);
    camera.position.set(0, 5.2, 10.2);
    camera.lookAt(0, 0, -26);

    const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      powerPreference: "high-performance",
      precision: "mediump",
      antialias: !isMobile,
      alpha: false,
    });
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1.0, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x060919, 1);

    // 2. Hệ thống Chiếu Sáng Đa Điểm Rực Rỡ (4-Point Sci-Fi Dynamic Lighting)
    // Ánh sáng Mặt Trời Vàng Ấm Chiếu Rọi
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    sunLight.position.set(25, 35, 20);
    scene.add(sunLight);

    // Ánh sáng Tinh Vân Xanh Tím Huyền Ảo từ cánh trái (Nebula Fill)
    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    fillLight.position.set(-25, -15, 10);
    scene.add(fillLight);

    // Ánh sáng Viền Phản Quang Cyan từ sau lưng (Rim Light)
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    rimLight.position.set(0, 10, -40);
    scene.add(rimLight);

    // Ánh sáng Môi Trường Sáng Rõ Không Bị Tối
    const ambientLight = new THREE.AmbientLight(0x334155, 0.95);
    scene.add(ambientLight);

    // Vật liệu chớp trắng khi bị trúng đạn (Hit-flash)
    const hitFlashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 3. Hậu cảnh Vũ trụ 3D (Tinh vân rực rỡ, ngàn sao và bụi không gian)
    const { envGroup, starGeo, starCount, planet, rings, asteroids, dustParticles, nebulae } = createCosmicEnvironment();
    scene.add(envGroup);

    // 4. Tạo mô hình Phi thuyền Người chơi (Căn chuẩn mặt phẳng y=0)
    let playerShip = createPlayerStarfighter(gameRef.current.weaponLevel);
    playerShip.position.set(0, 0, 0);
    scene.add(playerShip);

    // Chùm Siêu Laser Overdrive (ẩn sẵn)
    const superLaserGeo = new THREE.CylinderGeometry(0.9, 1.5, 60, 12, 1, true);
    const superLaserMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const superLaserMesh = new THREE.Mesh(superLaserGeo, superLaserMat);
    superLaserMesh.rotation.x = -Math.PI / 2;
    superLaserMesh.position.set(0, 0, -30);
    scene.add(superLaserMesh);
    gameRef.current.superLaserMesh = superLaserMesh;

    // ── HỆ THỐNG QUẢN LÝ TIẾN TRÌNH THEO CHẶNG (STAGE COMBAT SYSTEM) ───────────
    const spawnMinion = (stageNum, idx) => {
      const g = gameRef.current;
      const data = createStageMinion(stageNum, idx);
      let mesh;
      if (data.archetype.type === "pod") {
        mesh = createPodSkimmer();
      } else if (data.archetype.type === "heavy") {
        mesh = createHyperspaceRingBoss();
        mesh.scale.set(0.42, 0.42, 0.42);
      } else {
        mesh = createTieInterceptor();
      }
      mesh.position.set(data.x, 0, data.z);
      scene.add(mesh);
      g.enemies.push({ ...data, mesh, hitFlashUntil: 0 });
    };

    const triggerBossEncounter = (stageNum) => {
      const g = gameRef.current;
      if (g.stageState === "boss_incoming" || g.stageState === "boss") return;
      g.stageState = "boss_incoming";

      playWarpPortalOpen();
      setNotice(`CẢNH BÁO: TRÙM CHẶNG ${stageNum} ĐANG XUẤT HIỆN!`);
      g.cameraShake = Math.max(g.cameraShake, 0.7);

      setTimeout(() => {
        if (!containerRef.current) return;
        g.stageState = "boss";
        const bossData = createStageBoss(stageNum);
        g.bossData = bossData;
        setBossInfo({
          nameVi: bossData.nameVi,
          hp: bossData.hp,
          maxHp: bossData.maxHp,
          stage: stageNum,
        });

        const bossMesh = createHyperspaceRingBoss();
        bossMesh.position.set(0, 0, -70);
        scene.add(bossMesh);
        g.bossMesh = bossMesh;
      }, 1500);
    };

    const startStage = (stageNum) => {
      const g = gameRef.current;
      const s = Math.max(1, stageNum || 1);
      const cfg = getStageConfig(s);

      g.stage = s;
      g.stageState = "minions";
      g.totalMinions = cfg.totalMinions;
      g.maxActive = cfg.maxActive;
      g.minionsSpawned = 0;
      g.minionsKilled = 0;
      g.bossData = null;
      if (g.bossMesh) {
        scene.remove(g.bossMesh);
        g.bossMesh = null;
      }
      setBossInfo(null);
      setStage(s);
      setStageProgress({ kills: 0, total: cfg.totalMinions, stage: s });
      setNotice(`CHẶNG ${s}: TIÊU DIỆT ${cfg.totalMinions} TÀU ĐỊCH!`);
      setTimeout(() => setNotice(""), 2200);

      // Dọn sạch đạn laser cũ
      g.enemyLasers.forEach((el) => scene.remove(el.mesh));
      g.enemyLasers = [];

      // Dọn sạch lính cũ nếu còn
      g.enemies.forEach((en) => scene.remove(en.mesh));
      g.enemies = [];

      // Khởi động đội hình lính ban đầu
      const initialCount = Math.min(cfg.maxActive, cfg.totalMinions);
      for (let i = 0; i < initialCount; i++) {
        spawnMinion(s, i);
        g.minionsSpawned++;
      }
    };

    startStage(1);
    startSpaceBgm();

    // ── VÒNG LẶP KHÔNG GIAN 60FPS SIÊU MƯỢT (CONTINUOUS RENDERING & STREAMING) ──
    let animId = null;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      animId = requestAnimationFrame(loop);
      if (pausedRef.current) return;

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const g = gameRef.current;
      const nowMs = Date.now();

      // Giảm rung màn hình (Camera Shake Trauma Decay)
      g.cameraShake = Math.max(0, g.cameraShake - dt * 2.8);

      // 1. NGÀN SAO PHÓNG TỚI TẤP (Hyperspace Continuous Warp Starfield)
      if (starGeo && starGeo.attributes.position) {
        const starPos = starGeo.attributes.position.array;
        const starSpeed = 52 + Math.min(g.stage * 4, 32);
        for (let i = 0; i < starCount; i++) {
          starPos[i * 3 + 2] += starSpeed * dt;
          if (starPos[i * 3 + 2] > 18) {
            starPos[i * 3 + 2] = -210 - Math.random() * 50;
            starPos[i * 3] = (Math.random() - 0.5) * 260;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 180;
          }
        }
        starGeo.attributes.position.needsUpdate = true;
      }

      // 2. Cập nhật Hậu cảnh Vũ trụ 3D (Tinh vân, Hành tinh, Bụi tốc độ)
      if (planet) planet.rotation.y += 0.001;
      if (rings) rings.rotation.z += 0.0006;
      if (nebulae) {
        nebulae.forEach((neb, nIdx) => {
          neb.rotation.z += 0.0003 + nIdx * 0.0001;
        });
      }
      asteroids.forEach((ast, idx) => {
        ast.rotation.x += 0.004 + idx * 0.001;
        ast.rotation.y += 0.006;
        ast.position.z += 8 * dt;
        if (ast.position.z > 20) ast.position.z = -100;
      });

      // Vệt bụi tốc độ không gian lướt qua
      if (dustParticles) {
        dustParticles.forEach((dp) => {
          dp.position.z += (dp.userData.speed + g.stage * 3) * dt;
          if (dp.position.z > 16) {
            dp.position.z = -90;
            dp.position.x = (Math.random() - 0.5) * 40;
            dp.position.y = (Math.random() - 0.5) * 25;
          }
        });
      }

      // 3. Luồng lửa động cơ phản lực người chơi phập phồng ánh sáng liên tục
      playerShip.traverse((child) => {
        if (child.name === "engine_plume") {
          const pulse = 1 + Math.sin(nowMs * 0.04) * 0.22;
          child.scale.set(pulse, 1 + Math.cos(nowMs * 0.05) * 0.3, pulse);
        }
      });

      // 4. Di chuyển Phi thuyền Người chơi trên mặt phẳng y=0
      if (g.keys.a) g.targetPos.x -= 22 * dt;
      if (g.keys.d) g.targetPos.x += 22 * dt;
      if (g.touchSteer.x !== 0) {
        g.targetPos.x += g.touchSteer.x * 24 * dt;
      }

      g.targetPos.x = Math.max(-12.5, Math.min(12.5, g.targetPos.x));
      g.playerPos.x += (g.targetPos.x - g.playerPos.x) * 14 * dt;
      playerShip.position.set(g.playerPos.x, 0, 0);

      // Độ nghiêng xoay cánh khi bẻ lái khí động học (Banking)
      const bankAngle = -(g.targetPos.x - g.playerPos.x) * 0.45;
      playerShip.rotation.z = Math.max(-0.6, Math.min(0.6, bankAngle));

      // Camera bám theo phi thuyền + Rung chấn Camera Shake khi nổ
      const shakeX = (Math.random() - 0.5) * g.cameraShake * 0.9;
      const shakeY = (Math.random() - 0.5) * g.cameraShake * 0.9;
      camera.position.x = g.playerPos.x * 0.4 + shakeX;
      camera.position.y = 5.2 + shakeY;
      camera.position.z = 10.2;
      camera.lookAt(g.playerPos.x * 0.4, 0, -26);

      // Khiên năng lượng người chơi
      const shieldMesh = playerShip.getObjectByName("shield_mesh");
      if (shieldMesh) {
        shieldMesh.material.opacity = g.shield > 0 ? 0.35 : 0;
        if (g.shield > 0) shieldMesh.rotation.y += 0.02;
      }

      // 5. Xử lý Bắn Laser Người Chơi: BẮN THẲNG 100%, KHÔNG LỆCH, KHÔNG QUAY
      const currentTier = WEAPON_TIERS[g.weaponLevel] || WEAPON_TIERS[1];
      if ((isAutoFireRef.current || g.keys.space) && nowMs - g.lastPlayerShot >= currentTier.cooldownMs) {
        g.lastPlayerShot = nowMs;
        const playerPanX = Math.max(-0.85, Math.min(0.85, g.playerPos.x / 13));
        playLaserShot(g.weaponLevel, playerPanX);

        const spawnLaser = (offsetX, isHeavy = false) => {
          const bolt = createLaserBoltMesh(false, isHeavy);
          const startX = g.playerPos.x + offsetX;
          bolt.position.set(startX, 0, -1.2);
          scene.add(bolt);

          g.playerLasers.push({
            mesh: bolt,
            damage: isHeavy ? currentTier.damage * 1.5 : currentTier.damage,
            vz: -115,
          });

          // Chớp lửa nòng súng
          const flash = createMuzzleFlash(new THREE.Vector3(startX, 0, -1.3), isHeavy ? 0xff007f : 0x00f0ff);
          scene.add(flash.mesh);
          g.flashes.push(flash);
        };

        // Cấp 1: 2 nòng thân
        spawnLaser(-0.24);
        spawnLaser(0.24);

        // Cấp 2+: 4 nòng đầu cánh
        if (g.weaponLevel >= 2) {
          spawnLaser(-1.75);
          spawnLaser(1.75);
        }

        // Cấp 4+: Tháp pháo Tachyon
        if (g.weaponLevel >= 4) {
          spawnLaser(-0.1, true);
          spawnLaser(0.1, true);
        }
      }

      // 6. Siêu Laser Overdrive (Chiếu thẳng, không xoay)
      if (g.isOverdriveActive) {
        if (nowMs > g.overdriveEndTime) {
          g.isOverdriveActive = false;
          setIsOverdriveActive(false);
          superLaserMesh.material.opacity = 0;
        } else {
          superLaserMesh.position.set(g.playerPos.x, 0, -30);
          superLaserMesh.material.opacity = 0.85 + Math.sin(nowMs * 0.02) * 0.15;
          g.cameraShake = Math.max(g.cameraShake, 0.4);

          // Hủy toàn bộ đạn địch
          g.enemyLasers.forEach((el) => scene.remove(el.mesh));
          g.enemyLasers = [];

          // Thiêu đốt toàn bộ kẻ thù trong phạm vi chùm tia
          g.enemies.forEach((enemy) => {
            if (Math.abs(enemy.mesh.position.x - g.playerPos.x) < 3.8) {
              enemy.hp -= 25 * dt;
            }
          });

          if (g.bossMesh && g.bossData) {
            if (Math.abs(g.bossMesh.position.x - g.playerPos.x) < 4.8) {
              g.bossData.hp -= 30 * dt;
            }
          }
        }
      }

      // 7. Cập nhật Đạn Laser Người Chơi (Bay thẳng tắp theo trục Z)
      for (let i = g.playerLasers.length - 1; i >= 0; i--) {
        const pl = g.playerLasers[i];
        pl.mesh.position.z += pl.vz * dt;
        if (pl.mesh.position.z < -85) {
          scene.remove(pl.mesh);
          g.playerLasers.splice(i, 1);
        }
      }

      // 8. CUNG ỨNG QUÁI LÍNH LIÊN TỤC (Active Combat Pool: Không bao giờ trống trơn)
      if (g.stageState === "minions") {
        while (g.enemies.length < g.maxActive && g.minionsSpawned < g.totalMinions) {
          spawnMinion(g.stage, g.minionsSpawned);
          g.minionsSpawned++;
        }
      }

      // 9. Cập nhật Kẻ Thù & Xử Lý Trúng Đạn / Nổ Tàu
      for (let eIdx = g.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = g.enemies[eIdx];
        enemy.mesh.position.z += enemy.archetype.speed * dt;

        // Hoàn nguyên vật liệu sau khi chớp trắng
        if (enemy.hitFlashUntil && nowMs > enemy.hitFlashUntil) {
          enemy.hitFlashUntil = 0;
          enemy.mesh.traverse((child) => {
            if (child.isMesh && child.userData.origMat) {
              child.material = child.userData.origMat;
            }
          });
        }

        // Đường bay lượn lách
        if (enemy.archetype.type === "pod") {
          enemy.mesh.position.x += Math.sin(currentTime * 0.005 + eIdx) * 12 * dt;
          enemy.mesh.rotation.z = Math.sin(currentTime * 0.005 + eIdx) * 0.4;
        } else {
          enemy.mesh.position.x += Math.cos(currentTime * 0.003 + eIdx) * 6 * dt;
        }

        // Địch bắn trả laser xanh (kèm âm thanh định hướng không gian)
        if (nowMs - enemy.lastShotTime >= enemy.archetype.fireRateMs && enemy.mesh.position.z < -8) {
          enemy.lastShotTime = nowMs + Math.random() * 400;
          const ePanX = Math.max(-0.85, Math.min(0.85, enemy.mesh.position.x / 13));
          playEnemyLaser(ePanX);
          const eBolt = createLaserBoltMesh(true, false);
          eBolt.position.copy(enemy.mesh.position);
          scene.add(eBolt);
          g.enemyLasers.push({
            mesh: eBolt,
            vz: 46,
          });
        }

        // Kiểm tra trúng đạn người chơi (Collision Detection chuẩn xác trên y=0)
        let enemyDied = false;
        for (let lIdx = g.playerLasers.length - 1; lIdx >= 0; lIdx--) {
          const laser = g.playerLasers[lIdx];
          const dist = enemy.mesh.position.distanceTo(laser.mesh.position);

          if (dist < enemy.archetype.radius) {
            enemy.hp -= laser.damage;
            playHitMarker();
            g.cameraShake = Math.min(0.6, g.cameraShake + 0.04);

            // Bật tia lửa va chạm
            const spark = createImpactSparkBurst(laser.mesh.position, 0x00f0ff);
            scene.add(spark.group);
            g.sparks.push(spark);

            // Chớp trắng toàn thân tàu địch để người chơi nhận biết trúng đạn 100%
            enemy.mesh.traverse((child) => {
              if (child.isMesh && child.material) {
                if (!child.userData.origMat) child.userData.origMat = child.material;
                child.material = hitFlashMat;
              }
            });
            enemy.hitFlashUntil = nowMs + 80;

            // Xóa đạn laser đã trúng
            scene.remove(laser.mesh);
            g.playerLasers.splice(lIdx, 1);

            // Nạp năng lượng Siêu Laser
            g.overdrive = Math.min(100, g.overdrive + 3.8);
            setOverdrivePercent(g.overdrive);
            if (g.overdrive >= 100 && !g.isOverdriveActive) setIsOverdriveReady(true);

            if (enemy.hp <= 0) {
              enemyDied = true;
              break;
            }
          }
        }

        // Tàu địch nổ tung (HOÀNH TRÁNG: LỬA + SÓNG KÍCH + MẢNH VỠ BAY + SUB-BASS ĐỊNH HƯỚNG 3D)
        if (enemyDied) {
          const isHeavy = enemy.archetype.type === "heavy";
          const expPanX = Math.max(-0.85, Math.min(0.85, enemy.mesh.position.x / 13));
          playExplosion3D(isHeavy ? 0.9 : 0.55, expPanX);
          hapticMerge();
          g.cameraShake = Math.min(1.1, g.cameraShake + (isHeavy ? 0.5 : 0.3));

          // Kích hoạt vụ nổ 3D
          const exp = createExplosionInstance(enemy.mesh.position, isHeavy ? 1.6 : 1.1, isHeavy);
          scene.add(exp.group);
          g.explosions.push(exp);

          // Cập nhật điểm số
          const addedScore = enemy.archetype.score;
          g.score += addedScore;
          setScore(g.score);

          // Lưu kỷ lục cá nhân an toàn không gây crash
          try {
            const curBest = Number(localStorage.getItem("hugo_space_wars_highscore") || 0);
            if (g.score > curBest) {
              localStorage.setItem("hugo_space_wars_highscore", String(g.score));
            }
          } catch { /* ignore storage error */ }

          // Rơi hòm nâng cấp vũ khí 3D
          if (Math.random() < 0.28) {
            const pType = choosePowerupDrop(g.hp, g.weaponLevel);
            const pGeo = new THREE.OctahedronGeometry(0.7, 0);
            const pColor = pType === "core" ? 0xfacc15 : pType === "shield" ? 0x38bdf8 : pType === "overdrive" ? 0xc084fc : 0x4ade80;
            const pMat = new THREE.MeshStandardMaterial({
              color: pColor,
              emissive: pColor,
              emissiveIntensity: 0.6,
              metalness: 0.8,
            });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.copy(enemy.mesh.position);
            scene.add(pMesh);
            g.powerups.push({ type: pType, mesh: pMesh });
          }

          scene.remove(enemy.mesh);
          g.enemies.splice(eIdx, 1);

          // Cập nhật tiến trình chặng
          g.minionsKilled++;
          setStageProgress({ kills: g.minionsKilled, total: g.totalMinions, stage: g.stage });

          // Kiểm tra xem đã hoàn thành toàn bộ mục tiêu tàu nhỏ của chặng chưa
          if (g.minionsKilled >= g.totalMinions && g.enemies.length === 0) {
            triggerBossEncounter(g.stage);
          }
          continue;
        }

        // TÀU ĐỊCH BAY QUA NGƯỜI CHƠI (z > 14) MÀ CHƯA CHẾT:
        // VÒNG LẠI TẬP KÍCH - KHÔNG XÓA để người chơi luôn có mục tiêu liên tục, không bao giờ trống trơn!
        if (enemy.mesh.position.z > 14) {
          enemy.mesh.position.z = -65 - Math.random() * 15;
          enemy.mesh.position.x = (Math.random() - 0.5) * 22;
        }
      }

      // 10. CẬP NHẬT BOSS (Hyperspace Ring Dreadnought - Máu Gấp X Lần)
      if (g.bossMesh && g.bossData && g.stageState === "boss") {
        if (g.bossMesh.position.z < g.bossData.targetZ) {
          g.bossMesh.position.z += 14 * dt;
        }

        g.bossMesh.rotation.z += 0.015;
        g.bossMesh.position.x = Math.sin(currentTime * 0.0014) * 8.5;

        // Boss bắn pháo plasma: Số nòng bắn và độ dày tăng theo chặng
        if (nowMs - g.bossData.lastShotTime >= g.bossData.fireRateMs) {
          g.bossData.lastShotTime = nowMs;
          playEnemyLaser();

          const bStage = g.bossData.stage || g.stage;
          let offsets = [-3.5, 3.5];
          if (bStage >= 3) {
            offsets = [-4.0, -1.8, 1.8, 4.0];
          } else if (bStage >= 2) {
            offsets = [-3.5, 0, 3.5];
          }

          offsets.forEach((offset) => {
            const bBolt = createLaserBoltMesh(true, true);
            bBolt.position.set(g.bossMesh.position.x + offset, 0, g.bossMesh.position.z + 1.2);
            scene.add(bBolt);
            g.enemyLasers.push({ mesh: bBolt, vz: 42 + Math.min(bStage * 2, 20) });
          });
        }

        // Boss trúng đạn laser người chơi
        for (let lIdx = g.playerLasers.length - 1; lIdx >= 0; lIdx--) {
          const laser = g.playerLasers[lIdx];
          const dist = g.bossMesh.position.distanceTo(laser.mesh.position);

          if (dist < g.bossData.radius) {
            g.bossData.hp -= laser.damage;
            playHitMarker();
            g.cameraShake = Math.min(0.8, g.cameraShake + 0.06);

            const spark = createImpactSparkBurst(laser.mesh.position, 0xf43f5e);
            scene.add(spark.group);
            g.sparks.push(spark);

            scene.remove(laser.mesh);
            g.playerLasers.splice(lIdx, 1);

            g.overdrive = Math.min(100, g.overdrive + 3);
            setOverdrivePercent(g.overdrive);
            if (g.overdrive >= 100 && !g.isOverdriveActive) setIsOverdriveReady(true);

            setBossInfo((prev) => (prev ? { ...prev, hp: Math.max(0, g.bossData.hp) } : null));

            // Trùm bị tiêu diệt: Chuỗi nổ liên hoàn
            if (g.bossData.hp <= 0 && g.stageState === "boss") {
              g.stageState = "stage_clear";
              playExplosion3D(1.3);
              hapticMerge();
              g.cameraShake = 1.2;

              // Đại nổ Warp Core
              const bossExp = createExplosionInstance(g.bossMesh.position, 3.5, true);
              scene.add(bossExp.group);
              g.explosions.push(bossExp);

              // Các vụ nổ phụ hai bên động cơ
              [-3.6, 3.6].forEach((xOff) => {
                const subPos = new THREE.Vector3(g.bossMesh.position.x + xOff, 0, g.bossMesh.position.z);
                const subExp = createExplosionInstance(subPos, 2.0, false);
                scene.add(subExp.group);
                g.explosions.push(subExp);
              });

              // Rơi lõi nâng cấp vũ khí chắc chắn từ Boss
              const pGeo = new THREE.OctahedronGeometry(0.9, 0);
              const pMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                emissive: 0xfacc15,
                emissiveIntensity: 0.8,
                metalness: 0.9,
              });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              pMesh.position.copy(g.bossMesh.position);
              scene.add(pMesh);
              g.powerups.push({ type: "core", mesh: pMesh });

              const currentDefeatedStage = g.stage;
              const defeatedScore = g.bossData.score;
              g.score += defeatedScore;
              setScore(g.score);

              scene.remove(g.bossMesh);
              g.bossMesh = null;
              g.bossData = null;
              setBossInfo(null);

              setNotice(`CHIẾN THẮNG CHẶNG ${currentDefeatedStage}! TIẾN VÀO CHẶNG ${currentDefeatedStage + 1}!`);

              setTimeout(() => {
                startStage(currentDefeatedStage + 1);
              }, 2200);
              break;
            }
          }
        }
      }

      // 11. Cập nhật Đạn Địch & Va Chạm với Phi Thuyền Người Chơi
      for (let i = g.enemyLasers.length - 1; i >= 0; i--) {
        const el = g.enemyLasers[i];
        el.mesh.position.z += el.vz * dt;

        const dist = el.mesh.position.distanceTo(playerShip.position);
        if (dist < 1.35) {
          scene.remove(el.mesh);
          g.enemyLasers.splice(i, 1);

          if (g.shield > 0) {
            g.shield--;
            playShieldHit();
            g.cameraShake = 0.35;
            const spk = createImpactSparkBurst(playerShip.position, 0x38bdf8);
            scene.add(spk.group);
            g.sparks.push(spk);
            setNotice("Khiên năng lượng đã chắn đạn!");
            setTimeout(() => setNotice(""), 1200);
          } else {
            g.hp = Math.max(0, g.hp - 1);
            setHp(g.hp);
            playExplosion3D(0.4);
            hapticLose();
            g.cameraShake = 0.7;

            const spk = createImpactSparkBurst(playerShip.position, 0xff4400);
            scene.add(spk.group);
            g.sparks.push(spk);

            // Giảm 1 cấp súng khi trúng đạn
            if (g.weaponLevel > 1) {
              g.weaponLevel--;
              setWeaponLevel(g.weaponLevel);
              scene.remove(playerShip);
              playerShip = createPlayerStarfighter(g.weaponLevel);
              playerShip.position.copy(g.playerPos);
              scene.add(playerShip);
            }

            // Phi thuyền người chơi nổ tung khi hết HP
            if (g.hp <= 0 && !reportedRef.current) {
              reportedRef.current = true;
              stopSpaceBgm();
              const pExp = createExplosionInstance(playerShip.position, 2.2, false);
              scene.add(pExp.group);
              g.explosions.push(pExp);
              scene.remove(playerShip);

              setTimeout(() => {
                if (onGameOverRef.current) onGameOverRef.current(g.score, "lose");
              }, 1200);
              return;
            }
          }
          continue;
        }

        if (el.mesh.position.z > 15) {
          scene.remove(el.mesh);
          g.enemyLasers.splice(i, 1);
        }
      }

      // 12. Cập nhật Hòm Nâng Cấp Năng Lượng
      for (let pIdx = g.powerups.length - 1; pIdx >= 0; pIdx--) {
        const p = g.powerups[pIdx];
        p.mesh.rotation.x += 0.03;
        p.mesh.rotation.y += 0.04;
        p.mesh.position.z += 10 * dt;

        const dist = p.mesh.position.distanceTo(playerShip.position);
        if (dist < 1.8) {
          playUpgradePickup();
          hapticMerge();
          scene.remove(p.mesh);
          g.powerups.splice(pIdx, 1);

          if (p.type === "core") {
            if (g.weaponLevel < MAX_WEAPON_LEVEL) {
              g.weaponLevel++;
              setWeaponLevel(g.weaponLevel);
              scene.remove(playerShip);
              playerShip = createPlayerStarfighter(g.weaponLevel);
              playerShip.position.copy(g.playerPos);
              scene.add(playerShip);
              setNotice(`NÂNG CẤP: ${WEAPON_TIERS[g.weaponLevel].nameVi.toUpperCase()}!`);
            } else {
              g.score += 500;
              setScore(g.score);
              setNotice("NÒNG SÚNG TỐI ĐA: +500 ĐIỂM!");
            }
          } else if (p.type === "shield") {
            g.shield = Math.min(2, g.shield + 1);
            setNotice("ĐÃ NẠP KHIÊN LƯỢNG TỬ!");
          } else if (p.type === "repair") {
            g.hp = Math.min(SURVIVOR_MAX_HP, g.hp + 1);
            setHp(g.hp);
            setNotice("SỬA CHỮA THÂN TÀU (+1 HP)!");
          } else if (p.type === "overdrive") {
            g.overdrive = Math.min(100, g.overdrive + 40);
            setOverdrivePercent(g.overdrive);
            if (g.overdrive >= 100 && !g.isOverdriveActive) setIsOverdriveReady(true);
            setNotice("NẠP SIÊU LASER OVERDRIVE!");
          }
          setTimeout(() => setNotice(""), 1600);
          continue;
        }

        if (p.mesh.position.z > 15) {
          scene.remove(p.mesh);
          g.powerups.splice(pIdx, 1);
        }
      }

      // 13. Cập nhật Hiệu ứng Cháy Nổ, Tia Lửa và Chớp Nòng Súng
      updateExplosions(g.explosions, dt, scene);
      updateImpactSparks(g.sparks, dt, scene);
      updateMuzzleFlashes(g.flashes, dt, scene);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    // ── XỬ LÝ PHÍM BÀN PHÍM ─────────────────────────────────────────────────
    const handleKeyDown = (e) => {
      const code = e.code;
      if (code === "KeyA" || code === "ArrowLeft") gameRef.current.keys.a = true;
      if (code === "KeyD" || code === "ArrowRight") gameRef.current.keys.d = true;
      if (code === "Space") gameRef.current.keys.space = true;
      if (code === "KeyE") triggerOverdrive();
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      if (code === "KeyA" || code === "ArrowLeft") gameRef.current.keys.a = false;
      if (code === "KeyD" || code === "ArrowRight") gameRef.current.keys.d = false;
      if (code === "Space") gameRef.current.keys.space = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Xử lý Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      stopSpaceBgm();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [triggerOverdrive]);

  // ── XỬ LÝ CẢM ỨNG VUỐT LÁI TRÊN MOBILE ─────────────────────────────────────
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    const tTouch = e.touches[0];
    touchStartRef.current = { x: tTouch.clientX, y: tTouch.clientY };
    setJoystickUI({ active: true, x: tTouch.clientX, y: tTouch.clientY, dx: 0, dy: 0 });
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const tTouch = e.touches[0];
    const dx = tTouch.clientX - touchStartRef.current.x;
    const dy = tTouch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;
    const clampDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const steerX = (Math.cos(angle) * clampDist) / maxRadius;
    const steerY = -(Math.sin(angle) * clampDist) / maxRadius;
    gameRef.current.touchSteer = { x: steerX, y: steerY };

    setJoystickUI((prev) => ({
      ...prev,
      dx: Math.cos(angle) * clampDist,
      dy: Math.sin(angle) * clampDist,
    }));
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    gameRef.current.touchSteer = { x: 0, y: 0 };
    setJoystickUI({ active: false, x: 0, y: 0, dx: 0, dy: 0 });
  };

  return (
    <div
      ref={containerRef}
      style={{ touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full min-h-[560px] bg-slate-950 overflow-hidden select-none"
    >
      {/* ── HUD CHIẾN TRANH VŨ TRỤ (SLIM, GỌN GÀNG, SANG TRỌNG) ─────────────── */}
      <SurvivorHud
        hp={hp}
        maxHp={SURVIVOR_MAX_HP}
        weaponLevel={weaponLevel}
        score={score}
        stage={stage}
        bossInfo={bossInfo}
        notice={notice}
        muted={muted}
        onToggleMute={handleToggleMute}
        stageProgress={stageProgress}
      />

      {/* WebGL Canvas do React quản lý trực tiếp, không can thiệp DOM ngoài luồng */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0 pointer-events-none" />

      {/* ── CỤM ĐIỀU KHIỂN DƯỚI CÙNG ────────────────────────────────────────── */}
      <SurvivorControls
        isOverdriveReady={isOverdriveReady}
        isOverdriveActive={isOverdriveActive}
        overdrivePercent={overdrivePercent}
        isAutoFire={isAutoFire}
        onToggleAutoFire={() => setIsAutoFire((prev) => !prev)}
        onTriggerOverdrive={triggerOverdrive}
        joystickUI={joystickUI}
      />
    </div>
  );
}
