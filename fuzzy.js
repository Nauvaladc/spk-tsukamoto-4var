const FuzzyTsukamoto = (() => {
  const linearDown = (x, min, max) => {
    if (x <= min) return 1;
    if (x >= max) return 0;
    return (max - x) / (max - min);
  };

  const linearUp = (x, min, max) => {
    if (x <= min) return 0;
    if (x >= max) return 1;
    return (x - min) / (max - min);
  };

  const triangle = (x, a, b, c) => {
    if (x <= a || x >= c) return 0;
    if (x === b) return 1;
    if (x < b) return (x - a) / (b - a);
    return (c - x) / (c - b);
  };

  const getMembership = (value, label) => {
    switch (label) {
      case "TB":
        return linearDown(value, 0, 4);
      case "CB":
        return triangle(value, 3, 5, 7);
      case "SB":
        return linearUp(value, 6, 10);
      default:
        return 0;
    }
  };

  const hitung = (inputs, rules) => {
    let sumAlpha = 0;
    let sumAlphaZ = 0;
    const ruleAktif = [];

    rules.forEach((rule, index) => {
      const muPendapatan = getMembership(inputs.pendapatan, rule.pendapatan);
      const muPinjaman = getMembership(inputs.pinjaman, rule.pinjaman);
      const muTenor = getMembership(inputs.tenor, rule.tenor);
      const muJaminan = getMembership(inputs.jaminan, rule.jaminan);
      const alpha = Math.min(
        muPendapatan,
        muPinjaman,
        muTenor,
        muJaminan
      );
      if (alpha <= 0) return;
      const z = rule.hasil === "TL" ? 4 - 4 * alpha : 6 + 4 * alpha;
      ruleAktif.push({
        ruleId: rule.id || `R${index + 1}`,
        mu: {
          pendapatan: muPendapatan,
          pinjaman: muPinjaman,
          tenor: muTenor,
          jaminan: muJaminan,
        },
        alpha,
        z,
      });
      sumAlpha += alpha;
      sumAlphaZ += alpha * z;
    });

    const z = sumAlpha === 0 ? 0 : sumAlphaZ / sumAlpha;
    return { z, ruleAktif };
  };

  return { hitung };
})();
