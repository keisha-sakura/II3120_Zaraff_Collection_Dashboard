import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const width = 1800;
const height = 3290;
const left = 60;
const laneWidth = 280;
const centers = Array.from(
  { length: 6 },
  (_, i) => left + laneWidth * (i + 0.5),
);
const colors = {
  ink: "#35232d",
  muted: "#816c78",
  line: "#a08494",
  border: "#e7cfdb",
  pink: "#fff5f8",
  primary: "#a94d7e",
};
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const parts = [];
const nodes = new Map();
function text(x, y, lines, size = 17, fill = colors.ink, weight = 400) {
  parts.push(
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="middle">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? 23 : 0}">${escape(line)}</tspan>`).join("")}</text>`,
  );
}
function node(id, lane, y, lines, kind = "action") {
  const x = centers[lane];
  const h = kind === "decision" ? 86 : 68;
  nodes.set(id, { x, y, top: y - h / 2, bottom: y + h / 2 });
  if (kind === "decision")
    parts.push(
      `<path d="M ${x} ${y - 43} L ${x + 112} ${y} L ${x} ${y + 43} L ${x - 112} ${y} Z" fill="#f9e8ef" stroke="${colors.primary}" stroke-width="1.5"/>`,
    );
  else
    parts.push(
      `<rect x="${x - 118}" y="${y - 34}" width="236" height="68" rx="14" fill="${lane === 5 ? "#f7f7fa" : colors.pink}" stroke="${colors.border}" stroke-width="1.5"/>`,
    );
  text(
    x,
    y - (lines.length - 1) * 11.5 + 6,
    lines,
    kind === "decision" ? 16 : 17,
  );
}
function path(points, label, lx, ly, dashed = false) {
  parts.push(
    `<path d="${points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ")}" fill="none" stroke="${colors.line}" stroke-width="1.7" stroke-linejoin="round" ${dashed ? 'stroke-dasharray="6 5"' : ""} marker-end="url(#arrow)"/>`,
  );
  if (label) {
    parts.push(
      `<rect x="${lx - label.length * 4.6 - 5}" y="${ly - 17}" width="${label.length * 9.2 + 10}" height="23" rx="4" fill="white"/>`,
    );
    text(lx, ly, [label], 14, colors.muted);
  }
}
function connect(from, to, label) {
  const a = nodes.get(from),
    b = nodes.get(to);
  const mid = (a.bottom + b.top) / 2;
  path(
    a.x === b.x
      ? [
          [a.x, a.bottom],
          [b.x, b.top],
        ]
      : [
          [a.x, a.bottom],
          [a.x, mid],
          [b.x, mid],
          [b.x, b.top],
        ],
    label,
    a.x + 25,
    mid - 5,
  );
}
function phase(y, title) {
  parts.push(`<rect x="60" y="${y}" width="1680" height="32" fill="#f5e8ef"/>`);
  text(width / 2, y + 22, [title], 15, colors.primary, 700);
}

parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">Activity diagram Zaraff Collection berdasarkan role</title><desc id="desc">Alur penerimaan bale sampai pesanan selesai, dipisahkan dalam swimlane Owner, Admin, Penyortir, Live Host, Tim Packing dan Sistem.</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 Z" fill="${colors.line}"/></marker></defs><rect width="100%" height="100%" fill="white"/>`,
);
text(
  width / 2,
  48,
  ["Alur Operasional Zaraff Collection"],
  30,
  colors.ink,
  700,
);
text(
  width / 2,
  80,
  [
    "Activity diagram berdasarkan peran · dari penerimaan bale hingga pesanan selesai",
  ],
  18,
  colors.muted,
);
const lanes = [
  "Owner",
  "Admin",
  "Penyortir",
  "Live Host",
  "Tim Packing",
  "Sistem",
];
for (const [index, lane] of lanes.entries()) {
  const x = left + index * laneWidth;
  parts.push(
    `<rect x="${x}" y="112" width="${laneWidth}" height="2965" fill="${index % 2 ? "#fffafb" : "#ffffff"}" stroke="${colors.border}"/><rect x="${x}" y="112" width="${laneWidth}" height="58" fill="#f9edf3" stroke="${colors.border}"/>`,
  );
  text(centers[index], 148, [lane], 20, colors.primary, 700);
}
phase(188, "01   PENERIMAAN BALE DAN PENGELOLAAN STOK");
parts.push(`<circle cx="760" cy="248" r="10" fill="${colors.ink}"/>`);
node("receive", 2, 320, ["Terima dan catat bale", "Tentukan lokasi bale"]);
node("sort", 2, 420, [
  "Mulai sortir per barang",
  "Catat layak / retur + alasan",
]);
node("finishSort", 2, 520, ["Selesaikan sortir", "Lepas lokasi bale"]);
node("grade", 2, 620, ["Laundry barang layak", "Isi grade, harga, dan rak"]);
node("available", 5, 720, ["Barang Tersedia", "Siap dipilih untuk live"]);
text(
  centers[0],
  300,
  ["Owner juga dapat menjalankan", "aksi Admin, Gudang,", "dan Tim Packing."],
  16,
  colors.muted,
);
text(
  centers[2],
  770,
  ["Barang retur tidak masuk stok jual."],
  14,
  colors.muted,
);

phase(800, "02   JADWAL LIVE DAN PEMROSESAN KLAIM");
node("schedule", 1, 875, [
  "Isi jadwal, host, konten",
  "Pilih barang dan publikasi",
]);
node("broadcast", 3, 980, ["Lihat jadwal penugasan", "Lakukan siaran live"]);
node("import", 1, 1090, ["Tandai live selesai", "Input komentar / unggah CSV"]);
node("classify", 5, 1190, [
  "Periksa kode dan klaim",
  "Gemini untuk komentar bebas",
]);
node("validClaim", 5, 1300, ["Ada klaim", "yang valid?"], "decision");
node("orders", 5, 1410, [
  "Pilih klaim valid tercepat",
  "Reservasi, pesanan, tagihan",
]);
text(
  centers[2],
  1240,
  ["Jika tidak valid:", "periksa dan perbaiki input."],
  15,
  colors.muted,
);

phase(1490, "03   PENGAJUAN DAN VALIDASI PEMBAYARAN");
node("submitPayment", 1, 1570, [
  "Catat pengajuan pembeli",
  "Transfer / saldo deposit",
]);
node("review", 1, 1670, [
  "Periksa nominal, bukti",
  "atau saldo, dan reservasi",
]);
node("validPayment", 1, 1780, ["Valid dan", "disetujui?"], "decision");
node("paid", 5, 1900, ["Lunas; barang Terjual", "Debit saldo jika deposit"]);
text(
  centers[0],
  1860,
  ["Omzet mengikuti pembayaran", "yang sudah disetujui."],
  15,
  colors.muted,
);

phase(1990, "04   PACKING, PENGIRIMAN, DAN PENERIMAAN");
node("pack", 4, 2070, [
  "Ambil barang sesuai pesanan",
  "Lengkapi checklist packing",
]);
node("packed", 4, 2170, ["Tandai dikemas", "Pesanan Siap dikirim"]);
node("dispatch", 1, 2280, [
  "Isi kurir dan nomor resi",
  "Konfirmasi serah terima",
]);
node("outbound", 5, 2390, ["Pesanan Dikirim", "Barang Keluar; rak dilepas"]);
node("received", 1, 2510, ["Paket sudah", "diterima pembeli?"], "decision");
node("confirm", 1, 2640, [
  "Klik Konfirmasi penerimaan",
  "Centang paket diterima",
]);
node("complete", 1, 2740, ["Pilih Ya,", "selesaikan pesanan"]);
node("saved", 5, 2850, ["Pesanan Selesai", "Simpan riwayat penerimaan"]);
node("report", 0, 2850, [
  "Lihat laporan penjualan",
  "dan ringkasan operasional",
]);
parts.push(
  `<circle cx="1600" cy="2975" r="14" fill="white" stroke="${colors.ink}" stroke-width="2"/><circle cx="1600" cy="2975" r="9" fill="${colors.ink}"/>`,
);

path([
  [760, 258],
  [760, 286],
]);
for (const [a, b] of [
  ["receive", "sort"],
  ["sort", "finishSort"],
  ["finishSort", "grade"],
  ["grade", "available"],
  ["available", "schedule"],
  ["schedule", "broadcast"],
  ["broadcast", "import"],
  ["import", "classify"],
  ["classify", "validClaim"],
  ["orders", "submitPayment"],
  ["submitPayment", "review"],
  ["review", "validPayment"],
  ["paid", "pack"],
  ["pack", "packed"],
  ["packed", "dispatch"],
  ["dispatch", "outbound"],
  ["outbound", "received"],
  ["confirm", "complete"],
  ["complete", "saved"],
])
  connect(a, b);
connect("validClaim", "orders", "Ya");
path(
  [
    [1488, 1300],
    [480, 1300],
    [480, 1124],
  ],
  "Tidak",
  1020,
  1293,
);
connect("validPayment", "paid", "Ya");
path(
  [
    [368, 1780],
    [348, 1780],
    [348, 1570],
    [362, 1570],
  ],
  "Tidak: tolak dan perbaiki",
  210,
  1710,
);
connect("received", "confirm", "Sudah");
path(
  [
    [368, 2510],
    [345, 2510],
    [345, 2580],
    [480, 2580],
    [480, 2553],
  ],
  "Belum: tunggu konfirmasi",
  245,
  2580,
);
path([
  [1600, 2884],
  [1600, 2960],
]);
path(
  [
    [1482, 2850],
    [318, 2850],
  ],
  "Baca data transaksi dan histori",
  960,
  2835,
  true,
);
text(
  width / 2,
  3120,
  [
    "Pembagian di atas menunjukkan petugas utama, bukan pembatasan tambahan pada hak akses aplikasi.",
  ],
  17,
  colors.muted,
);
text(
  width / 2,
  3150,
  [
    "Owner/Admin juga dapat mengelola gudang dan packing. Live Host hanya membaca jadwal penugasan di dashboard.",
  ],
  17,
  colors.muted,
);
text(
  width / 2,
  3180,
  [
    "Klaim eksplisit tidak memerlukan Gemini. Waktu sama mengikuti urutan baris. Tanpa pemenang, barang tetap Tersedia.",
  ],
  17,
  colors.muted,
);
text(
  width / 2,
  3210,
  [
    "Laundry/grading dapat dikerjakan per item. Checklist packing wajib lengkap. Resi dan penerimaan dicatat manual oleh Owner/Admin.",
  ],
  17,
  colors.muted,
);
parts.push("</svg>");
const svg = parts.join("\n");
await writeFile("docs/activity-by-role.svg", svg);
await sharp(Buffer.from(svg)).png().toFile("docs/activity-by-role.png");
console.log(
  "Generated docs/activity-by-role.svg and docs/activity-by-role.png",
);
