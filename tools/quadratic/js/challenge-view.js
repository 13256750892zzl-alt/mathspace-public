(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ChallengeView = api;
  }
}(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function buildChallengeViewModel(challenge, evaluation, total, hintVisible) {
    if (!challenge || !evaluation) {
      throw new TypeError("挑战视图需要关卡与判定结果");
    }
    return Object.freeze({
      indexText: `挑战 ${challenge.id} / ${total}`,
      groupText: `第 ${challenge.group} 组 · ${challenge.groupTitle}`,
      promptText: challenge.prompt,
      hintText: hintVisible ? challenge.hint : "",
      statusText: evaluation.success ? "挑战达成" : "尚未达成",
      reasonText: evaluation.success ? evaluation.reason : "",
      success: Boolean(evaluation.success),
      nextText: challenge.id === total ? "回到第 1 关" : "下一关",
      disabled: Boolean(evaluation.error),
    });
  }

  function render(elements, challenge, evaluation, total, hintVisible) {
    const model = buildChallengeViewModel(challenge, evaluation, total, hintVisible);
    elements.container.classList.toggle("is-success", model.success);
    elements.container.classList.toggle("is-disabled", model.disabled);
    elements.index.textContent = model.indexText;
    elements.group.textContent = model.groupText;
    elements.prompt.textContent = model.promptText;
    elements.status.textContent = model.statusText;
    elements.hint.textContent = model.hintText;
    elements.hint.hidden = !model.hintText;
    elements.reason.textContent = model.reasonText;
    elements.reason.hidden = !model.reasonText;
    elements.next.textContent = model.nextText;
    elements.hintButton.disabled = model.disabled;
    elements.next.disabled = model.disabled;
    return model;
  }

  return Object.freeze({ buildChallengeViewModel, render });
}));
