const STORAGE_KEY = "spk-tsukamoto-state";

const cloneState = (state) => JSON.parse(JSON.stringify(state));

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = cloneState(SeedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const seed = cloneState(SeedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const resetState = () => {
  const seed = cloneState(SeedData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};
