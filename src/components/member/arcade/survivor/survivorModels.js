import * as THREE from "three";

// ── Shared Geometry & Material Cache for 60fps Mobile Performance ────────────
const GEO_CACHE = {};
const MAT_CACHE = {};

function getGeo(key, factory) {
  if (!GEO_CACHE[key]) GEO_CACHE[key] = factory();
  return GEO_CACHE[key];
}

function getMat(key, factory) {
  if (!MAT_CACHE[key]) MAT_CACHE[key] = factory();
  return MAT_CACHE[key];
}

// ── TẠO MÔ HÌNH CHIẾN CƠ NGƯỜI CHƠI (X-WING / GALACTIC INTERCEPTOR) ───────────
export function createPlayerStarfighter(weaponLevel = 1) {
  const shipGroup = new THREE.Group();

  // 1. Thân chính (Fuselage) - Trắng kim loại sáng bóng với phản quang xanh
  const bodyGeo = getGeo("player_body", () => new THREE.ConeGeometry(0.55, 3.4, 7));
  const bodyMat = getMat("player_body_mat", () => new THREE.MeshStandardMaterial({
    color: 0xffffff, // Trắng tuyết sáng lấp lánh
    emissive: 0x0369a1,
    emissiveIntensity: 0.15,
    metalness: 0.5,
    roughness: 0.25,
    flatShading: true,
  }));
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.rotation.x = Math.PI / 2;
  bodyMesh.scale.set(0.9, 1.0, 0.45);
  shipGroup.add(bodyMesh);

  // 2. Kính buồng lái (Cockpit Canopy) - Ngọc lam lượng tử phát sáng rực rỡ
  const cockpitGeo = getGeo("player_cockpit", () => new THREE.ConeGeometry(0.32, 1.2, 5));
  const cockpitMat = getMat("player_cockpit_mat", () => new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00b4d8,
    emissiveIntensity: 0.9,
    metalness: 0.9,
    roughness: 0.1,
  }));
  const cockpitMesh = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpitMesh.rotation.x = Math.PI / 2;
  cockpitMesh.position.set(0, 0.18, 0.15);
  shipGroup.add(cockpitMesh);

  // 3. Động cơ đẩy Ion kép (Twin Ion Thrusters)
  const engineGeo = getGeo("player_engine", () => new THREE.CylinderGeometry(0.2, 0.24, 0.9, 8));
  const engineMat = getMat("player_engine_mat", () => new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.25,
  }));

  [-0.42, 0.42].forEach((xPos) => {
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(xPos, 0, 1.2);
    shipGroup.add(engine);

    // Luồng lửa đẩy plasma xanh neon cực sáng
    const plumeGeo = getGeo("engine_plume", () => new THREE.ConeGeometry(0.18, 0.8, 6));
    const plumeMat = getMat("engine_plume_mat", () => new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    }));
    const plume = new THREE.Mesh(plumeGeo, plumeMat);
    plume.rotation.x = -Math.PI / 2;
    plume.position.set(xPos, 0, 1.85);
    plume.name = "engine_plume";
    shipGroup.add(plume);
  });

  // 4. Bốn cánh S-foil (Upper & Lower Wings) - Đỏ đua rực rỡ với sọc vàng
  const wingGeo = getGeo("player_wing", () => new THREE.BoxGeometry(1.6, 0.05, 0.9));
  const wingMat = getMat("player_wing_mat", () => new THREE.MeshStandardMaterial({
    color: 0xef4444, // Đỏ tươi rực rỡ
    emissive: 0x991b1b,
    emissiveIntensity: 0.25,
    metalness: 0.4,
    roughness: 0.3,
  }));

  const wingTopL = new THREE.Mesh(wingGeo, wingMat);
  wingTopL.position.set(-1.0, 0.12, 0.5);
  wingTopL.rotation.z = 0.14;
  shipGroup.add(wingTopL);

  const wingTopR = new THREE.Mesh(wingGeo, wingMat);
  wingTopR.position.set(1.0, 0.12, 0.5);
  wingTopR.rotation.z = -0.14;
  shipGroup.add(wingTopR);

  const wingBotL = new THREE.Mesh(wingGeo, wingMat);
  wingBotL.position.set(-1.0, -0.12, 0.5);
  wingBotL.rotation.z = -0.14;
  shipGroup.add(wingBotL);

  const wingBotR = new THREE.Mesh(wingGeo, wingMat);
  wingBotR.position.set(1.0, -0.12, 0.5);
  wingBotR.rotation.z = 0.14;
  shipGroup.add(wingBotR);

  // ── 5. CÁC NÒNG SÚNG LASER TỐI TÂN GẮN THEO CẤP ĐỘ ──────────────────────────
  const laserBarrelMat = getMat("laser_barrel_mat", () => new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
  }));
  const laserTipMat = getMat("laser_tip_mat", () => new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  }));

  const barrelGeo = getGeo("laser_barrel", () => new THREE.CylinderGeometry(0.04, 0.05, 0.8, 6));
  const tipGeo = getGeo("laser_tip", () => new THREE.CylinderGeometry(0.06, 0.04, 0.2, 6));

  // CẤP 1: 2 Nòng laser gắn thân chính
  [-0.22, 0.22].forEach((xPos) => {
    const barrel = new THREE.Mesh(barrelGeo, laserBarrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(xPos, -0.05, -0.9);
    shipGroup.add(barrel);

    const tip = new THREE.Mesh(tipGeo, laserTipMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(xPos, -0.05, -1.35);
    shipGroup.add(tip);
  });

  // CẤP 2+: Gắn thêm 4 Nòng Laser dài ở 4 đầu cánh
  if (weaponLevel >= 2) {
    const wingBarrelGeo = getGeo("wing_barrel", () => new THREE.CylinderGeometry(0.045, 0.055, 1.2, 6));
    const wingtipPositions = [
      { x: -1.75, y: 0.24, z: 0.2 },
      { x: 1.75, y: 0.24, z: 0.2 },
      { x: -1.75, y: -0.24, z: 0.2 },
      { x: 1.75, y: -0.24, z: 0.2 },
    ];
    wingtipPositions.forEach((pos) => {
      const barrel = new THREE.Mesh(wingBarrelGeo, laserBarrelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(pos.x, pos.y, pos.z - 0.3);
      shipGroup.add(barrel);

      const tip = new THREE.Mesh(tipGeo, laserTipMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(pos.x, pos.y, pos.z - 0.95);
      shipGroup.add(tip);
    });
  }

  // CẤP 3+: Ống phóng Ngư Lôi Ion Plasma vàng rực
  if (weaponLevel >= 3) {
    const podGeo = getGeo("torpedo_pod", () => new THREE.BoxGeometry(0.24, 0.18, 0.6));
    const podMat = getMat("torpedo_pod_mat", () => new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.2,
    }));
    [-0.6, 0.6].forEach((xPos) => {
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(xPos, 0, 0.2);
      shipGroup.add(pod);
    });
  }

  // CẤP 4+: Tháp pháo Ray Tachyon lưng tàu tím neon
  if (weaponLevel >= 4) {
    const turretBaseGeo = getGeo("turret_base", () => new THREE.CylinderGeometry(0.25, 0.3, 0.16, 8));
    const turretBaseMat = getMat("turret_base_mat", () => new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.5,
      metalness: 0.85,
      roughness: 0.2,
    }));
    const turretBase = new THREE.Mesh(turretBaseGeo, turretBaseMat);
    turretBase.position.set(0, 0.32, 0.6);
    shipGroup.add(turretBase);

    const twinCannonGeo = getGeo("twin_cannon", () => new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6));
    const twinCannonMat = getMat("twin_cannon_mat", () => new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    [-0.08, 0.08].forEach((xOffset) => {
      const cannon = new THREE.Mesh(twinCannonGeo, twinCannonMat);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(xOffset, 0.42, 0.3);
      shipGroup.add(cannon);
    });
  }

  // CẤP 5: Lõi Siêu Năng Lượng Overdrive vàng kim
  if (weaponLevel >= 5) {
    const coreGeo = getGeo("overdrive_core", () => new THREE.SphereGeometry(0.26, 8, 8));
    const coreMat = getMat("overdrive_core_mat", () => new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
    }));
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, -0.22, 0.2);
    coreMesh.name = "overdrive_core";
    shipGroup.add(coreMesh);
  }

  // Khiên năng lượng bảo vệ
  const shieldGeo = getGeo("ship_shield", () => new THREE.SphereGeometry(2.3, 14, 10));
  const shieldMat = getMat("ship_shield_mat", () => new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    wireframe: true,
  }));
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.name = "shield_mesh";
  shipGroup.add(shieldMesh);

  return shipGroup;
}

// ── TẠO MÔ HÌNH TÀU ĐỊCH: TIE INTERCEPTOR (ẢNH 3) ─────────────────────────────
export function createTieInterceptor() {
  const tieGroup = new THREE.Group();

  // 1. Buồng lái cầu (Command Pod) - Xám than chì ánh kim
  const podGeo = getGeo("tie_pod", () => new THREE.SphereGeometry(0.55, 10, 8));
  const podMat = getMat("tie_pod_mat", () => new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.25,
  }));
  const pod = new THREE.Mesh(podGeo, podMat);
  tieGroup.add(pod);

  // Kính buồng lái mắt đỏ rực phát sáng
  const windowGeo = getGeo("tie_window", () => new THREE.CircleGeometry(0.26, 8));
  const windowMat = getMat("tie_window_mat", () => new THREE.MeshBasicMaterial({
    color: 0xff0044, // Mắt đỏ phát sáng rực rỡ
  }));
  const win = new THREE.Mesh(windowGeo, windowMat);
  win.position.set(0, 0, 0.52);
  tieGroup.add(win);

  // Trục nối cánh
  const strutGeo = getGeo("tie_strut", () => new THREE.CylinderGeometry(0.1, 0.1, 2.2, 6));
  const strutMat = getMat("tie_strut_mat", () => new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.8,
  }));
  const strut = new THREE.Mesh(strutGeo, strutMat);
  strut.rotation.z = Math.PI / 2;
  tieGroup.add(strut);

  // 2. Hai cánh pin mặt trời với viền phản quang xanh lơ
  const wingGeo = getGeo("tie_wing", () => new THREE.BoxGeometry(0.06, 1.8, 1.4));
  const wingMat = getMat("tie_wing_mat", () => new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
  }));

  [-1.1, 1.1].forEach((xPos) => {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(xPos, 0, 0);
    tieGroup.add(wing);

    // Viền trắng phản quang góc cánh
    const edgeGeo = getGeo("tie_edge", () => new THREE.BoxGeometry(0.08, 1.85, 0.1));
    const edgeMat = getMat("tie_edge_mat", () => new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const edgeFront = new THREE.Mesh(edgeGeo, edgeMat);
    edgeFront.position.set(xPos, 0, 0.7);
    tieGroup.add(edgeFront);

    const edgeBack = new THREE.Mesh(edgeGeo, edgeMat);
    edgeBack.position.set(xPos, 0, -0.7);
    tieGroup.add(edgeBack);
  });

  return tieGroup;
}

// ── TẠO MÔ HÌNH TÀU ĐUA NĂNG LƯỢNG KÉP (PODRACER SKIMMER - ẢNH 1) ──────────────
export function createPodSkimmer() {
  const podGroup = new THREE.Group();

  const nacelleGeo = getGeo("pod_nacelle", () => new THREE.CylinderGeometry(0.42, 0.48, 1.8, 8));
  const nacelleMat = getMat("pod_nacelle_mat", () => new THREE.MeshStandardMaterial({
    color: 0xf97316, // Màu cam rực lửa
    emissive: 0xc2410c,
    emissiveIntensity: 0.35,
    metalness: 0.7,
    roughness: 0.3,
  }));

  [-1.1, 1.1].forEach((xPos) => {
    const nacelle = new THREE.Mesh(nacelleGeo, nacelleMat);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(xPos, 0, 0.2);
    podGroup.add(nacelle);

    // Cánh quạt tua-bin hút gió phía trước
    const bladeGeo = getGeo("pod_blade", () => new THREE.ConeGeometry(0.38, 0.3, 8));
    const bladeMat = getMat("pod_blade_mat", () => new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Vàng điện quang
      emissive: 0xeab308,
      emissiveIntensity: 0.4,
      metalness: 0.9,
    }));
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.rotation.x = Math.PI / 2;
    blade.position.set(xPos, 0, 1.15);
    podGroup.add(blade);
  });

  // Tia hồ quang Plasma tím chớp sáng rực rỡ
  const arcGeo = getGeo("pod_plasma_arc", () => new THREE.CylinderGeometry(0.06, 0.06, 2.0, 6));
  const arcMat = getMat("pod_plasma_arc_mat", () => new THREE.MeshBasicMaterial({
    color: 0xf43f5e, // Hồng tím rực rỡ
    blending: THREE.AdditiveBlending,
  }));
  const arcMesh = new THREE.Mesh(arcGeo, arcMat);
  arcMesh.rotation.z = Math.PI / 2;
  arcMesh.position.set(0, 0, 0.6);
  arcMesh.name = "plasma_arc";
  podGroup.add(arcMesh);

  // Buồng lái kéo lê đằng sau
  const cockpitGeo = getGeo("pod_cockpit", () => new THREE.ConeGeometry(0.3, 0.9, 6));
  const cockpitMat = getMat("pod_cockpit_mat", () => new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    roughness: 0.5,
  }));
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.rotation.x = Math.PI / 2;
  cockpit.position.set(0, -0.15, -1.2);
  podGroup.add(cockpit);

  return podGroup;
}

// ── TẠO MÔ HÌNH TRÙM TỐI THƯỢNG: CỔNG WARP RING XUYÊN THỜI KHÔNG (ẢNH 2) ────────
export function createHyperspaceRingBoss() {
  const bossGroup = new THREE.Group();

  // 1. Vòng xuyến Hyperdrive Ring khổng lồ - Đỏ thẫm hoàng gia
  const ringGeo = getGeo("boss_ring", () => new THREE.TorusGeometry(3.6, 0.35, 12, 32));
  const ringMat = getMat("boss_ring_mat", () => new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x991b1b,
    emissiveIntensity: 0.45,
    metalness: 0.85,
    roughness: 0.25,
  }));
  const ring = new THREE.Mesh(ringGeo, ringMat);
  bossGroup.add(ring);

  // Vành phát sáng dẫn đường Hyperdrive màu xanh ngọc cực sáng
  const glowRingGeo = getGeo("boss_glow_ring", () => new THREE.TorusGeometry(3.6, 0.1, 8, 32));
  const glowRingMat = getMat("boss_glow_ring_mat", () => new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    blending: THREE.AdditiveBlending,
  }));
  const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
  bossGroup.add(glowRing);

  // 2. Hai cụm động cơ Warp đối xứng trên vành
  const engineGeo = getGeo("boss_engine", () => new THREE.CylinderGeometry(0.7, 0.85, 2.6, 10));
  const engineMat = getMat("boss_engine_mat", () => new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.3,
  }));

  [-3.6, 3.6].forEach((xPos) => {
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(xPos, 0, 0);
    bossGroup.add(engine);

    // Lõi năng lượng động cơ phát sáng vàng
    const coreGeo = getGeo("boss_engine_core", () => new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8));
    const coreMat = getMat("boss_engine_core_mat", () => new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      blending: THREE.AdditiveBlending,
    }));
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(xPos, 0, 1.35);
    bossGroup.add(core);
  });

  // 3. Tàu chỉ huy trung tâm
  const bridgeGeo = getGeo("boss_bridge", () => new THREE.BoxGeometry(2.4, 0.45, 1.6));
  const bridgeMat = getMat("boss_bridge_mat", () => new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.7,
  }));
  const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
  bossGroup.add(bridge);

  // Cầu mắt quét Laser đỏ rực
  const eyeGeo = getGeo("boss_eye", () => new THREE.SphereGeometry(0.55, 10, 10));
  const eyeMat = getMat("boss_eye_mat", () => new THREE.MeshBasicMaterial({
    color: 0xff0044,
  }));
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.set(0, 0, 0.8);
  eye.name = "boss_eye";
  bossGroup.add(eye);

  return bossGroup;
}

// ── TẠO ĐẠN LASER CHUYÊN BIỆT: BẮN THẲNG 100%, LÕI TRẮNG RỰC RỠ + HÀO QUANG NEON ───
export function createLaserBoltMesh(isEnemy = false, isHeavy = false) {
  const group = new THREE.Group();

  // 1. Lõi tia laser trắng tinh khiết siêu sáng ở giữa (Pure White High-energy Core)
  const coreGeo = isHeavy
    ? getGeo("bolt_core_heavy", () => new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6))
    : getGeo("bolt_core_norm", () => new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6));
  const coreMat = getMat("bolt_core_white_mat", () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = Math.PI / 2;
  group.add(core);

  // 2. Vỏ hào quang Neon phát sáng rực rỡ bao bọc bên ngoài (Additive Neon Aura)
  const glowGeo = isHeavy
    ? getGeo("bolt_glow_heavy", () => new THREE.CylinderGeometry(0.22, 0.22, 2.7, 6))
    : getGeo("bolt_glow_norm", () => new THREE.CylinderGeometry(0.14, 0.14, 2.1, 6));

  const glowColor = isEnemy ? 0x00ff66 : isHeavy ? 0xff007f : 0x00f0ff;
  const glowMatKey = isEnemy ? "bolt_glow_enemy" : isHeavy ? "bolt_glow_heavy" : "bolt_glow_player";
  const glowMat = getMat(glowMatKey, () => new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  }));

  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = Math.PI / 2;
  group.add(glow);

  return group;
}

// Tạo texture đốm sáng hình tròn mềm mại cho ngàn sao (Soft Circular Star Glow Sprite)
let cachedStarTexture = null;
function getStarGlowTexture() {
  if (cachedStarTexture) return cachedStarTexture;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.18, "rgba(255, 255, 255, 0.9)");
  grad.addColorStop(0.45, "rgba(125, 211, 252, 0.35)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  cachedStarTexture = new THREE.CanvasTexture(canvas);
  return cachedStarTexture;
}

// Tạo texture đám mây tinh vân đa sắc mượt mà không lộ góc cạnh (Volumetric Cloud Canvas)
function createNebulaTexture(r, g, b) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
  grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.25)`);
  grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, 0.08)`);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// ── TẠO HẬU CẢNH GALAXY VÔ TẬN TUYỆT ĐẸP (INFINITE GALAXY & NEBULAE SYSTEM) ───
export function createCosmicEnvironment() {
  const envGroup = new THREE.Group();
  const starTexture = getStarGlowTexture();

  // 1. Hệ thống Tinh Vân Ngân Hà Mềm Mại Vô Tận (Soft Interstellar Nebula Clouds)
  const nebulaConfigs = [
    { r: 139, g: 92, b: 246, x: -48, y: 18, z: -190, w: 140, h: 90 }, // Tinh vân Tím Sâu Deep Violet
    { r: 6, g: 182, b: 212, x: 42, y: -16, z: -210, w: 150, h: 100 },  // Tinh vân Xanh Ngọc Carina Cyan
    { r: 236, g: 72, b: 153, x: -26, y: -26, z: -175, w: 120, h: 80 },  // Tinh vân Hồng Magenta Void
    { r: 245, g: 158, b: 11, x: 32, y: 28, z: -200, w: 110, h: 75 },   // Tinh vân Vàng Kim Hổ Phách Gold
    { r: 59, g: 130, b: 246, x: 0, y: 0, z: -230, w: 180, h: 120 },     // Lõi Ngân Hà Xanh Lam Sâu Galactic Core
  ];

  const nebulae = [];
  nebulaConfigs.forEach((cfg) => {
    const tex = createNebulaTexture(cfg.r, cfg.g, cfg.b);
    const planeGeo = new THREE.PlaneGeometry(cfg.w, cfg.h);
    const planeMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const nebMesh = new THREE.Mesh(planeGeo, planeMat);
    nebMesh.position.set(cfg.x, cfg.y, cfg.z);
    envGroup.add(nebMesh);
    nebulae.push(nebMesh);
  });

  // 2. Hệ thống Ngàn Sao Đa Tầng Lấp Lánh Hình Tròn (Infinite Galaxy Point Starfield)
  // LỚP 1: Bụi sao nền Ngân Hà sâu thẳm (Deep Stardust - 1,200 hạt sao li ti)
  const bgStarCount = 1200;
  const bgStarGeo = new THREE.BufferGeometry();
  const bgStarPos = new Float32Array(bgStarCount * 3);
  for (let i = 0; i < bgStarCount; i++) {
    bgStarPos[i * 3] = (Math.random() - 0.5) * 320;
    bgStarPos[i * 3 + 1] = (Math.random() - 0.5) * 220;
    bgStarPos[i * 3 + 2] = -120 - Math.random() * 200;
  }
  bgStarGeo.setAttribute("position", new THREE.BufferAttribute(bgStarPos, 3));
  const bgStarMat = new THREE.PointsMaterial({
    size: 1.8,
    map: starTexture,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0x93c5fd,
  });
  const bgStarPoints = new THREE.Points(bgStarGeo, bgStarMat);
  envGroup.add(bgStarPoints);

  // LỚP 2: Ngàn sao chính siêu tốc bay dọc trục Z (Foreground Streaming Stars - 800 sao)
  const starCount = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starPalette = [
    new THREE.Color(0xffffff), // Sao trắng tinh khôi
    new THREE.Color(0x38bdf8), // Sao xanh lam
    new THREE.Color(0xa78bfa), // Sao tím huyền diệu
    new THREE.Color(0xfef08a), // Sao vàng kim rạng rỡ
    new THREE.Color(0xf472b6), // Sao hồng dạ quang
  ];

  for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 260;
    const y = (Math.random() - 0.5) * 180;
    const z = -60 - Math.random() * 200;

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    const col = starPalette[Math.floor(Math.random() * starPalette.length)];
    starColors[i * 3] = col.r;
    starColors[i * 3 + 1] = col.g;
    starColors[i * 3 + 2] = col.b;
  }

  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 2.4,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  envGroup.add(starPoints);

  // 3. Vệt bụi không gian siêu tốc (Hyperspace Speed Dust Streaks)
  const dustCount = 45;
  const dustGeo = getGeo("dust_geo", () => new THREE.CylinderGeometry(0.04, 0.04, 2.2, 4));
  const dustMat = getMat("dust_mat", () => new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  }));
  const dustParticles = [];
  for (let i = 0; i < dustCount; i++) {
    const dust = new THREE.Mesh(dustGeo, dustMat);
    dust.rotation.x = Math.PI / 2;
    dust.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 25,
      -10 - Math.random() * 80
    );
    dust.userData = { speed: 50 + Math.random() * 50 };
    envGroup.add(dust);
    dustParticles.push(dust);
  }

  // 4. Hành tinh Khí Khổng Lồ Tuyệt Đẹp (Glowing Sapphire Celestial Planet)
  const planetGeo = getGeo("gas_planet", () => new THREE.SphereGeometry(22, 24, 24));
  const planetMat = getMat("gas_planet_mat", () => new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.55,
    roughness: 0.45,
    metalness: 0.2,
  }));
  const planet = new THREE.Mesh(planetGeo, planetMat);
  planet.position.set(45, 18, -170);
  envGroup.add(planet);

  // Quầng sáng khí quyển (Atmospheric Halo Glow)
  const haloGeo = getGeo("planet_halo", () => new THREE.SphereGeometry(23.2, 24, 24));
  const haloMat = getMat("planet_halo_mat", () => new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  }));
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.copy(planet.position);
  envGroup.add(halo);

  // Vành đai phát sáng ngọc bích
  const ringGeo = getGeo("planet_rings", () => new THREE.RingGeometry(27, 40, 32));
  const ringMat = getMat("planet_rings_mat", () => new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
  }));
  const rings = new THREE.Mesh(ringGeo, ringMat);
  rings.rotation.x = Math.PI / 2.3;
  rings.rotation.y = 0.25;
  rings.position.copy(planet.position);
  envGroup.add(rings);

  // 5. Thiên thạch ở cánh gà bên ngoài
  const asteroidGeo = getGeo("asteroid_geo", () => new THREE.DodecahedronGeometry(1.4, 0));
  const asteroidMat = getMat("asteroid_mat", () => new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.8,
    metalness: 0.4,
    flatShading: true,
  }));

  const asteroids = [];
  for (let i = 0; i < 6; i++) {
    const ast = new THREE.Mesh(asteroidGeo, asteroidMat);
    const scale = 0.9 + Math.random() * 1.3;
    ast.scale.set(scale, scale, scale);
    const side = i % 2 === 0 ? -1 : 1;
    ast.position.set(
      side * (22 + Math.random() * 14),
      (Math.random() - 0.5) * 16,
      -50 - Math.random() * 90
    );
    ast.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    envGroup.add(ast);
    asteroids.push(ast);
  }

  return { envGroup, starPoints, starGeo, starCount, planet, rings, asteroids, dustParticles, nebulae };
}

// ── HIỆU ỨNG NỔ TÀU KHÔNG GIAN HOÀNH TRÁNG (CINEMATIC 3D EXPLOSIONS) ───────────
export function createExplosionInstance(pos, scale = 1.0, isBoss = false) {
  const group = new THREE.Group();
  group.position.copy(pos);

  // 1. Chớp sáng ban đầu (Flash Burst)
  const flashGeo = getGeo("explosion_flash", () => new THREE.SphereGeometry(1.6, 8, 8));
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
  });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  group.add(flashMesh);

  // 2. Quả cầu lửa nổ tung (Fireball Core) rực sáng
  const fireGeo = getGeo("explosion_fireball", () => new THREE.SphereGeometry(1.2, 10, 8));
  const fireMat = new THREE.MeshBasicMaterial({
    color: isBoss ? 0xff2200 : 0xff7700,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });
  const fireball = new THREE.Mesh(fireGeo, fireMat);
  group.add(fireball);

  // 3. Vòng sóng xung kích năng lượng (Shockwave Ring) nở rộng
  const shockGeo = getGeo("explosion_shockwave", () => new THREE.RingGeometry(0.8, 1.5, 24));
  const shockMat = new THREE.MeshBasicMaterial({
    color: isBoss ? 0x00f0ff : 0xfbbf24,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const shockwave = new THREE.Mesh(shockGeo, shockMat);
  shockwave.rotation.x = Math.PI / 2;
  group.add(shockwave);

  // 4. Mảnh vỡ kim loại bốc cháy văng tung tóe (Burning Hull Shrapnel)
  const debrisGeo = getGeo("explosion_debris", () => new THREE.TetrahedronGeometry(0.26, 0));
  const debrisMat = getMat("explosion_debris_mat", () => new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0xff4400,
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.8,
    flatShading: true,
  }));

  const debrisPieces = [];
  const debrisCount = isBoss ? 20 : 10;
  for (let i = 0; i < debrisCount; i++) {
    const chunk = new THREE.Mesh(debrisGeo, debrisMat);
    const speed = (isBoss ? 22 : 14) + Math.random() * (isBoss ? 20 : 12);
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;

    chunk.userData = {
      vx: Math.cos(theta) * Math.cos(phi) * speed,
      vy: Math.sin(phi) * speed,
      vz: Math.sin(theta) * Math.cos(phi) * speed,
      rotX: (Math.random() - 0.5) * 18,
      rotY: (Math.random() - 0.5) * 18,
    };
    group.add(chunk);
    debrisPieces.push(chunk);
  }

  return {
    group,
    flashMesh,
    flashMat,
    fireball,
    fireMat,
    shockwave,
    shockMat,
    debrisPieces,
    scale,
    isBoss,
    life: 0,
    maxLife: isBoss ? 1.1 : 0.65,
  };
}

// Cập nhật vòng đời nổ tàu (Fireball + Shockwave + Debris)
export function updateExplosions(explosions, dt, scene) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.life += dt;
    const progress = Math.min(1, exp.life / exp.maxLife);

    // Chớp sáng đầu frame
    if (exp.flashMesh) {
      if (progress > 0.25) {
        exp.flashMat.opacity = 0;
      } else {
        exp.flashMat.opacity = (1 - progress * 4);
        exp.flashMesh.scale.setScalar(exp.scale * (1 + progress * 4));
      }
    }

    // Cầu lửa nở to rồi tàn
    const fireScale = exp.scale * (1 + progress * 3.8);
    exp.fireball.scale.setScalar(fireScale);
    exp.fireMat.opacity = Math.max(0, (1 - progress) * 0.95);

    // Sóng xung kích giãn nở
    const shockScale = exp.scale * (1 + progress * 5.5);
    exp.shockwave.scale.setScalar(shockScale);
    exp.shockMat.opacity = Math.max(0, (1 - progress) * 0.85);

    // Mảnh vỡ kim loại văng xa & xoay
    for (let c = 0; c < exp.debrisPieces.length; c++) {
      const chunk = exp.debrisPieces[c];
      chunk.position.x += chunk.userData.vx * dt;
      chunk.position.y += chunk.userData.vy * dt;
      chunk.position.z += chunk.userData.vz * dt;
      chunk.rotation.x += chunk.userData.rotX * dt;
      chunk.rotation.y += chunk.userData.rotY * dt;
    }

    if (exp.life >= exp.maxLife) {
      scene.remove(exp.group);
      explosions.splice(i, 1);
    }
  }
}

// ── TIA LỬA BẬT RA KHI LASER BẮN TRÚNG GIÁP (IMPACT SPARKS) ───────────────────
export function createImpactSparkBurst(pos, color = 0x00f0ff) {
  const sparkGeo = getGeo("spark_geo", () => new THREE.SphereGeometry(0.14, 4, 4));
  const sparkMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Group();
  group.position.copy(pos);

  const sparks = [];
  for (let i = 0; i < 8; i++) {
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    const angle = Math.random() * Math.PI * 2;
    const spd = 8 + Math.random() * 12;
    spark.userData = {
      vx: Math.cos(angle) * spd,
      vy: (Math.random() - 0.5) * spd,
      vz: Math.sin(angle) * spd + 12,
    };
    group.add(spark);
    sparks.push(spark);
  }

  return { group, sparks, sparkMat, life: 0, maxLife: 0.28 };
}

// Cập nhật tia lửa bắn trúng
export function updateImpactSparks(sparksList, dt, scene) {
  for (let i = sparksList.length - 1; i >= 0; i--) {
    const sp = sparksList[i];
    sp.life += dt;
    const prog = Math.min(1, sp.life / sp.maxLife);
    sp.sparkMat.opacity = 1 - prog;

    for (let s = 0; s < sp.sparks.length; s++) {
      const spark = sp.sparks[s];
      spark.position.x += spark.userData.vx * dt;
      spark.position.y += spark.userData.vy * dt;
      spark.position.z += spark.userData.vz * dt;
    }

    if (sp.life >= sp.maxLife) {
      scene.remove(sp.group);
      sparksList.splice(i, 1);
    }
  }
}

// ── CHỚP LỬA ĐẦU NÒNG SÚNG KHI BẮN (MUZZLE FLASH) ────────────────────────────
export function createMuzzleFlash(pos, color = 0x00f0ff) {
  const flashGeo = getGeo("muzzle_flash_geo", () => new THREE.ConeGeometry(0.24, 0.65, 6));
  const flashMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.rotation.x = -Math.PI / 2;
  flashMesh.position.copy(pos);
  return { mesh: flashMesh, flashMat, life: 0, maxLife: 0.08 };
}

// Cập nhật chớp lửa đầu nòng súng
export function updateMuzzleFlashes(flashes, dt, scene) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    const fl = flashes[i];
    fl.life += dt;
    fl.flashMat.opacity = Math.max(0, 1 - (fl.life / fl.maxLife));
    fl.mesh.scale.setScalar(1 + (fl.life / fl.maxLife) * 1.5);
    if (fl.life >= fl.maxLife) {
      scene.remove(fl.mesh);
      flashes.splice(i, 1);
    }
  }
}
