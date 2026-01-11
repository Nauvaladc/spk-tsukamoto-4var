const PrintView = (() => {
  const container = document.getElementById("print-content");

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const toFixed = (value) => Number.parseFloat(value).toFixed(2);

  const render = () => {
    const state = loadState();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const permohonan = state.permohonan.find((item) => item.id === id);
    const result = state.results.find((item) => item.permohonanId === id);

    if (!permohonan || !result) {
      container.innerHTML = `
        <div class="card">
          <h2>Data tidak ditemukan</h2>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="print-header">
        <div>
          <h2>Ringkasan Hasil Permohonan</h2>
          <p class="helper-text">SPK Fuzzy Tsukamoto</p>
        </div>
        <button class="btn secondary no-print" onclick="window.print()">Cetak</button>
      </div>
      <div class="card">
        <p><strong>Nama:</strong> ${permohonan.nama}</p>
        <p><strong>Tanggal:</strong> ${formatDate(permohonan.tanggal)}</p>
        <p><strong>Keputusan:</strong> ${result.keputusan}</p>
        <p><strong>Z (0-10):</strong> ${toFixed(result.z10)}</p>
        <p><strong>Z (0-100):</strong> ${toFixed(result.z100)}</p>
      </div>
      <div class="card">
        <h3>Rule Aktif</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>μ Pendapatan</th>
              <th>μ Pinjaman</th>
              <th>μ Tenor</th>
              <th>μ Jaminan</th>
              <th>α</th>
              <th>z</th>
            </tr>
          </thead>
          <tbody>
            ${result.ruleAktif
              .map(
                (item) => `
                  <tr>
                    <td>${item.ruleId}</td>
                    <td>${toFixed(item.mu.pendapatan)}</td>
                    <td>${toFixed(item.mu.pinjaman)}</td>
                    <td>${toFixed(item.mu.tenor)}</td>
                    <td>${toFixed(item.mu.jaminan)}</td>
                    <td>${toFixed(item.alpha)}</td>
                    <td>${toFixed(item.z)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    setTimeout(() => {
      window.print();
    }, 300);
  };

  return { render };
})();

PrintView.render();
