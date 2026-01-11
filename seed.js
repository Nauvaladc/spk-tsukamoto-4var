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
      { label: "< Rp. 400.000", value: 0 },
      { label: "Rp. 400.000 - Rp. 2.000.000", value: 4 },
      { label: "> Rp. 2.000.000", value: 10 },
    ],
    pinjaman: [
      { label: "Rp. 100.000 - Rp. 500.000", value: 10 },
      { label: "Rp. 500.000 - Rp. 2.500.000", value: 4 },
      { label: "Rp. 2.500.000 - Rp. 5.000.000", value: 0 },
    ],
    tenor: [
      { label: "6 Bulan", value: 10 },
      { label: "12 Bulan", value: 4 },
      { label: "24 Bulan", value: 0 },
    ],
    jaminan: [
      { label: "KTP", value: 0 },
      { label: "BPKB + KTP", value: 4 },
      { label: "BPKB + Surat Tanah/Bangunan + KTP", value: 10 },
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
