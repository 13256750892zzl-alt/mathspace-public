(function () {
  "use strict";

  const parameterNames = ["a", "b", "c"];

  function byId(id) {
    return document.getElementById(id);
  }

  function initializeShell() {
    if (!window.AppStateStore || !window.QuadraticEngine || !window.GraphView
      || !window.ResultView || !window.ChallengeEngine || !window.ChallengeView) {
      throw new Error("应用依赖加载失败");
    }

    const store = window.AppStateStore.createStore();
    const parameterElements = Object.fromEntries(parameterNames.map((field) => [field, {
      range: byId(`${field}-range`),
      number: byId(`${field}-number`),
      error: byId(`${field}-error`),
      lock: document.querySelector(`[data-lock="${field}"]`),
    }]));
    const modeButtons = [...document.querySelectorAll("[data-mode]")];
    const operatorButtons = [...document.querySelectorAll("[data-operator]")];
    const visibilityButtons = [...document.querySelectorAll("[data-toggle]")];
    const challengeStrip = byId("challenge-strip");
    const challengeElements = {
      container: challengeStrip,
      index: byId("challenge-index"),
      group: byId("challenge-group"),
      prompt: byId("challenge-prompt"),
      status: byId("challenge-status"),
      hint: byId("challenge-hint"),
      reason: byId("challenge-reason"),
      hintButton: byId("hint-button"),
      next: byId("next-challenge-button"),
    };
    const resultColumn = document.querySelector(".result-column");
    const graph = byId("quadratic-graph");
    const graphPlaceholder = byId("graph-placeholder");
    const resultElements = {
      formulaLine: byId("formula-line"),
      delta: byId("delta-output"),
      intersection: byId("intersection-output"),
      roots: byId("roots-output"),
      rootCount: byId("root-count-output"),
      inequality: byId("inequality-output"),
      solution: byId("solution-output"),
      solutionNote: byId("solution-note"),
    };
    let hintVisible = false;
    let latestChallengeEvaluation = null;

    function clearError(field) {
      parameterElements[field].error.textContent = "";
    }

    function showUpdateError(field, result) {
      const currentValue = store.getState().coefficients[field];
      const elements = parameterElements[field];
      elements.range.value = currentValue;
      elements.number.value = currentValue;
      elements.error.textContent = result.message;
    }

    function updateCoefficient(field, rawValue, source) {
      if (source === "number" && parameterElements[field].number.validity.stepMismatch) {
        showUpdateError(field, { message: "请按 0.1 的步长输入，例如 0.3。" });
        return;
      }
      let value = rawValue;
      if (field === "a" && Number(value) === 0 && source === "range") {
        value = store.getState().coefficients.a < 0 ? 0.1 : -0.1;
      }
      const result = store.updateCoefficient(field, value);
      if (!result.ok) {
        showUpdateError(field, result);
        return;
      }
      clearError(field);
    }

    for (const field of parameterNames) {
      const elements = parameterElements[field];
      elements.range.addEventListener("input", (event) => {
        updateCoefficient(field, event.currentTarget.value, "range");
      });
      elements.number.addEventListener("change", (event) => {
        updateCoefficient(field, event.currentTarget.value, "number");
      });
      elements.lock.addEventListener("click", () => store.toggleLock(field));
    }

    for (const button of operatorButtons) {
      button.addEventListener("click", () => store.setOperator(button.dataset.operator));
    }
    function loadChallenge(challengeId) {
      const setup = window.ChallengeEngine.getChallengeSetup(challengeId);
      hintVisible = false;
      return store.applyScenario({
        ...setup,
        mode: "challenge",
        currentChallengeId: challengeId,
      });
    }

    for (const button of modeButtons) {
      button.addEventListener("click", () => {
        if (button.dataset.mode === "challenge") {
          loadChallenge(store.getState().currentChallengeId || 1);
        } else {
          hintVisible = false;
          store.setMode("lab");
        }
      });
    }
    for (const button of visibilityButtons) {
      button.addEventListener("click", () => store.toggleVisibility(button.dataset.toggle));
    }

    byId("reset-button").addEventListener("click", () => {
      parameterNames.forEach(clearError);
      store.reset();
    });

    const themeButton = byId("theme-button");
    function updateThemeButton() {
      const isDark = document.documentElement.dataset.theme === "dark";
      themeButton.textContent = isDark ? "浅色模式" : "深色模式";
      themeButton.setAttribute("aria-label", `切换到${isDark ? "浅色" : "深色"}模式`);
    }
    themeButton.addEventListener("click", () => {
      const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem("quadratic-theme", theme); } catch (_) { /* 存储受限时仅切换当前页面。 */ }
      updateThemeButton();
    });
    updateThemeButton();
    challengeElements.hintButton.addEventListener("click", () => {
      hintVisible = !hintVisible;
      render(store.getState());
    });
    challengeElements.next.addEventListener("click", () => {
      const currentId = store.getState().currentChallengeId || 1;
      const total = window.ChallengeEngine.challenges.length;
      loadChallenge(currentId === total ? 1 : currentId + 1);
    });
    byId("fit-view-button").addEventListener("click", () => {
      const state = store.getState();
      const viewport = state.viewport.auto
        ? window.AppStateStore.DEFAULT_STATE.viewport
        : window.GraphView.computeAutoViewport(state.math);
      store.setViewport(viewport);
    });

    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }

    byId("fullscreen-button").addEventListener("click", toggleFullscreen);
    document.addEventListener("keydown", (event) => {
      const tagName = event.target && event.target.tagName;
      if (event.key.toLowerCase() === "f" && tagName !== "INPUT") {
        event.preventDefault();
        toggleFullscreen();
      }
    });

    function render(state) {
      for (const field of parameterNames) {
        const elements = parameterElements[field];
        const value = state.coefficients[field];
        elements.range.value = value;
        elements.number.value = value;
        elements.range.disabled = state.locks[field];
        elements.number.disabled = state.locks[field];
        elements.lock.classList.toggle("is-active", state.locks[field]);
        elements.lock.setAttribute("aria-pressed", String(state.locks[field]));
        elements.lock.textContent = state.locks[field] ? "已锁定" : "锁定";
      }

      for (const button of modeButtons) {
        button.classList.toggle("is-active", button.dataset.mode === state.mode);
        button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
      }
      for (const button of operatorButtons) {
        button.classList.toggle("is-active", button.dataset.operator === state.operator);
        button.setAttribute("aria-pressed", String(button.dataset.operator === state.operator));
      }
      for (const button of visibilityButtons) {
        button.classList.toggle("is-active", state.visibility[button.dataset.toggle]);
        button.setAttribute("aria-pressed", String(state.visibility[button.dataset.toggle]));
        const labels = {
          roots: state.visibility.roots ? "隐藏交点" : "显示交点",
          vertex: state.visibility.vertex ? "隐藏顶点" : "显示顶点",
          results: state.visibility.results ? "遮住结论" : "揭示结论",
        };
        button.textContent = labels[button.dataset.toggle];
      }

      challengeStrip.hidden = state.mode !== "challenge";
      latestChallengeEvaluation = null;
      if (state.mode === "challenge") {
        const challenge = window.ChallengeEngine.getChallenge(state.currentChallengeId || 1);
        latestChallengeEvaluation = window.ChallengeEngine.evaluateChallenge(challenge, state.math);
        window.ChallengeView.render(
          challengeElements,
          challenge,
          latestChallengeEvaluation,
          window.ChallengeEngine.challenges.length,
          hintVisible,
        );
      }
      const resultsMasked = state.mode === "challenge"
        ? !latestChallengeEvaluation.success
        : !state.visibility.results;
      resultColumn.classList.toggle("is-masked", resultsMasked);
      const resultToggle = visibilityButtons.find((button) => button.dataset.toggle === "results");
      resultToggle.disabled = state.mode === "challenge";
      byId("fit-view-button").classList.toggle("is-active", state.viewport.auto);
      byId("fit-view-button").textContent = state.viewport.auto ? "固定坐标" : "自动适配";
      window.GraphView.render(graph, state);
      window.ResultView.render(resultElements, state.math);
      graphPlaceholder.hidden = true;
      document.documentElement.dataset.mode = state.mode;
      document.documentElement.dataset.stateVersion = String(state.version);
    }

    store.subscribe(render);
    render(store.getState());
    if (typeof ResizeObserver === "function") {
      let resizeFrame = null;
      const resizeObserver = new ResizeObserver(() => {
        if (resizeFrame !== null) {
          cancelAnimationFrame(resizeFrame);
        }
        resizeFrame = requestAnimationFrame(() => {
          window.GraphView.render(graph, store.getState());
          resizeFrame = null;
        });
      });
      resizeObserver.observe(graph);
    }
    window.AppLab = Object.freeze({ store, loadChallenge });
    document.documentElement.dataset.appReady = "true";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeShell, { once: true });
  } else {
    initializeShell();
  }
}());
