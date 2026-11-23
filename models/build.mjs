// クリスマス3Dモデル（雪だるま・ツリー・プレゼント）を GLB / USDZ に書き出す
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import fs from 'fs';

// Node用の最小FileReader（GLTFExporterのバイナリ出力で使用）
globalThis.FileReader = class {
  readAsArrayBuffer(b) { b.arrayBuffer().then(r => { this.result = r; this.onloadend && this.onloadend(); this.onload && this.onload({ target: this }); }); }
  readAsDataURL(b) { b.arrayBuffer().then(r => { this.result = 'data:' + (b.type || 'application/octet-stream') + ';base64,' + Buffer.from(r).toString('base64'); this.onloadend && this.onloadend(); this.onload && this.onload({ target: this }); }); }
};

const mat = (color, rough = 0.6, metal = 0, emissive) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 0.6; }
  return m;
};
const M = {
  snow: mat('#f6f9fc', 0.85), black: mat('#1d1d1f', 0.4), carrot: mat('#f07f1e', 0.5),
  red: mat('#c8262b', 0.55), darkred: mat('#9e1b20', 0.6), brown: mat('#6b4226', 0.8),
  pink: mat('#ffaaaa', 0.7), green1: mat('#2f8f4e', 0.75), green2: mat('#257a41', 0.75), green3: mat('#1d6636', 0.75),
  gold: mat('#e9b93a', 0.3, 0.6, '#6b4c00'), blue: mat('#3a8fd6', 0.3, 0.3), white: mat('#ffffff', 0.5),
  silver: mat('#d8dde3', 0.25, 0.7), giftGreen: mat('#2f8f4e', 0.55), giftBlue: mat('#2f6fbf', 0.55), cream: mat('#f5ecd7', 0.6)
};
function mesh(geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); return o; }

/* ===== 雪だるま（高さ約1.35m） ===== */
function snowman() {
  const g = new THREE.Group(); g.name = 'snowman';
  g.add(mesh(new THREE.SphereGeometry(0.40, 48, 32), M.snow, 0, 0.38, 0));
  g.add(mesh(new THREE.SphereGeometry(0.29, 48, 32), M.snow, 0, 0.92, 0));
  g.add(mesh(new THREE.SphereGeometry(0.21, 48, 32), M.snow, 0, 1.32, 0));
  // 目・ほっぺ
  [-0.075, 0.075].forEach(x => {
    g.add(mesh(new THREE.SphereGeometry(0.026, 16, 12), M.black, x, 1.37, 0.19));
    const c = mesh(new THREE.SphereGeometry(0.04, 16, 12), M.pink, x * 1.75, 1.30, 0.165); c.scale.set(1, 0.6, 0.3); g.add(c);
  });
  // 口
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.22; g.add(mesh(new THREE.SphereGeometry(0.013, 10, 8), M.black, Math.sin(a) * 0.08, 1.255 - Math.cos(a) * 0.02 + 0.02, 0.195 - Math.abs(i) * 0.008));
  }
  // にんじん
  const nose = mesh(new THREE.ConeGeometry(0.035, 0.18, 20), M.carrot, 0, 1.32, 0.29); nose.rotation.x = Math.PI / 2; g.add(nose);
  // ボタン
  [0.98, 0.88, 0.78].forEach(y => g.add(mesh(new THREE.SphereGeometry(0.03, 16, 12), M.black, 0, y, Math.sqrt(0.29 ** 2 - (y - 0.92) ** 2) - 0.01)));
  // マフラー
  const scarf = mesh(new THREE.TorusGeometry(0.19, 0.055, 16, 40), M.red, 0, 1.15, 0); scarf.rotation.x = Math.PI / 2; g.add(scarf);
  const tail = mesh(new THREE.BoxGeometry(0.11, 0.26, 0.04), M.red, 0.11, 1.0, 0.24); tail.rotation.z = 0.25; tail.rotation.x = -0.35; g.add(tail);
  // 帽子
  g.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 40), M.black, 0, 1.49, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.26, 40), M.black, 0, 1.63, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.05, 40), M.red, 0, 1.53, 0));
  // 腕（枝）
  [-1, 1].forEach(s => {
    const arm = mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.5, 10), M.brown, s * 0.46, 1.04, 0);
    arm.rotation.z = s * -1.0; g.add(arm);
    const tw = mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.13, 8), M.brown, s * 0.62, 1.19, 0);
    tw.rotation.z = s * -0.2; g.add(tw);
  });
  return g;
}

/* ===== ツリー（高さ約2.0m） ===== */
function starShape(R, r, n) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / n * i + Math.PI / 2, rr = i % 2 ? r : R;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath(); return s;
}
function tree() {
  const g = new THREE.Group(); g.name = 'tree';
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.32, 40), M.red, 0, 0.16, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.05, 40), M.gold, 0, 0.31, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 20), M.brown, 0, 0.45, 0));
  const tiers = [
    { r: 0.78, h: 0.70, y: 0.88, m: M.green3 },
    { r: 0.62, h: 0.62, y: 1.20, m: M.green2 },
    { r: 0.46, h: 0.54, y: 1.48, m: M.green1 },
    { r: 0.28, h: 0.42, y: 1.74, m: M.green1 }
  ];
  tiers.forEach(t => g.add(mesh(new THREE.ConeGeometry(t.r, t.h, 48, 1), t.m, 0, t.y, 0)));
  // オーナメント（円錐の表面に配置）
  const cols = [M.red, M.gold, M.blue, M.silver, M.red, M.gold];
  let k = 0;
  tiers.forEach((t, ti) => {
    const n = [11, 9, 7, 4][ti];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + ti * 0.5;
      const f = 0.12 + (i % 2) * 0.1; // 円錐の下端から何割の高さに付けるか
      const yy = t.y - t.h / 2 + t.h * f;
      const rad = t.r * (1 - f) + 0.025;
      g.add(mesh(new THREE.SphereGeometry(0.045, 20, 14), cols[k++ % cols.length], Math.cos(a) * rad, yy, Math.sin(a) * rad));
    }
  });
  // 星
  const sg = new THREE.ExtrudeGeometry(starShape(0.15, 0.065, 5), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 2 });
  sg.translate(0, 0, -0.02);
  g.add(mesh(sg, M.gold, 0, 2.02, 0));
  return g;
}

/* ===== プレゼント（3箱） ===== */
function gift(w, h, d, boxM, ribM) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, h, d), boxM, 0, h / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(w + 0.012, h + 0.012, d * 0.16), ribM, 0, h / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(w * 0.16, h + 0.012, d + 0.012), ribM, 0, h / 2, 0));
  const s = Math.min(w, d);
  [-1, 1].forEach(sd => {
    const loop = mesh(new THREE.TorusGeometry(s * 0.17, s * 0.045, 12, 28), ribM, sd * s * 0.15, h + s * 0.12, 0);
    loop.rotation.y = Math.PI / 2; loop.rotation.z = sd * 0.5; loop.scale.set(1, 0.75, 1); g.add(loop);
  });
  g.add(mesh(new THREE.SphereGeometry(s * 0.07, 16, 12), ribM, 0, h + s * 0.04, 0));
  return g;
}
function presents() {
  const g = new THREE.Group(); g.name = 'presents';
  const a = gift(0.55, 0.42, 0.5, M.red, M.gold); a.position.set(-0.12, 0, 0); g.add(a);
  const b = gift(0.34, 0.3, 0.34, M.giftGreen, M.red); b.position.set(-0.1, 0.42, 0.02); b.rotation.y = 0.5; g.add(b);
  const c = gift(0.36, 0.26, 0.32, M.giftBlue, M.white); c.position.set(0.42, 0, 0.18); c.rotation.y = -0.4; g.add(c);
  return g;
}

/* ===== 書き出し ===== */
const out = process.argv[2] || 'models';
fs.mkdirSync(out, { recursive: true });
const gltf = new GLTFExporter(), usdz = new USDZExporter();
for (const make of [snowman, tree, presents]) {
  const obj = make();
  const scene = new THREE.Scene(); scene.add(obj);
  scene.updateMatrixWorld(true);
  const glb = await new Promise((res, rej) => gltf.parse(scene, res, rej, { binary: true }));
  fs.writeFileSync(`${out}/${obj.name}.glb`, Buffer.from(glb));
  const u = await usdz.parseAsync(scene);
  fs.writeFileSync(`${out}/${obj.name}.usdz`, Buffer.from(u));
  console.log(obj.name, (glb.byteLength / 1024).toFixed(0) + 'KB glb', (u.byteLength / 1024).toFixed(0) + 'KB usdz');
}
