(function (root, factory) {
  "use strict";

  const engine = typeof module === "object" && module.exports
    ? require("./quadratic-engine.js")
    : root.QuadraticEngine;
  const challenges = typeof module === "object" && module.exports
    ? require("../data/challenges.js")
    : root.CHALLENGE_DATA;
  const api = factory(engine, challenges);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ChallengeEngine = api;
  }
}(typeof window !== "undefined" ? window : globalThis, function (engine, challenges) {
  "use strict";

  if (!engine || !Array.isArray(challenges)) {
    throw new Error("ChallengeEngine 依赖 QuadraticEngine 和 CHALLENGE_DATA");
  }

  const requiredFields = ["id", "group", "groupTitle", "title", "prompt", "rule", "hint", "initial", "locks"];

  const ruleEvaluators = Object.freeze({
    "opening-up": (math) => math.a > engine.EPSILON,
    "passes-origin": (math) => Math.abs(math.c) <= engine.EPSILON,
    "vertex-below": (math) => math.vertex.y < -engine.EPSILON,
    "two-intersections": (math) => math.delta > engine.EPSILON,
    tangent: (math) => Math.abs(math.delta) <= engine.EPSILON,
    "no-intersections": (math) => math.delta < -engine.EPSILON,
    "positive-all-real": (math) => math.operator === ">" && math.a > 0 && math.delta < -engine.EPSILON,
    "negative-between-roots": (math) => math.operator === "<" && math.a > 0 && math.delta > engine.EPSILON,
    "roots-in-interval": (math) => math.operator === ">"
      && math.a > 0
      && math.deltaType === "positive"
      && math.roots[0] > 0
      && math.roots[1] < 2,
  });

  function validateChallenge(challenge) {
    if (!challenge || typeof challenge !== "object") {
      return { ok: false, message: "挑战定义必须是对象" };
    }
    const missing = requiredFields.filter((field) => !(field in challenge));
    if (missing.length > 0) {
      return { ok: false, message: `挑战缺少字段：${missing.join(", ")}` };
    }
    if (!Number.isInteger(challenge.id) || challenge.id < 1) {
      return { ok: false, message: "挑战 id 必须是正整数" };
    }
    if (!ruleEvaluators[challenge.rule]) {
      return { ok: false, message: `未知挑战规则：${challenge.rule}` };
    }
    const coefficientValidation = engine.validateCoefficients(
      challenge.initial.coefficients.a,
      challenge.initial.coefficients.b,
      challenge.initial.coefficients.c,
    );
    if (!coefficientValidation.ok) {
      return { ok: false, message: `挑战 ${challenge.id} 初始参数无效：${coefficientValidation.message}` };
    }
    if (![">", "<", ">=", "<="].includes(challenge.initial.operator)) {
      return { ok: false, message: `挑战 ${challenge.id} 初始不等号无效` };
    }
    return { ok: true };
  }

  function getChallenge(challengeId) {
    const challenge = challenges.find((item) => item.id === challengeId);
    if (!challenge) {
      throw new RangeError(`挑战 ${challengeId} 不存在`);
    }
    const validation = validateChallenge(challenge);
    if (!validation.ok) {
      throw new Error(validation.message);
    }
    return challenge;
  }

  function getChallengeSetup(challengeId) {
    const challenge = getChallenge(challengeId);
    return {
      coefficients: { ...challenge.initial.coefficients },
      operator: challenge.initial.operator,
      locks: { ...challenge.locks },
    };
  }

  function successReason(challenge, math) {
    const reasons = {
      "opening-up": `a = ${engine.formatNumber(math.a)} ＞ 0，抛物线开口向上`,
      "passes-origin": `c = 0，所以 f(0) = 0，图象经过原点`,
      "vertex-below": "顶点位于 x 轴下方，纵坐标小于 0",
      "two-intersections": `${math.deltaText}，方程有两个不相等实根`,
      tangent: `${math.deltaText}，方程有两个相等实根`,
      "no-intersections": `${math.deltaText}，方程没有实数根`,
      "positive-all-real": `a ＞ 0 且 ${math.deltaText}，图象始终在 x 轴上方`,
      "negative-between-roots": `a ＞ 0 且有两个实根，图象在两根之间位于 x 轴下方`,
      "roots-in-interval": "a ＞ 0、Δ ＞ 0，且 0 ＜ x₁ ＜ x₂ ＜ 2；所以正值区间恰在两根外。",
    };
    return reasons[challenge.rule];
  }

  function evaluateChallenge(challenge, math) {
    const validation = validateChallenge(challenge);
    if (!validation.ok) {
      return Object.freeze({ success: false, error: validation.message, reason: "挑战暂不可用" });
    }
    if (!math || typeof math !== "object") {
      return Object.freeze({ success: false, error: "缺少数学状态", reason: "无法判定" });
    }
    const success = Boolean(ruleEvaluators[challenge.rule](math));
    return Object.freeze({
      success,
      error: null,
      reason: success ? successReason(challenge, math) : "继续调整参数并观察图象",
    });
  }

  return Object.freeze({
    validateChallenge,
    getChallenge,
    getChallengeSetup,
    evaluateChallenge,
    challenges,
  });
}));
