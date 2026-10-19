(function (root, factory) {
  "use strict";

  const engine = typeof module === "object" && module.exports
    ? require("./quadratic-engine.js")
    : root.QuadraticEngine;
  const api = factory(engine);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AppStateStore = api;
  }
}(typeof window !== "undefined" ? window : globalThis, function (engine) {
  "use strict";

  if (!engine) {
    throw new Error("AppStateStore 需要先加载 QuadraticEngine");
  }

  const DEFAULT_STATE = Object.freeze({
    coefficients: Object.freeze({ a: 1, b: 0, c: -4 }),
    operator: ">",
    mode: "lab",
    visibility: Object.freeze({ roots: true, vertex: true, results: true }),
    locks: Object.freeze({ a: false, b: false, c: false }),
    viewport: Object.freeze({ xMin: -10, xMax: 10, yMin: -10, yMax: 10, auto: false }),
    currentChallengeId: null,
  });

  const VALID_MODES = new Set(["lab", "challenge"]);
  const VISIBILITY_KEYS = new Set(["roots", "vertex", "results"]);
  const COEFFICIENT_KEYS = new Set(["a", "b", "c"]);

  function freezeState(source, version) {
    const coefficients = Object.freeze({ ...source.coefficients });
    const visibility = Object.freeze({ ...source.visibility });
    const locks = Object.freeze({ ...source.locks });
    const viewport = Object.freeze({ ...source.viewport });
    const math = engine.computeQuadraticState(
      coefficients.a,
      coefficients.b,
      coefficients.c,
      source.operator,
    );

    return Object.freeze({
      coefficients,
      operator: source.operator,
      mode: source.mode,
      visibility,
      locks,
      viewport,
      currentChallengeId: source.currentChallengeId,
      math,
      version,
    });
  }

  function buildDefaultState(version = 0) {
    return freezeState(DEFAULT_STATE, version);
  }

  function createStore(initial = {}) {
    const initialSource = {
      coefficients: { ...DEFAULT_STATE.coefficients, ...(initial.coefficients || {}) },
      operator: initial.operator || DEFAULT_STATE.operator,
      mode: initial.mode || DEFAULT_STATE.mode,
      visibility: { ...DEFAULT_STATE.visibility, ...(initial.visibility || {}) },
      locks: { ...DEFAULT_STATE.locks, ...(initial.locks || {}) },
      viewport: { ...DEFAULT_STATE.viewport, ...(initial.viewport || {}) },
      currentChallengeId: initial.currentChallengeId ?? DEFAULT_STATE.currentChallengeId,
    };
    let state = freezeState(initialSource, 0);
    const listeners = new Set();

    function publish(source) {
      state = freezeState(source, state.version + 1);
      for (const listener of listeners) {
        listener(state);
      }
      return { ok: true, state };
    }

    function withCurrent(overrides = {}) {
      return {
        coefficients: state.coefficients,
        operator: state.operator,
        mode: state.mode,
        visibility: state.visibility,
        locks: state.locks,
        viewport: state.viewport,
        currentChallengeId: state.currentChallengeId,
        ...overrides,
      };
    }

    function updateCoefficient(field, value) {
      if (!COEFFICIENT_KEYS.has(field)) {
        return { ok: false, field, message: `未知参数：${field}`, state };
      }
      if (state.locks[field]) {
        return { ok: false, field, message: `${field} 已锁定`, state };
      }

      const candidate = { ...state.coefficients, [field]: value };
      const validation = engine.validateCoefficients(candidate.a, candidate.b, candidate.c);
      if (!validation.ok) {
        return { ...validation, state };
      }
      return publish(withCurrent({ coefficients: validation.values }));
    }

    function setOperator(operator) {
      try {
        engine.computeQuadraticState(
          state.coefficients.a,
          state.coefficients.b,
          state.coefficients.c,
          operator,
        );
      } catch (error) {
        return { ok: false, message: error.message, state };
      }
      return publish(withCurrent({ operator }));
    }

    function setMode(mode) {
      if (!VALID_MODES.has(mode)) {
        return { ok: false, message: `未知模式：${mode}`, state };
      }
      return publish(withCurrent({ mode }));
    }

    function toggleVisibility(key) {
      if (!VISIBILITY_KEYS.has(key)) {
        return { ok: false, message: `未知显示项：${key}`, state };
      }
      return publish(withCurrent({
        visibility: { ...state.visibility, [key]: !state.visibility[key] },
      }));
    }

    function setVisibility(key, visible) {
      if (!VISIBILITY_KEYS.has(key) || typeof visible !== "boolean") {
        return { ok: false, message: `无效显示设置：${key}`, state };
      }
      return publish(withCurrent({
        visibility: { ...state.visibility, [key]: visible },
      }));
    }

    function toggleLock(field) {
      if (!COEFFICIENT_KEYS.has(field)) {
        return { ok: false, field, message: `未知参数：${field}`, state };
      }
      return publish(withCurrent({
        locks: { ...state.locks, [field]: !state.locks[field] },
      }));
    }

    function setLocks(locks) {
      const nextLocks = { ...state.locks };
      for (const field of Object.keys(locks || {})) {
        if (!COEFFICIENT_KEYS.has(field) || typeof locks[field] !== "boolean") {
          return { ok: false, message: `无效锁定设置：${field}`, state };
        }
        nextLocks[field] = locks[field];
      }
      return publish(withCurrent({ locks: nextLocks }));
    }

    function setViewport(viewport) {
      const nextViewport = { ...state.viewport, ...viewport };
      const values = [nextViewport.xMin, nextViewport.xMax, nextViewport.yMin, nextViewport.yMax];
      if (!values.every(Number.isFinite)
        || nextViewport.xMin >= nextViewport.xMax
        || nextViewport.yMin >= nextViewport.yMax) {
        return { ok: false, message: "坐标范围必须是递增的有限数值", state };
      }
      nextViewport.auto = Boolean(nextViewport.auto);
      return publish(withCurrent({ viewport: nextViewport }));
    }

    function setCurrentChallenge(challengeId) {
      if (challengeId !== null && (!Number.isInteger(challengeId) || challengeId < 1)) {
        return { ok: false, message: "挑战编号必须是正整数或 null", state };
      }
      return publish(withCurrent({ currentChallengeId: challengeId }));
    }

    function applyScenario(scenario) {
      if (!scenario || typeof scenario !== "object") {
        return { ok: false, message: "场景设置必须是对象", state };
      }
      const coefficients = scenario.coefficients || state.coefficients;
      const validation = engine.validateCoefficients(coefficients.a, coefficients.b, coefficients.c);
      if (!validation.ok) {
        return { ...validation, state };
      }
      const operator = scenario.operator || state.operator;
      try {
        engine.computeQuadraticState(validation.values.a, validation.values.b, validation.values.c, operator);
      } catch (error) {
        return { ok: false, message: error.message, state };
      }
      const mode = scenario.mode || state.mode;
      if (!VALID_MODES.has(mode)) {
        return { ok: false, message: `未知模式：${mode}`, state };
      }
      const locks = { ...state.locks, ...(scenario.locks || {}) };
      if (Object.keys(locks).some((field) => !COEFFICIENT_KEYS.has(field) || typeof locks[field] !== "boolean")) {
        return { ok: false, message: "场景包含无效锁定设置", state };
      }
      const challengeId = scenario.currentChallengeId ?? state.currentChallengeId;
      if (challengeId !== null && (!Number.isInteger(challengeId) || challengeId < 1)) {
        return { ok: false, message: "挑战编号必须是正整数或 null", state };
      }
      return publish(withCurrent({
        coefficients: validation.values,
        operator,
        mode,
        locks,
        currentChallengeId: challengeId,
      }));
    }

    function reset() {
      const next = buildDefaultState(state.version + 1);
      state = next;
      for (const listener of listeners) {
        listener(state);
      }
      return { ok: true, state };
    }

    function subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("订阅者必须是函数");
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    return Object.freeze({
      getState: () => state,
      subscribe,
      updateCoefficient,
      setOperator,
      setMode,
      toggleVisibility,
      setVisibility,
      toggleLock,
      setLocks,
      setViewport,
      setCurrentChallenge,
      applyScenario,
      reset,
    });
  }

  return Object.freeze({ DEFAULT_STATE, createStore });
}));
