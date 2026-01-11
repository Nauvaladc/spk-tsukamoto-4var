const App = (() => {
  const sessionKey = "spk-tsukamoto-session";
  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");
  const content = document.getElementById("content");
  let state = loadState();

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getSession = () => {
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  };

  const setSession = (user) => {
    localStorage.setItem(sessionKey, JSON.stringify(user));
  };

  const clearSession = () => {
    localStorage.removeItem(sessionKey);
  };

  const parseHash = () => {
    const raw = window.location.hash || "#masuk";
    const [path, queryString] = raw.split("?");
    return {
      path,
      params: new URLSearchParams(queryString || ""),
    };
  };

  const toFixed = (value) => Number.parseFloat(value).toFixed(2);

  const findOptionLabel = (variabel, value) => {
    const options = state.bobotOptions[variabel] || [];
    const match = options.find((item) => Number(item.value) === Number(value));
    return match ? match.label : "-";
  };

  const computeResult = (permohonan) => {
    const { z, ruleAktif } = FuzzyTsukamoto.hitung(
      permohonan.nilai,
      state.rules
    );
    const z10 = Number(z) || 0;
    const z100 = z10 * 10;
    const keputusan = z100 >= 64 ? "Layak" : "Tidak Layak";
    return {
      id: `hasil-${permohonan.id}`,
      permohonanId: permohonan.id,
      z10,
      z100,
      keputusan,
      ruleAktif,
      updatedAt: new Date().toISOString(),
    };
  };

  const syncResults = () => {
    // Rehitung semua hasil supaya tidak basi (terutama setelah admin mengubah rule).
    state.results = state.permohonan.map((item) => computeResult(item));
    saveState(state);
  };

  const savePermohonan = (payload, editId) => {
    if (editId) {
      state.permohonan = state.permohonan.map((item) =>
        item.id === editId ? { ...item, ...payload } : item
      );
    } else {
      state.permohonan.unshift(payload);
    }

    const existingResult = state.results.find(
      (result) => result.permohonanId === payload.id
    );
    const newResult = computeResult(payload);
    if (existingResult) {
      Object.assign(existingResult, newResult);
    } else {
      state.results.unshift(newResult);
    }

    saveState(state);
  };

  const deletePermohonan = (id) => {
    state.permohonan = state.permohonan.filter((item) => item.id !== id);
    state.results = state.results.filter(
      (result) => result.permohonanId !== id
    );
    saveState(state);
  };

  const updateRules = (rules) => {
    state.rules = rules;
    saveState(state);
    syncResults();
  };

  const renderSidebar = (session, activePath) => {
    if (!session) {
      sidebar.innerHTML = "";
      return;
    }

    const menus =
      session.role === "admin"
        ? [
            { label: "Beranda", hash: "#beranda" },
            { label: "Data Kondisi & Bobot", hash: "#admin-bobot" },
            { label: "Data Rule", hash: "#admin-rule" },
          ]
        : [
            { label: "Beranda", hash: "#beranda" },
            { label: "Data Permohonan", hash: "#permohonan" },
            { label: "Data Hasil Permohonan", hash: "#hasil" },
          ];

    sidebar.innerHTML = `
      <h2>SPK Fuzzy Tsukamoto</h2>
      <nav>
        ${menus
          .map(
            (menu) => `
              <a href="${menu.hash}" class="${
              activePath === menu.hash ? "active" : ""
            }">
                <span>${menu.label}</span>
              </a>
            `
          )
          .join("")}
      </nav>
    `;
  };

  const renderTopbar = (session) => {
    if (!session) {
      topbar.innerHTML = "";
      return;
    }

    topbar.innerHTML = `
      <h1>Dashboard ${session.role === "admin" ? "Admin" : "Manager"}</h1>
      <div class="user-info">
        <span>${session.username}</span>
        <button class="secondary" data-action="logout">Keluar</button>
      </div>
    `;
  };

  const renderLogin = () => {
    document.body.classList.add("auth-view");
    content.innerHTML = `
      <div class="card">
        <h2>Masuk</h2>
        <p class="helper-text">Silakan login menggunakan akun admin atau manager.</p>
        <form id="login-form" class="grid">
          <div>
            <label>Username</label>
            <input name="username" placeholder="Masukkan username" required />
          </div>
          <div>
            <label>Password</label>
            <input name="password" type="password" placeholder="Masukkan password" required />
          </div>
          <button type="submit">Masuk</button>
        </form>
      </div>
    `;
  };

  const renderBeranda = (session) => {
    document.body.classList.remove("auth-view");
    const totalPermohonan = state.permohonan.length;
    const totalHasil = state.results.length;
    const totalRule = state.rules.length;

    content.innerHTML = `
      <div class="card">
        <h2>Selamat datang, ${session.username}</h2>
        <p class="helper-text">Pantau aktivitas terbaru SPK Fuzzy Tsukamoto dari sini.</p>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h3>Total Permohonan</h3>
          <p><strong>${totalPermohonan}</strong> data</p>
        </div>
        <div class="card">
          <h3>Total Hasil</h3>
          <p><strong>${totalHasil}</strong> data</p>
        </div>
        <div class="card">
          <h3>Total Rule</h3>
          <p><strong>${totalRule}</strong> rule tersimpan</p>
        </div>
      </div>
    `;
  };

  const renderPermohonan = (params) => {
    document.body.classList.remove("auth-view");
    const editId = params.get("edit");
    const editData = state.permohonan.find((item) => item.id === editId);

    const buildOptions = (variabel, selectedValue) =>
      (state.bobotOptions[variabel] || [])
        .map((option) => {
          const selected =
            Number(option.value) === Number(selectedValue) ? "selected" : "";
          return `<option value="${option.value}" ${selected}>${option.label} (${option.value})</option>`;
        })
        .join("");

    content.innerHTML = `
      <div class="card">
        <h2>${editData ? "Ubah" : "Tambah"} Permohonan</h2>
        <form id="permohonan-form" class="grid grid-2">
          <div>
            <label>Nama Pemohon</label>
            <input name="nama" value="${editData?.nama || ""}" required />
          </div>
          <div>
            <label>Tanggal Permohonan</label>
            <input name="tanggal" type="datetime-local" value="${
              editData
                ? new Date(editData.tanggal).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16)
            }" required />
          </div>
          <div>
            <label>Pendapatan</label>
            <select name="pendapatan" required>
              ${buildOptions("pendapatan", editData?.nilai?.pendapatan ?? "")}
            </select>
          </div>
          <div>
            <label>Pinjaman</label>
            <select name="pinjaman" required>
              ${buildOptions("pinjaman", editData?.nilai?.pinjaman ?? "")}
            </select>
          </div>
          <div>
            <label>Tenor</label>
            <select name="tenor" required>
              ${buildOptions("tenor", editData?.nilai?.tenor ?? "")}
            </select>
          </div>
          <div>
            <label>Jaminan</label>
            <select name="jaminan" required>
              ${buildOptions("jaminan", editData?.nilai?.jaminan ?? "")}
            </select>
          </div>
          <div class="grid" style="grid-column: 1 / -1;">
            <label>Keterangan</label>
            <textarea name="keterangan" rows="3">${
              editData?.keterangan || ""
            }</textarea>
          </div>
          <div class="action-row" style="grid-column: 1 / -1;">
            <button type="submit">Simpan</button>
            ${
              editData
                ? `<a class="btn secondary" href="#permohonan">Batal</a>`
                : ""
            }
          </div>
        </form>
      </div>
      <div class="card">
        <h2>Daftar Permohonan</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Tanggal</th>
              <th>Pendapatan</th>
              <th>Pinjaman</th>
              <th>Tenor</th>
              <th>Jaminan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${state.permohonan
              .map(
                (item) => `
                  <tr>
                    <td>${item.nama}</td>
                    <td>${formatDate(item.tanggal)}</td>
                    <td>${item.bobotPilihan.pendapatan.label}</td>
                    <td>${item.bobotPilihan.pinjaman.label}</td>
                    <td>${item.bobotPilihan.tenor.label}</td>
                    <td>${item.bobotPilihan.jaminan.label}</td>
                    <td>
                      <div class="action-row">
                        <button class="secondary" data-action="edit-permohonan" data-id="${
                          item.id
                        }">Ubah</button>
                        <button class="danger" data-action="hapus-permohonan" data-id="${
                          item.id
                        }">Hapus</button>
                        <a class="btn ghost" href="#proses?id=${
                          item.id
                        }">Lihat</a>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderHasil = () => {
    document.body.classList.remove("auth-view");
    content.innerHTML = `
      <div class="card">
        <h2>Data Hasil Permohonan</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Z (0-10)</th>
              <th>Z (0-100)</th>
              <th>Keputusan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${state.results
              .map((result) => {
                const permohonan = state.permohonan.find(
                  (item) => item.id === result.permohonanId
                );
                return `
                  <tr>
                    <td>${permohonan ? permohonan.nama : "-"}</td>
                    <td>${toFixed(result.z10)}</td>
                    <td>${toFixed(result.z100)}</td>
                    <td>
                      <span class="badge ${
                        result.keputusan === "Layak" ? "success" : "danger"
                      }">${result.keputusan}</span>
                    </td>
                    <td>
                      <a class="btn ghost" href="#proses?id=${
                        result.permohonanId
                      }">Lihat</a>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderProses = (params) => {
    document.body.classList.remove("auth-view");
    const id = params.get("id");
    const permohonan = state.permohonan.find((item) => item.id === id);
    const result = state.results.find((item) => item.permohonanId === id);

    if (!permohonan || !result) {
      content.innerHTML = `
        <div class="card">
          <h2>Data tidak ditemukan</h2>
          <p class="helper-text">Permohonan belum tersedia atau hasil belum dihitung.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="card">
        <h2>Detail Proses Permohonan</h2>
        <p><strong>Nama:</strong> ${permohonan.nama}</p>
        <p><strong>Tanggal:</strong> ${formatDate(permohonan.tanggal)}</p>
        <p><strong>Keputusan:</strong> ${result.keputusan}</p>
        <p><strong>Z (0-10):</strong> ${toFixed(result.z10)}</p>
        <p><strong>Z (0-100):</strong> ${toFixed(result.z100)}</p>
        <a class="btn" href="print.html?id=${
          permohonan.id
        }" target="_blank">Print View</a>
      </div>
      <div class="card">
        <h2>Rule Aktif</h2>
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
  };

  const renderAdminBobot = (params) => {
    document.body.classList.remove("auth-view");
    const editParam = params.get("edit");
    const [editVariabel, editIndex] = editParam
      ? editParam.split(":")
      : [null, null];
    const editOption =
      editVariabel && editIndex !== null
        ? state.bobotOptions[editVariabel]?.[Number(editIndex)]
        : null;

    content.innerHTML = `
      <div class="card">
        <h2>Data Kondisi & Bobot</h2>
        <p class="helper-text">Kelola bobot untuk tiap variabel (skala 0-10).</p>
      </div>
      ${state.variabel
        .map((variabel) => {
          const options = state.bobotOptions[variabel] || [];
          const isEditing = variabel === editVariabel;
          return `
            <div class="card">
              <h3>${variabel.toUpperCase()}</h3>
              <form class="grid grid-2" data-variabel="${variabel}" data-form="bobot">
                <div>
                  <label>Label</label>
                  <input name="label" value="${
                    isEditing ? editOption?.label || "" : ""
                  }" required />
                </div>
                <div>
                  <label>Nilai</label>
                  <input name="value" type="number" min="0" max="10" step="0.1" value="${
                    isEditing ? editOption?.value ?? "" : ""
                  }" required />
                </div>
                <div class="action-row" style="grid-column: 1 / -1;">
                  <button type="submit">${
                    isEditing ? "Simpan" : "Tambah"
                  }</button>
                  ${
                    isEditing
                      ? `<a class="btn secondary" href="#admin-bobot">Batal</a>`
                      : ""
                  }
                </div>
              </form>
              <table class="table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Nilai</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${options
                    .map(
                      (option, index) => `
                        <tr>
                          <td>${option.label}</td>
                          <td>${option.value}</td>
                          <td>
                            <div class="action-row">
                              <button class="secondary" data-action="edit-bobot" data-variabel="${variabel}" data-index="${index}">Ubah</button>
                              <button class="danger" data-action="hapus-bobot" data-variabel="${variabel}" data-index="${index}">Hapus</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `;
        })
        .join("")}
    `;
  };

  const renderAdminRule = (params) => {
    document.body.classList.remove("auth-view");
    const editId = params.get("edit");
    const editRule = state.rules.find((rule) => rule.id === editId);

    const optionSet = [
      { label: "TB", value: "TB" },
      { label: "CB", value: "CB" },
      { label: "SB", value: "SB" },
    ];

    const renderSelect = (name, selected) => `
      <select name="${name}" required>
        ${optionSet
          .map(
            (option) => `
              <option value="${option.value}" ${
              option.value === selected ? "selected" : ""
            }>${option.label}</option>
            `
          )
          .join("")}
      </select>
    `;

    content.innerHTML = `
      <div class="card">
        <h2>Data Rule</h2>
        <div class="action-row">
          <button data-action="generate-rule">Generate Default Rules (81)</button>
        </div>
      </div>
      <div class="card">
        <h3>${editRule ? "Ubah" : "Tambah"} Rule</h3>
        <form id="rule-form" class="grid grid-2">
          <div>
            <label>Pendapatan</label>
            ${renderSelect("pendapatan", editRule?.pendapatan)}
          </div>
          <div>
            <label>Pinjaman</label>
            ${renderSelect("pinjaman", editRule?.pinjaman)}
          </div>
          <div>
            <label>Tenor</label>
            ${renderSelect("tenor", editRule?.tenor)}
          </div>
          <div>
            <label>Jaminan</label>
            ${renderSelect("jaminan", editRule?.jaminan)}
          </div>
          <div>
            <label>Evaluasi</label>
            <select name="hasil" required>
              <option value="L" ${
                editRule?.hasil === "L" ? "selected" : ""
              }>L</option>
              <option value="TL" ${
                editRule?.hasil === "TL" ? "selected" : ""
              }>TL</option>
            </select>
          </div>
          <div class="action-row" style="grid-column: 1 / -1;">
            <button type="submit">Simpan</button>
            ${
              editRule
                ? `<a class="btn secondary" href="#admin-rule">Batal</a>`
                : ""
            }
          </div>
        </form>
      </div>
      <div class="card">
        <h3>Daftar Rule</h3>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pendapatan</th>
              <th>Pinjaman</th>
              <th>Tenor</th>
              <th>Jaminan</th>
              <th>Evaluasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${state.rules
              .map(
                (rule) => `
                  <tr>
                    <td>${rule.id}</td>
                    <td>${rule.pendapatan}</td>
                    <td>${rule.pinjaman}</td>
                    <td>${rule.tenor}</td>
                    <td>${rule.jaminan}</td>
                    <td>${rule.hasil}</td>
                    <td>
                      <div class="action-row">
                        <button class="secondary" data-action="edit-rule" data-id="${rule.id}">Ubah</button>
                        <button class="danger" data-action="hapus-rule" data-id="${rule.id}">Hapus</button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderPage = () => {
    state = loadState();
    syncResults();
    const session = getSession();
    const { path, params } = parseHash();

    if (!session && path !== "#masuk") {
      window.location.hash = "#masuk";
      return;
    }

    if (session && path === "#masuk") {
      window.location.hash = "#beranda";
      return;
    }

    renderSidebar(session, path);
    renderTopbar(session);

    if (!session) {
      renderLogin();
      return;
    }

    switch (path) {
      case "#beranda":
        renderBeranda(session);
        break;
      case "#permohonan":
        if (session.role !== "manager") {
          window.location.hash = "#beranda";
          return;
        }
        renderPermohonan(params);
        break;
      case "#hasil":
        if (session.role !== "manager") {
          window.location.hash = "#beranda";
          return;
        }
        renderHasil();
        break;
      case "#proses":
        if (session.role !== "manager") {
          window.location.hash = "#beranda";
          return;
        }
        renderProses(params);
        break;
      case "#admin-bobot":
        if (session.role !== "admin") {
          window.location.hash = "#beranda";
          return;
        }
        renderAdminBobot(params);
        break;
      case "#admin-rule":
        if (session.role !== "admin") {
          window.location.hash = "#beranda";
          return;
        }
        renderAdminRule(params);
        break;
      case "#masuk":
      default:
        renderLogin();
        break;
    }
  };

  const handleContentClick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-action='logout']")) {
      clearSession();
      window.location.hash = "#masuk";
      return;
    }

    if (target.matches("[data-action='edit-permohonan']")) {
      const id = target.dataset.id;
      window.location.hash = `#permohonan?edit=${id}`;
      return;
    }

    if (target.matches("[data-action='hapus-permohonan']")) {
      const id = target.dataset.id;
      deletePermohonan(id);
      renderPage();
      return;
    }

    if (target.matches("[data-action='edit-bobot']")) {
      const variabel = target.dataset.variabel;
      const index = target.dataset.index;
      window.location.hash = `#admin-bobot?edit=${variabel}:${index}`;
      return;
    }

    if (target.matches("[data-action='hapus-bobot']")) {
      const variabel = target.dataset.variabel;
      const index = Number(target.dataset.index);
      state.bobotOptions[variabel] = state.bobotOptions[variabel].filter(
        (_, idx) => idx !== index
      );
      saveState(state);
      renderPage();
      return;
    }

    if (target.matches("[data-action='edit-rule']")) {
      const id = target.dataset.id;
      window.location.hash = `#admin-rule?edit=${id}`;
      return;
    }

    if (target.matches("[data-action='hapus-rule']")) {
      const id = target.dataset.id;
      updateRules(state.rules.filter((rule) => rule.id !== id));
      renderPage();
      return;
    }

    if (target.matches("[data-action='generate-rule']")) {
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
      updateRules(rules);
      renderPage();
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === "login-form") {
      const formData = new FormData(form);
      const username = String(formData.get("username")).trim();
      const password = String(formData.get("password")).trim();
      const user = state.users.find(
        (item) => item.username === username && item.password === password
      );
      if (!user) {
        alert("Username atau password salah.");
        return;
      }
      setSession({ username: user.username, role: user.role });
      window.location.hash = "#beranda";
      return;
    }

    if (form.id === "permohonan-form") {
      const formData = new FormData(form);
      const editId = parseHash().params.get("edit");
      const nama = String(formData.get("nama")).trim();
      const tanggalRaw = String(formData.get("tanggal"));
      const tanggal = tanggalRaw ? new Date(tanggalRaw).toISOString() : null;
      const variabelValues = {};
      const bobotPilihan = {};
      state.variabel.forEach((variabel) => {
        const value = Number(formData.get(variabel));
        variabelValues[variabel] = value;
        bobotPilihan[variabel] = {
          label: findOptionLabel(variabel, value),
          value,
        };
      });

      const payload = {
        id: editId || `permohonan-${Date.now()}`,
        nama,
        tanggal,
        bobotPilihan,
        nilai: variabelValues,
        keterangan: String(formData.get("keterangan")).trim(),
      };

      savePermohonan(payload, editId);
      window.location.hash = "#permohonan";
      renderPage();
      return;
    }

    if (form.dataset.form === "bobot") {
      const variabel = form.dataset.variabel;
      const formData = new FormData(form);
      const label = String(formData.get("label")).trim();
      const value = Number(formData.get("value"));
      const editParam = parseHash().params.get("edit");
      const editIndex = editParam ? Number(editParam.split(":")[1]) : null;

      if (!state.bobotOptions[variabel]) {
        state.bobotOptions[variabel] = [];
      }

      if (editParam && editParam.startsWith(`${variabel}:`)) {
        state.bobotOptions[variabel][editIndex] = { label, value };
      } else {
        state.bobotOptions[variabel].push({ label, value });
      }

      saveState(state);
      window.location.hash = "#admin-bobot";
      renderPage();
      return;
    }

    if (form.id === "rule-form") {
      const formData = new FormData(form);
      const editId = parseHash().params.get("edit");
      const payload = {
        id: editId || `R-${Date.now()}`,
        pendapatan: String(formData.get("pendapatan")),
        pinjaman: String(formData.get("pinjaman")),
        tenor: String(formData.get("tenor")),
        jaminan: String(formData.get("jaminan")),
        hasil: String(formData.get("hasil")),
      };

      if (editId) {
        state.rules = state.rules.map((rule) =>
          rule.id === editId ? payload : rule
        );
      } else {
        state.rules.unshift(payload);
      }

      saveState(state);
      syncResults();
      window.location.hash = "#admin-rule";
      renderPage();
    }
  };

  const init = () => {
    syncResults();
    renderPage();
    window.addEventListener("hashchange", renderPage);
    document.addEventListener("click", handleContentClick);
    document.addEventListener("submit", handleFormSubmit);
  };

  return { init };
})();

App.init();
