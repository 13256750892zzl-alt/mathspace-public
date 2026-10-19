(function (root, factory) {
  "use strict";

  const challenges = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = challenges;
  }
  if (root) {
    root.CHALLENGE_DATA = challenges;
  }
}(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const rawChallenges = [
    {
      id: 1,
      group: 1,
      groupTitle: "控制图象",
      title: "改变开口方向",
      prompt: "让抛物线开口向上",
      rule: "opening-up",
      hint: "观察二次项系数 a 的符号。",
      initial: { coefficients: { a: -1, b: 0, c: -4 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 2,
      group: 1,
      groupTitle: "控制图象",
      title: "控制特殊点",
      prompt: "让抛物线经过原点",
      rule: "passes-origin",
      hint: "把 x = 0 代入函数，哪个系数决定函数值？",
      initial: { coefficients: { a: 1, b: 0, c: -4 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 3,
      group: 1,
      groupTitle: "控制图象",
      title: "控制顶点位置",
      prompt: "让抛物线的顶点落在 x 轴下方",
      rule: "vertex-below",
      hint: "观察顶点纵坐标，不需要让顶点落在特定位置。",
      initial: { coefficients: { a: 1, b: 0, c: 4 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 4,
      group: 2,
      groupTitle: "用 Δ 控制交点",
      title: "制造两个交点",
      prompt: "让图象与 x 轴有两个公共点",
      rule: "two-intersections",
      hint: "要让方程有两个不相等实根，Δ 应满足什么条件？",
      initial: { coefficients: { a: 1, b: 0, c: 1 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 5,
      group: 2,
      groupTitle: "用 Δ 控制交点",
      title: "制造相切",
      prompt: "让图象与 x 轴只有一个公共点",
      rule: "tangent",
      hint: "只有一个公共点对应方程的两个实根相等。",
      initial: { coefficients: { a: 1, b: 0, c: -4 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 6,
      group: 2,
      groupTitle: "用 Δ 控制交点",
      title: "消除交点",
      prompt: "让图象与 x 轴没有公共点",
      rule: "no-intersections",
      hint: "没有公共点时，对应方程没有实数根。",
      initial: { coefficients: { a: 1, b: 0, c: -4 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 7,
      group: 3,
      groupTitle: "由图象确定解集",
      title: "恒正问题",
      prompt: "使 f(x) ＞ 0 的解集为全体实数",
      rule: "positive-all-real",
      hint: "图象要始终位于 x 轴上方：先看开口，再看交点。",
      initial: { coefficients: { a: 1, b: 0, c: -4 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 8,
      group: 3,
      groupTitle: "由图象确定解集",
      title: "两根之间",
      prompt: "使 f(x) ＜ 0 的解集位于两个实根之间",
      rule: "negative-between-roots",
      hint: "要让两根之间的图象在 x 轴下方，开口方向应怎样？",
      initial: { coefficients: { a: -1, b: 0, c: 4 }, operator: "<" },
      locks: { a: false, b: false, c: false },
    },
    {
      id: 9,
      group: 3,
      groupTitle: "由图象确定解集",
      title: "根的区间控制",
      prompt: "调整 a、b、c，使方程有两个不同实根 0 ＜ x₁ ＜ x₂ ＜ 2，且 f(x) ＞ 0 恰在两根外成立。",
      rule: "roots-in-interval",
      hint: "先确定开口，再检查 Δ、对称轴位置，以及 f(0)、f(2) 的符号；两个端点不能取到。",
      initial: { coefficients: { a: -1, b: 0, c: 4 }, operator: ">" },
      locks: { a: false, b: false, c: false },
    },
  ];

  return Object.freeze(rawChallenges.map((challenge) => Object.freeze({
    ...challenge,
    initial: Object.freeze({
      coefficients: Object.freeze({ ...challenge.initial.coefficients }),
      operator: challenge.initial.operator,
    }),
    locks: Object.freeze({ ...challenge.locks }),
  })));
}));
