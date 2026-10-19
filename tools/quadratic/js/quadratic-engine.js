(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.QuadraticEngine = api;
  }
}(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const EPSILON = 1e-9;
  const COEFFICIENT_LIMITS = Object.freeze({
    a: Object.freeze({ min: -5, max: 5 }),
    b: Object.freeze({ min: -10, max: 10 }),
    c: Object.freeze({ min: -10, max: 10 }),
  });
  const VALID_OPERATORS = new Set([">", "<", ">=", "<="]);

  function toFiniteNumber(value) {
    if (value === "" || value === null || typeof value === "boolean") {
      return null;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function cleanNumber(value) {
    if (Math.abs(value) <= EPSILON) {
      return 0;
    }
    const nearestInteger = Math.round(value);
    if (Math.abs(value - nearestInteger) <= EPSILON) {
      return nearestInteger;
    }
    return value;
  }

  function formatNumber(value, decimalPlaces = 2) {
    const cleaned = cleanNumber(value);
    const text = Number.isInteger(cleaned)
      ? String(cleaned)
      : cleaned.toFixed(decimalPlaces).replace(/\.?0+$/, "");
    return text.replace("-", "−");
  }

  function formatPolynomial(a, b, c) {
    const validation = validateCoefficients(a, b, c);
    if (!validation.ok) {
      throw new RangeError(validation.message);
    }
    const values = validation.values;
    const leadingMagnitude = Math.abs(values.a);
    let text = values.a < 0 ? "−" : "";
    text += Math.abs(leadingMagnitude - 1) <= EPSILON
      ? "x²"
      : `${formatNumber(leadingMagnitude)}x²`;

    if (Math.abs(values.b) > EPSILON) {
      const magnitude = Math.abs(values.b);
      const term = Math.abs(magnitude - 1) <= EPSILON ? "x" : `${formatNumber(magnitude)}x`;
      text += values.b > 0 ? ` + ${term}` : ` − ${term}`;
    }
    if (Math.abs(values.c) > EPSILON) {
      const magnitude = formatNumber(Math.abs(values.c));
      text += values.c > 0 ? ` + ${magnitude}` : ` − ${magnitude}`;
    }
    return text;
  }

  function validateCoefficient(field, value) {
    const numericValue = toFiniteNumber(value);
    if (numericValue === null) {
      return { ok: false, field, message: `${field} 必须是有限数字` };
    }

    const limits = COEFFICIENT_LIMITS[field];
    if (numericValue < limits.min || numericValue > limits.max) {
      return {
        ok: false,
        field,
        message: `${field} 必须在 ${limits.min} 到 ${limits.max} 之间`,
      };
    }

    if (field === "a" && Math.abs(numericValue) <= EPSILON) {
      return { ok: false, field, message: "二次函数要求二次项系数 a 不等于 0" };
    }

    return { ok: true, value: cleanNumber(numericValue) };
  }

  function validateCoefficients(a, b, c) {
    const inputs = { a, b, c };
    const values = {};

    for (const field of ["a", "b", "c"]) {
      const result = validateCoefficient(field, inputs[field]);
      if (!result.ok) {
        return result;
      }
      values[field] = result.value;
    }

    return { ok: true, values };
  }

  function validateOperator(operator) {
    if (!VALID_OPERATORS.has(operator)) {
      throw new RangeError(`不支持的不等号：${operator}`);
    }
  }

  function classifyDelta(delta) {
    if (delta > EPSILON) {
      return "positive";
    }
    if (delta < -EPSILON) {
      return "negative";
    }
    return "zero";
  }

  function isNeatlyDisplayable(value) {
    return Math.abs(value - Number(value.toFixed(2))) <= EPSILON;
  }

  function rootBoundary(value, index) {
    return isNeatlyDisplayable(value) ? formatNumber(value) : ["x₁", "x₂"][index];
  }

  function rootLabel(value, index) {
    return `${["x₁", "x₂"][index]} ${isNeatlyDisplayable(value) ? "=" : "≈"} ${formatNumber(value)}`;
  }

  function rootSummary(roots, deltaType) {
    if (deltaType === "negative") {
      return {
        equationText: "没有实数根",
        rootCountText: "方程没有实数根",
        rootFormulaText: "Δ ＜ 0，实数范围内无法开方",
      };
    }

    if (deltaType === "zero") {
      const rootText = formatNumber(roots[0]);
      const equality = isNeatlyDisplayable(roots[0]) ? "=" : "≈";
      return {
        equationText: `x₁ = x₂ ${equality} ${rootText}`,
        rootCountText: "有两个相等实根",
        rootFormulaText: `x ${equality} ${rootText}`,
      };
    }

    return {
      equationText: roots.map(rootLabel).join("，"),
      rootCountText: "有两个不相等实根",
      rootFormulaText: "x = (−b ± √Δ) / 2a",
    };
  }

  function makeSolution(kind, text, extra = {}) {
    return Object.freeze({ kind, text, ...extra });
  }

  function solveTwoRootInequality(state, operator) {
    const [x1, x2] = state.roots;
    const leftRoot = rootBoundary(x1, 0);
    const rightRoot = rootBoundary(x2, 1);
    const targetPositive = operator.startsWith(">");
    const includeRoots = operator.includes("=");
    const positiveOutside = state.a > 0;
    const wantsOutside = targetPositive === positiveOutside;

    if (wantsOutside) {
      const leftSign = includeRoots ? "≤" : "＜";
      const rightSign = includeRoots ? "≥" : "＞";
      return makeSolution("outside", `x ${leftSign} ${leftRoot} 或 x ${rightSign} ${rightRoot}`, {
        boundaries: [x1, x2],
        includeRoots,
      });
    }

    const relation = includeRoots ? "≤" : "＜";
    return makeSolution("inside", `${leftRoot} ${relation} x ${relation} ${rightRoot}`, {
      boundaries: [x1, x2],
      includeRoots,
    });
  }

  function solveDoubleRootInequality(state, operator) {
    const x0 = state.roots[0];
    const rootText = rootBoundary(x0, 0);
    const targetPositive = operator.startsWith(">");
    const includeRoot = operator.includes("=");
    const awayFromRootIsPositive = state.a > 0;
    const wantsAwayFromRoot = targetPositive === awayFromRootIsPositive;

    if (wantsAwayFromRoot) {
      return includeRoot
        ? makeSolution("all", "ℝ")
        : makeSolution("excluding-point", `x ≠ ${rootText}`, { point: x0 });
    }

    return includeRoot
      ? makeSolution("point", `x = ${rootText}`, { point: x0 })
      : makeSolution("empty", "∅");
  }

  function solveNoRootInequality(state, operator) {
    const targetPositive = operator.startsWith(">");
    const isPositive = state.a > 0;
    return targetPositive === isPositive
      ? makeSolution("all", "ℝ")
      : makeSolution("empty", "∅");
  }

  function solveInequality(state, operator) {
    validateOperator(operator);
    if (state.deltaType === "positive") {
      return solveTwoRootInequality(state, operator);
    }
    if (state.deltaType === "zero") {
      return solveDoubleRootInequality(state, operator);
    }
    return solveNoRootInequality(state, operator);
  }

  function buildSignChart(a, deltaType, roots) {
    if (deltaType === "positive") {
      const outsideSign = a > 0 ? 1 : -1;
      return Object.freeze({
        roots: Object.freeze([...roots]),
        signs: Object.freeze([outsideSign, -outsideSign, outsideSign]),
      });
    }
    const constantSign = a > 0 ? 1 : -1;
    return Object.freeze({
      roots: Object.freeze([...roots]),
      signs: Object.freeze(deltaType === "zero" ? [constantSign, constantSign] : [constantSign]),
    });
  }

  function operatorSymbol(operator) {
    return { ">": "＞", "<": "＜", ">=": "≥", "<=": "≤" }[operator];
  }

  function computeQuadraticState(aInput, bInput, cInput, operator = ">") {
    validateOperator(operator);
    const validation = validateCoefficients(aInput, bInput, cInput);
    if (!validation.ok) {
      throw new RangeError(validation.message);
    }

    const { a, b, c } = validation.values;
    const rawDelta = (b * b) - (4 * a * c);
    const deltaType = classifyDelta(rawDelta);
    const delta = deltaType === "zero" ? 0 : cleanNumber(rawDelta);
    const axisX = cleanNumber(-b / (2 * a));
    const vertexY = cleanNumber(-delta / (4 * a));
    let roots = [];

    if (deltaType === "positive") {
      const squareRoot = Math.sqrt(delta);
      roots = [
        cleanNumber((-b - squareRoot) / (2 * a)),
        cleanNumber((-b + squareRoot) / (2 * a)),
      ].sort((left, right) => left - right);
    } else if (deltaType === "zero") {
      roots = [axisX];
    }

    const deltaRelation = { positive: "＞", zero: "=", negative: "＜" }[deltaType];
    const intersectionText = {
      positive: "与 x 轴有两个交点",
      zero: "与 x 轴只有一个公共点（相切）",
      negative: "与 x 轴没有交点",
    }[deltaType];
    const summary = rootSummary(roots, deltaType);

    const state = {
      a,
      b,
      c,
      coefficients: Object.freeze({ a, b, c }),
      operator,
      operatorSymbol: operatorSymbol(operator),
      delta,
      deltaType,
      deltaText: `Δ = ${formatNumber(delta)} ${deltaRelation} 0`,
      opening: a > 0 ? "up" : "down",
      axisX,
      vertex: Object.freeze({ x: axisX, y: vertexY }),
      vertexLabel: `顶点${isNeatlyDisplayable(axisX) && isNeatlyDisplayable(vertexY) ? "" : " ≈"} (${formatNumber(axisX)}, ${formatNumber(vertexY)})`,
      roots: Object.freeze(roots),
      rootLabels: Object.freeze(roots.map(rootLabel)),
      rootNote: roots.some((value) => !isNeatlyDisplayable(value))
        ? "x₁、x₂ 表示方程的精确实根；小数仅为近似值。"
        : "",
      rootCount: roots.length,
      intersectionCount: roots.length,
      intersectionText,
      ...summary,
      signChart: buildSignChart(a, deltaType, roots),
    };

    state.solution = solveInequality(state, operator);
    return Object.freeze(state);
  }

  return Object.freeze({
    EPSILON,
    COEFFICIENT_LIMITS,
    validateCoefficients,
    computeQuadraticState,
    solveInequality,
    formatNumber,
    formatPolynomial,
    rootBoundary,
    operatorSymbol,
  });
}));
