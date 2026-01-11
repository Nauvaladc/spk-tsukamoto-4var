const SeedData = (() => {
  const now = new Date().toISOString();
  const variabel = ["pendapatan", "pinjaman", "tenor", "jaminan"];

  // Skor (0-10) harus berarti: makin besar = makin bagus
  // - Pendapatan: Tinggi lebih bagus
  // - Pinjaman: Kecil lebih bagus (dibalik)
  // - Tenor: Pendek lebih bagus (dibalik)
  // - Jaminan: Kuat lebih bagus
  const bobotOptions = {
    pendapatan: [
      { label: "Rendah", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Tinggi", value: 10 },
    ],
    pinjaman: [
      { label: "Besar", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Kecil", value: 10 },
    ],
    tenor: [
      { label: "Panjang", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Pendek", value: 10 },
    ],
    jaminan: [
      { label: "Lemah", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Kuat", value: 10 },
    ],
  };

  // Seed rule default (81) supaya aplikasi langsung bisa menghitung.
  const labels = ["TB", "CB", "SB"];
  const valueMap = { TB: 0, CB: 1, SB: 2 };
  const rules = [];
  let counter = 1;
  labels.forEach((pendapatan) => {
    labels.forEach((pinjaman) => {
      labels.forEach((tenor) => {
        labels.forEach((jaminan) => {
          const total =
            valueMap[pendapatan] +
            valueMap[pinjaman] +
            valueMap[tenor] +
            valueMap[jaminan];
          rules.push({
            id: `R-${counter.toString().padStart(3, "0")}`,
            pendapatan,
            pinjaman,
            tenor,
            jaminan,
            hasil: total >= 6 ? "L" : "TL",
          });
          counter += 1;
        });
      });
    });
  });

  return {
    users: [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "manager", password: "manager123", role: "manager" },
    ],
    variabel,
    bobotOptions,
    rules,
    permohonan: [
      {
        id: "permohonan-1",
        nama: "Budi Santoso",
        tanggal: now,
        bobotPilihan: {
          pendapatan: { label: "Sedang", value: 4 },
          pinjaman: { label: "Sedang", value: 4 },
          tenor: { label: "Sedang", value: 4 },
          jaminan: { label: "Sedang", value: 4 },
        },
        nilai: {
          pendapatan: 4,
          pinjaman: 4,
          tenor: 4,
          jaminan: 4,
        },
        keterangan: "Contoh permohonan awal",
      },
    ],
    results: [],
  };
})();
