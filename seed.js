const SeedData = (() => {
  const now = new Date().toISOString();
  const variabel = ["pendapatan", "pinjaman", "tenor", "jaminan"];
  const bobotOptions = {
    pendapatan: [
      { label: "Rendah", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Tinggi", value: 10 },
    ],
    pinjaman: [
      { label: "Rendah", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Tinggi", value: 10 },
    ],
    tenor: [
      { label: "Rendah", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Tinggi", value: 10 },
    ],
    jaminan: [
      { label: "Rendah", value: 0 },
      { label: "Sedang", value: 4 },
      { label: "Tinggi", value: 10 },
    ],
  };

  return {
    users: [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "manager", password: "manager123", role: "manager" },
    ],
    variabel,
    bobotOptions,
    rules: [],
    permohonan: [
      {
        id: "permohonan-1",
        nama: "Budi Santoso",
        tanggal: now,
        bobotPilihan: {
          pendapatan: { label: "Sedang", value: 4 },
          pinjaman: { label: "Tinggi", value: 10 },
          tenor: { label: "Rendah", value: 0 },
          jaminan: { label: "Sedang", value: 4 },
        },
        nilai: {
          pendapatan: 4,
          pinjaman: 10,
          tenor: 0,
          jaminan: 4,
        },
        keterangan: "Contoh permohonan awal",
      },
    ],
    results: [],
  };
})();
