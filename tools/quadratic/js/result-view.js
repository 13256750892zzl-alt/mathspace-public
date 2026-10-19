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
    root.ResultView = api;
  }
}(typeof window !== "undefined" ? window : globalThis, function (engine) {
  "use strict";

  if (!engine) {
    throw new Error("ResultView 需要先加载 QuadraticEngine");
  }

  function signToken(sign) {
    return Object.freeze({ kind: "sign", text: sign > 0 ? "+" : "−" });
  }

  function boundaryToken(value, index) {
    return Object.freeze({ kind: "boundary", text: engine.rootBoundary(value, index) });
  }

  function buildSignTokens(math) {
    if (math.deltaType === "positive") {
      return Object.freeze([
        Object.freeze({ kind: "end", text: "−∞" }),
        signToken(math.signChart.signs[0]),
        boundaryToken(math.roots[0], 0),
        signToken(math.signChart.signs[1]),
        boundaryToken(math.roots[1], 1),
        signToken(math.signChart.signs[2]),
        Object.freeze({ kind: "end", text: "+∞" }),
      ]);
    }

    if (math.deltaType === "zero") {
      return Object.freeze([
        Object.freeze({ kind: "end", text: "−∞" }),
        signToken(math.signChart.signs[0]),
        boundaryToken(math.roots[0], 0),
        signToken(math.signChart.signs[1]),
        Object.freeze({ kind: "end", text: "+∞" }),
      ]);
    }

    return Object.freeze([
      Object.freeze({ kind: "end", text: "−∞" }),
      signToken(math.signChart.signs[0]),
      Object.freeze({ kind: "end", text: "+∞" }),
    ]);
  }

  function buildResultModel(math) {
    const polynomial = engine.formatPolynomial(math.a, math.b, math.c);
    return Object.freeze({
      formulaLine: `y = ${polynomial}　↔　${polynomial} = 0　↔　${polynomial} ${math.operatorSymbol} 0`,
      deltaText: math.deltaText,
      intersectionText: math.intersectionText,
      equationText: math.equationText,
      rootCountText: math.rootCountText,
      rootFormulaText: math.rootFormulaText,
      inequalityText: `f(x) ${math.operatorSymbol} 0`,
      solutionText: math.solution.text,
      solutionNote: math.rootNote,
      signTokens: buildSignTokens(math),
    });
  }

  function render(elements, math) {
    const model = buildResultModel(math);
    elements.formulaLine.textContent = model.formulaLine;
    elements.delta.textContent = model.deltaText;
    elements.intersection.textContent = model.intersectionText;
    elements.roots.textContent = model.equationText;
    elements.rootCount.textContent = model.rootCountText;
    elements.inequality.textContent = model.inequalityText;
    elements.solution.textContent = model.solutionText;
    if (elements.solutionNote) {
      elements.solutionNote.textContent = model.solutionNote;
      elements.solutionNote.hidden = !model.solutionNote;
    }
    if (elements.signChart) {
      elements.signChart.replaceChildren();
      for (const token of model.signTokens) {
        const element = document.createElement(token.kind === "boundary" ? "b" : "span");
        element.className = `sign-token ${token.kind}`;
        element.textContent = token.text;
        elements.signChart.append(element);
      }
    }
    return model;
  }

  return Object.freeze({ buildResultModel, render });
}));
