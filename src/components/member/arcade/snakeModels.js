// ─── 3D Procedural Cartoon Models Factory (High-Performance Mobile Optimized) ─
// Tối ưu hóa tối đa cho di động:
// 1. KHÔNG dùng PointLight rải rác trên từng hoa quả/vật phẩm (tránh quá tải fragment shader, gây giật lag & nóng máy).
// 2. Tận dụng màu phát quang (Emissive Material) nhẹ nhàng, rực rỡ phong cách Hoạt hình.
// 3. Bộ nhớ đệm Geometries & Materials dùng chung (Zero-GC Pooling) - không cấp phát mới trong game loop.
// 4. Giảm số lượng đỉnh (poly count) tối ưu 60fps trên điện thoại mát mẻ, tiết kiệm pin.

import * as THREE from "three";

// ── Bảng màu và thông tin 5 Bộ Ngoại Trang (Skins) ─────────────────────────
export const SNAKE_SKINS = {
  blue: {
    id: "blue",
    nameVi: "Bé Lam Tinh Nghịch",
    nameEn: "Berry Blue",
    headColor: 0x38bdf8,
    bellyColor: 0xbae6fd,
    accentColor: 0x0284c7,
    eyeIrisColor: 0x0369a1,
    glowHex: "#38bdf8",
    descriptionVi: "Chú rắn xanh da trời tinh nghịch với đôi mắt long lanh!",
  },
  green: {
    id: "green",
    nameVi: "Bé Lục Kẹo Ngọt",
    nameEn: "Candy Green",
    headColor: 0x4ade80,
    bellyColor: 0xdcfce7,
    accentColor: 0x16a34a,
    eyeIrisColor: 0x15803d,
    glowHex: "#4ade80",
    descriptionVi: "Đốt thân bóng bẩy như kẹo dẻo hoa quả, yêu đời!",
  },
  pink: {
    id: "pink",
    nameVi: "Bé Dâu Hồng",
    nameEn: "Sweet Strawberry",
    headColor: 0xf472b6,
    bellyColor: 0xfce7f3,
    accentColor: 0xdb2777,
    eyeIrisColor: 0xbe185d,
    glowHex: "#f472b6",
    descriptionVi: "Ngọt ngào như chiếc bánh dâu tây phủ kem tươi!",
  },
  gold: {
    id: "gold",
    nameVi: "Bé Hoàng Kim Vương Giả",
    nameEn: "Golden Crown",
    headColor: 0xfacc15,
    bellyColor: 0xfef08a,
    accentColor: 0xca8a04,
    eyeIrisColor: 0x854d0e,
    glowHex: "#facc15",
    descriptionVi: "Đội vương miện hoàng gia nhỏ xíu, tỏa ánh kim rực rỡ!",
  },
  violet: {
    id: "violet",
    nameVi: "Bé Tím Mộng Mơ",
    nameEn: "Cosmic Jelly",
    headColor: 0xa855f7,
    bellyColor: 0xf3e8ff,
    accentColor: 0x7e22ce,
    eyeIrisColor: 0x581c87,
    glowHex: "#a855f7",
    descriptionVi: "Bí ẩn như bầu trời sao đêm với chiếc mầm sao băng!",
  },
};

// ── 5 Thế Giới & Cốt Truyện Phiêu Lưu (Story Chapters) ────────────────────
export const STORY_STAGES = [
  {
    chapter: 1,
    id: "fruit_valley",
    nameVi: "Thung Lũng Trái Cây",
    nameEn: "Juicy Fruit Valley",
    storyVi: "Ngày nắng vàng rực rỡ, Bé Rắn thức dậy trong thung lũng đầy ắp Kiwi xanh và Dâu tươi!",
    storyEn: "On a bright sunny morning, Baby Snake awakens in a lush valley filled with fresh Kiwis and Berries!",
    goalFruits: 6,
    bgHex: "#fef3c7",
    fogHex: "#fde68a",
    floorPrimary: "#86efac",
    floorSecondary: "#4ade80",
    borderHex: "#f59e0b",
    barrierColor: 0xf59e0b,
    lightingColor: 0xfffbeb,
    speed: 9.8,
  },
  {
    chapter: 2,
    id: "candy_kingdom",
    nameVi: "Vương Quốc Bánh Donut",
    nameEn: "Donut & Candy Land",
    storyVi: "Hương thơm bánh Donut kem dâu ngào ngạt! Hãy ăn thật nhiều bánh và né những viên kẹo nổ!",
    storyEn: "The sweet scent of strawberry donuts fills the air! Collect treats and dodge spicy candy bombs!",
    goalFruits: 8,
    mines: 2,
    bgHex: "#fce7f3",
    fogHex: "#fbcfe8",
    floorPrimary: "#f472b6",
    floorSecondary: "#ec4899",
    borderHex: "#ec4899",
    barrierColor: 0xdb2777,
    lightingColor: 0xfff1f2,
    speed: 11.2,
  },
  {
    chapter: 3,
    id: "tropical_island",
    nameVi: "Đảo Thiên Đường Nhiệt Đới",
    nameEn: "Tropical Paradise",
    storyVi: "Sóng biển vỗ về bờ cát vàng. Dâu Tây Từ Tính (Magnet) xuất hiện giúp hút đồ ăn từ xa!",
    storyEn: "Golden sands and sea breeze. Magnetic Berries awaken to pull juicy fruits from afar!",
    goalFruits: 10,
    mines: 2,
    bgHex: "#e0f2fe",
    fogHex: "#bae6fd",
    floorPrimary: "#fde047",
    floorSecondary: "#38bdf8",
    borderHex: "#0284c7",
    barrierColor: 0x0284c7,
    lightingColor: 0xf0fdf4,
    speed: 12.6,
  },
  {
    chapter: 4,
    id: "cloud_dreamland",
    nameVi: "Xứ Sở Mây Kẹo Bông",
    nameEn: "Cotton Cloud Dream",
    storyVi: "Lướt trên những tầng mây êm ái! Cổng Cầu Vồng thần kỳ cho phép xuyên qua không gian!",
    storyEn: "Glide across fluffy cotton clouds! Magic Rainbow Portals link distant cloud islands!",
    goalFruits: 12,
    mines: 3,
    portals: true,
    bgHex: "#f3e8ff",
    fogHex: "#e9d5ff",
    floorPrimary: "#c084fc",
    floorSecondary: "#a855f7",
    borderHex: "#7e22ce",
    barrierColor: 0x7e22ce,
    lightingColor: 0xfdf4ff,
    speed: 14.0,
  },
  {
    chapter: 5,
    id: "golden_sanctuary",
    nameVi: "Cung Điện Hoàng Kim",
    nameEn: "Golden Eden Sanctuary",
    storyVi: "Đỉnh vinh quang! Thu thập Trái Cây Hoàng Kim và bước vào trạng thái Bất Tử (Fever Mode)!",
    storyEn: "The pinnacle of legend! Savor Golden Star Fruits to enter Invincible Fever Mode!",
    goalFruits: 16,
    mines: 4,
    portals: true,
    feverEvery: 4,
    bgHex: "#fef9c3",
    fogHex: "#fef08a",
    floorPrimary: "#fbbf24",
    floorSecondary: "#f59e0b",
    borderHex: "#d97706",
    barrierColor: 0xd97706,
    lightingColor: 0xfffbeb,
    speed: 15.5,
  },
];

// ── BỘ NHỚ ĐỆM GEOMETRY DÙNG CHUNG (Zero-GC Optimization) ─────────────────
const GEO_CACHE = {
  kiwiRind: new THREE.SphereGeometry(0.85, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  kiwiFace: new THREE.CircleGeometry(0.85, 16),
  strawBody: new THREE.ConeGeometry(0.72, 1.35, 12),
  strawLeaf: new THREE.ConeGeometry(0.18, 0.42, 4),
  donutDough: new THREE.TorusGeometry(0.85, 0.42, 10, 18),
  donutIcing: new THREE.TorusGeometry(0.85, 0.44, 10, 18, Math.PI * 1.85),
  bananaBody: new THREE.CylinderGeometry(0.75, 0.75, 0.35, 12),
  bananaRim: new THREE.TorusGeometry(0.76, 0.08, 6, 14),
  candyCube: new THREE.BoxGeometry(0.9, 0.9, 0.9),
  goldenStar: new THREE.DodecahedronGeometry(0.95, 0),
  goldenHalo: new THREE.TorusGeometry(1.4, 0.06, 6, 16),
  bombBody: new THREE.SphereGeometry(0.75, 10, 10),
  bombSpike: new THREE.ConeGeometry(0.18, 0.5, 5),
  segmentSphere: new THREE.SphereGeometry(0.72, 10, 10),
  segmentBelly: new THREE.SphereGeometry(0.62, 8, 8),
};

// ── Textures Cache ─────────────────────────────────────────────────────────
let kiwiTextureCache = null;

export function getKiwiTexture() {
  if (kiwiTextureCache) return kiwiTextureCache;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Vỏ ngoài nâu
  ctx.fillStyle = "#854d0e";
  ctx.fillRect(0, 0, 128, 128);

  // Thịt quả xanh mát
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, "#fef08a");
  grad.addColorStop(0.3, "#86efac");
  grad.addColorStop(0.85, "#22c55e");
  grad.addColorStop(1, "#15803d");
  ctx.fillStyle = grad;
  ctx.fill();

  // Lõi trắng kem
  ctx.beginPath();
  ctx.arc(64, 64, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#fef9c3";
  ctx.fill();

  // Hạt đen li ti
  ctx.fillStyle = "#1c1917";
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const r = 24 + (i % 2 === 0 ? 3 : -3);
    ctx.beginPath();
    ctx.arc(64 + Math.cos(angle) * r, 64 + Math.sin(angle) * r, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  kiwiTextureCache = texture;
  return texture;
}

export function createCartoonFloorTexture(colorA, colorB) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = colorB;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillRect(64, 64, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

// ── BỘ TẠO ĐẦU BÉ RẮN HOẠT HÌNH 3D ───────────────────────────────────────
export function createCartoonSnakeHead(skinKey = "blue") {
  const skin = SNAKE_SKINS[skinKey] || SNAKE_SKINS.blue;
  const headGroup = new THREE.Group();

  // Sọ đầu bầu bĩnh (Low-poly smooth)
  const skullGeo = new THREE.SphereGeometry(1.05, 14, 14);
  skullGeo.scale(1.0, 0.85, 1.2);
  const skullMat = new THREE.MeshStandardMaterial({
    color: skin.headColor,
    roughness: 0.25,
    metalness: 0.1,
  });
  const skullMesh = new THREE.Mesh(skullGeo, skullMat);
  headGroup.add(skullMesh);

  // Phần cằm dưới
  const chinGeo = new THREE.SphereGeometry(0.9, 10, 10);
  chinGeo.scale(0.85, 0.5, 1.0);
  const chinMat = new THREE.MeshBasicMaterial({ color: skin.bellyColor });
  const chinMesh = new THREE.Mesh(chinGeo, chinMat);
  chinMesh.position.set(0, -0.36, 0.15);
  headGroup.add(chinMesh);

  // Đôi mắt to tròn hoạt hình (Dùng MeshBasicMaterial để render nhanh nhất)
  const eyeRadius = 0.34;
  const eyeGroup = new THREE.Group();
  const scleraGeo = new THREE.SphereGeometry(eyeRadius, 10, 10);
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const eyeLeft = new THREE.Mesh(scleraGeo, scleraMat);
  eyeLeft.position.set(0.48, 0.32, 0.6);
  eyeLeft.scale.set(1.0, 1.15, 0.9);

  const eyeRight = new THREE.Mesh(scleraGeo, scleraMat);
  eyeRight.position.set(-0.48, 0.32, 0.6);
  eyeRight.scale.set(1.0, 1.15, 0.9);

  // Con ngươi và tròng mắt gộp nhẹ
  const irisGeo = new THREE.CircleGeometry(0.18, 10);
  const irisMat = new THREE.MeshBasicMaterial({ color: skin.eyeIrisColor });
  const irisL = new THREE.Mesh(irisGeo, irisMat);
  irisL.position.set(0, 0, eyeRadius * 0.92);
  eyeLeft.add(irisL);

  const irisR = new THREE.Mesh(irisGeo, irisMat);
  irisR.position.set(0, 0, eyeRadius * 0.92);
  eyeRight.add(irisR);

  // Chấm sáng catchlight
  const sparkGeo = new THREE.CircleGeometry(0.05, 6);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sL = new THREE.Mesh(sparkGeo, sparkMat);
  sL.position.set(0.04, 0.04, 0.01);
  irisL.add(sL);
  const sR = new THREE.Mesh(sparkGeo, sparkMat);
  sR.position.set(0.04, 0.04, 0.01);
  irisR.add(sR);

  eyeGroup.add(eyeLeft, eyeRight);
  headGroup.add(eyeGroup);

  // Má hồng đào
  const blushGeo = new THREE.CircleGeometry(0.16, 8);
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.5 });
  const blushL = new THREE.Mesh(blushGeo, blushMat);
  blushL.position.set(0.78, 0.05, 0.45);
  blushL.rotation.y = Math.PI / 4;
  const blushR = new THREE.Mesh(blushGeo, blushMat);
  blushR.position.set(-0.78, 0.05, 0.45);
  blushR.rotation.y = -Math.PI / 4;
  headGroup.add(blushL, blushR);

  // Miệng cười & Lưỡi
  const mouthGroup = new THREE.Group();
  const mouthGeo = new THREE.TorusGeometry(0.24, 0.04, 6, 12, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
  const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
  mouthMesh.position.set(0, -0.22, 1.05);
  mouthMesh.rotation.x = Math.PI / 2;
  mouthMesh.rotation.z = Math.PI;
  mouthGroup.add(mouthMesh);

  const tongueGeo = new THREE.BoxGeometry(0.12, 0.02, 0.28);
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
  tongueMesh.position.set(0, -0.23, 1.15);
  mouthGroup.add(tongueMesh);
  headGroup.add(mouthGroup);

  // Phụ kiện skin
  if (skinKey === "gold") {
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.22, 0.16, 5),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
    );
    crown.position.set(0, 0.88, 0.1);
    headGroup.add(crown);
  }

  return {
    headGroup,
    eyeGroup,
    irisL,
    irisR,
    tongueMesh,
    mouthMesh,
  };
}

// ── BỘ TẠO ĐỐT THÂN (Dùng Shared Geometries) ──────────────────────────────
export function createCartoonSegmentMesh(skinKey = "blue", index = 0) {
  const skin = SNAKE_SKINS[skinKey] || SNAKE_SKINS.blue;
  const segGroup = new THREE.Group();

  const isAlt = index % 2 === 1;
  const segMat = new THREE.MeshStandardMaterial({
    color: isAlt ? skin.accentColor : skin.headColor,
    roughness: 0.22,
    metalness: 0.05,
  });
  const segMesh = new THREE.Mesh(GEO_CACHE.segmentSphere, segMat);
  segGroup.add(segMesh);

  const bellyMat = new THREE.MeshBasicMaterial({
    color: skin.bellyColor,
    transparent: true,
    opacity: 0.8,
  });
  const bellyMesh = new THREE.Mesh(GEO_CACHE.segmentBelly, bellyMat);
  bellyMesh.position.y = -0.3;
  segGroup.add(bellyMesh);

  return { segGroup, segMesh, bellyMesh, size: 0.72 };
}

// ── BỘ TẠO HOA QUẢ 3D SIÊU MƯỢT (Zero PointLights - Pure Emissive Glow) ─────

/** 1. NỬA QUẢ KIWI CẮT LÁT 3D */
export function create3DKiwi() {
  const group = new THREE.Group();

  const rindMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const rindMesh = new THREE.Mesh(GEO_CACHE.kiwiRind, rindMat);
  rindMesh.rotation.x = Math.PI;
  group.add(rindMesh);

  const faceMat = new THREE.MeshBasicMaterial({
    map: getKiwiTexture(),
    side: THREE.DoubleSide,
  });
  const faceMesh = new THREE.Mesh(GEO_CACHE.kiwiFace, faceMat);
  faceMesh.rotation.x = -Math.PI / 2;
  group.add(faceMesh);

  group.userData = { type: "kiwi", points: 100, nameVi: "Kiwi Mọng Nước" };
  return group;
}

/** 2. DÂU TÂY ĐỎ MỌNG 3D */
export function create3DStrawberry() {
  const group = new THREE.Group();

  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.25,
    roughness: 0.2,
  });
  const strawMesh = new THREE.Mesh(GEO_CACHE.strawBody, strawMat);
  strawMesh.rotation.x = Math.PI;
  group.add(strawMesh);

  const leafMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(GEO_CACHE.strawLeaf, leafMat);
    const ang = (i / 4) * Math.PI * 2;
    leaf.position.set(Math.cos(ang) * 0.32, 0.65, Math.sin(ang) * 0.32);
    leaf.rotation.z = Math.PI / 2.8;
    leaf.rotation.y = -ang;
    group.add(leaf);
  }

  group.userData = { type: "strawberry", points: 150, perk: "magnet", nameVi: "Dâu Tây Từ Tính" };
  return group;
}

/** 3. BÁNH DONUT KEM DÂU 3D */
export function create3DDonut() {
  const group = new THREE.Group();

  const doughMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
  const doughMesh = new THREE.Mesh(GEO_CACHE.donutDough, doughMat);
  doughMesh.rotation.x = Math.PI / 2;
  group.add(doughMesh);

  const icingMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xbe185d,
    emissiveIntensity: 0.2,
    roughness: 0.2,
  });
  const icingMesh = new THREE.Mesh(GEO_CACHE.donutIcing, icingMat);
  icingMesh.rotation.x = Math.PI / 2;
  icingMesh.position.y = 0.04;
  group.add(icingMesh);

  group.userData = { type: "donut", points: 300, perk: "growth", nameVi: "Bánh Donut Khổng Lồ" };
  return group;
}

/** 4. LÁT CHUỐI NGỌT NGÀO 3D */
export function create3DBananaSlice() {
  const group = new THREE.Group();

  const bMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
  const bMesh = new THREE.Mesh(GEO_CACHE.bananaBody, bMat);
  group.add(bMesh);

  const rimMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const rimMesh = new THREE.Mesh(GEO_CACHE.bananaRim, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  group.add(rimMesh);

  group.userData = { type: "banana", points: 120, perk: "speed", nameVi: "Lát Chuối Tốc Độ" };
  return group;
}

/** 5. VIÊN KẸO KHỐI PHÁT SÁNG 3D */
export function create3DCandyCube(colorHex = 0xf97316) {
  const group = new THREE.Group();

  const cubeMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.75,
    roughness: 0.15,
  });
  const cubeMesh = new THREE.Mesh(GEO_CACHE.candyCube, cubeMat);
  group.add(cubeMesh);

  group.userData = { type: "candycube", points: 200, perk: "boost_charge", nameVi: "Kẹo Khối Năng Lượng" };
  return group;
}

/** 6. TRÁI SAO HOÀNG KIM 3D */
export function create3DGoldenStar() {
  const group = new THREE.Group();

  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.85,
    roughness: 0.1,
  });
  const starMesh = new THREE.Mesh(GEO_CACHE.goldenStar, starMat);
  group.add(starMesh);

  const haloMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  const haloMesh = new THREE.Mesh(GEO_CACHE.goldenHalo, haloMat);
  haloMesh.rotation.x = Math.PI / 2;
  group.add(haloMesh);

  group.userData = { type: "golden_star", points: 500, perk: "fever", nameVi: "Trái Sao Hoàng Kim" };
  return group;
}

/** 7. VIÊN KẸO NỔ CẢNH BÁO */
export function create3DCandyBomb() {
  const group = new THREE.Group();

  const bombMat = new THREE.MeshStandardMaterial({
    color: 0x831843,
    emissive: 0xf43f5e,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });
  const bombMesh = new THREE.Mesh(GEO_CACHE.bombBody, bombMat);
  group.add(bombMesh);

  const hornMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 });
  for (let i = 0; i < 4; i++) {
    const horn = new THREE.Mesh(GEO_CACHE.bombSpike, hornMat);
    const ang = (i / 4) * Math.PI * 2;
    horn.position.set(Math.cos(ang) * 0.75, 0, Math.sin(ang) * 0.75);
    horn.rotation.z = Math.PI / 2;
    horn.rotation.y = -ang;
    group.add(horn);
  }

  return group;
}
