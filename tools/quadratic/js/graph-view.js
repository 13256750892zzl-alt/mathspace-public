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
    root.GraphView = api;
  }
}(typeof window !== "undefined" ? window : globalThis, function (engine) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const DEFAULT_DIMENSIONS = Object.freeze({
    width: 900,
    height: 560,
    padding: Object.freeze({ left: 64, right: 36, top: 30, bottom: 50 }),
  });

  function validateViewport(viewport) {
    const values = [viewport.xMin, viewport.xMax, viewport.yMin, viewport.yMax];
    if (!values.every(Number.isFinite)
      || viewport.xMin >= viewport.xMax
      || viewport.yMin >= viewport.yMax) {
      throw new RangeError("坐标范围必须是递增的有限数值");
    }
  }

  function validateDimensions(dimensions) {
    const { width, height, padding } = dimensions;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0
      || !padding || width <= padding.left + padding.right || height <= padding.top + padding.bottom) {
      throw new RangeError("画布尺寸必须大于绘图区边距");
    }
  }

  function createMapper(viewport, dimensions = DEFAULT_DIMENSIONS) {
    validateViewport(viewport);
    validateDimensions(dimensions);
    const plotWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const plotHeight = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;
    const xScale = plotWidth / (viewport.xMax - viewport.xMin);
    const yScale = plotHeight / (viewport.yMax - viewport.yMin);

    return Object.freeze({
      xToPixel: (x) => dimensions.padding.left + ((x - viewport.xMin) * xScale),
      yToPixel: (y) => dimensions.padding.top + ((viewport.yMax - y) * yScale),
      pixelToX: (pixelX) => viewport.xMin + ((pixelX - dimensions.padding.left) / xScale),
      pixelToY: (pixelY) => viewport.yMax - ((pixelY - dimensions.padding.top) / yScale),
      plotWidth,
      plotHeight,
    });
  }

  function evaluate(math, x) {
    return (math.a * x * x) + (math.b * x) + math.c;
  }

  function sampleParabola(math, viewport, count = 361) {
    validateViewport(viewport);
    if (!Number.isInteger(count) || count < 2) {
      throw new RangeError("采样点数量至少为 2");
    }
    const step = (viewport.xMax - viewport.xMin) / (count - 1);
    return Array.from({ length: count }, (_, index) => {
      const x = index === count - 1 ? viewport.xMax : viewport.xMin + (step * index);
      return Object.freeze({ x, y: evaluate(math, x) });
    });
  }

  function paddedRange(minimum, maximum, minimumSpan) {
    let min = minimum;
    let max = maximum;
    if (max - min < minimumSpan) {
      const center = (min + max) / 2;
      min = center - (minimumSpan / 2);
      max = center + (minimumSpan / 2);
    }
    const padding = (max - min) * 0.18;
    return [min - padding, max + padding];
  }

  function computeAutoViewport(math) {
    const xCandidates = [0, math.vertex.x, ...math.roots];
    let [xMin, xMax] = paddedRange(Math.min(...xCandidates), Math.max(...xCandidates), 8);
    xMin = Math.max(-50, xMin);
    xMax = Math.min(50, xMax);

    const yCandidates = [0, math.vertex.y, evaluate(math, xMin), evaluate(math, xMax)]
      .filter(Number.isFinite);
    let [yMin, yMax] = paddedRange(Math.min(...yCandidates), Math.max(...yCandidates), 8);
    yMin = Math.max(-100, yMin);
    yMax = Math.min(100, yMax);

    if (yMin >= yMax) {
      yMin = -10;
      yMax = 10;
    }

    return Object.freeze({ xMin, xMax, yMin, yMax, auto: true });
  }

  function niceStep(range, targetTicks = 10) {
    const rough = range / targetTicks;
    const power = 10 ** Math.floor(Math.log10(rough));
    const normalized = rough / power;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * power;
  }

  function ticksBetween(minimum, maximum) {
    const step = niceStep(maximum - minimum);
    const start = Math.ceil(minimum / step) * step;
    const ticks = [];
    for (let value = start; value <= maximum + (step * 0.01); value += step) {
      ticks.push(Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(10)));
    }
    return ticks;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function edgeIndicator(kind, mathX, mathY, mapper, dimensions) {
    const left = dimensions.padding.left;
    const right = dimensions.width - dimensions.padding.right;
    const top = dimensions.padding.top;
    const bottom = dimensions.height - dimensions.padding.bottom;
    const rawX = mapper.xToPixel(mathX);
    const rawY = mapper.yToPixel(mathY);
    return Object.freeze({
      kind,
      mathX,
      mathY,
      x: clamp(rawX, left, right),
      y: clamp(rawY, top, bottom),
      direction: rawX < left ? "left" : rawX > right ? "right" : rawY < top ? "up" : "down",
    });
  }

  function buildGraphModel(math, viewport, dimensions = DEFAULT_DIMENSIONS) {
    const mapper = createMapper(viewport, dimensions);
    const points = sampleParabola(math, viewport);
    const pathData = points.map((point, index) => {
      const x = mapper.xToPixel(point.x);
      const y = clamp(mapper.yToPixel(point.y), -10000, 10000);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
    const isVisible = (x, y) => x >= viewport.xMin && x <= viewport.xMax
      && y >= viewport.yMin && y <= viewport.yMax;
    const rootPoints = [];
    const edgeIndicators = [];

    for (const [rootIndex, rootValue] of math.roots.entries()) {
      if (isVisible(rootValue, 0)) {
        rootPoints.push(Object.freeze({
          mathX: rootValue,
          mathY: 0,
          label: math.rootLabels[rootIndex],
          x: mapper.xToPixel(rootValue),
          y: mapper.yToPixel(0),
        }));
      } else {
        edgeIndicators.push(edgeIndicator("root", rootValue, 0, mapper, dimensions));
      }
    }

    let vertexPoint = null;
    if (isVisible(math.vertex.x, math.vertex.y)) {
      vertexPoint = Object.freeze({
        mathX: math.vertex.x,
        mathY: math.vertex.y,
        x: mapper.xToPixel(math.vertex.x),
        y: mapper.yToPixel(math.vertex.y),
      });
    } else {
      edgeIndicators.push(edgeIndicator("vertex", math.vertex.x, math.vertex.y, mapper, dimensions));
    }

    return Object.freeze({
      mapper,
      pathData,
      xTicks: Object.freeze(ticksBetween(viewport.xMin, viewport.xMax)),
      yTicks: Object.freeze(ticksBetween(viewport.yMin, viewport.yMax)),
      rootPoints: Object.freeze(rootPoints),
      vertexPoint,
      edgeIndicators: Object.freeze(edgeIndicators),
      viewport,
      dimensions,
    });
  }

  function svgElement(name, attributes = {}, text = "") {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, String(value));
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function dimensionsForSvg(svg) {
    const bounds = svg.getBoundingClientRect();
    const width = Math.max(240, Math.round(bounds.width) || DEFAULT_DIMENSIONS.width);
    const height = Math.max(200, Math.round(bounds.height) || DEFAULT_DIMENSIONS.height);
    return Object.freeze({
      width,
      height,
      padding: Object.freeze({
        left: width < 1000 ? 52 : 64,
        right: width < 1000 ? 26 : 36,
        top: height < 360 ? 18 : 30,
        bottom: height < 360 ? 36 : 50,
      }),
    });
  }

  function appendLine(group, x1, y1, x2, y2, className) {
    group.append(svgElement("line", { x1, y1, x2, y2, class: className }));
  }

  function renderGrid(svg, model) {
    const { dimensions, mapper, viewport } = model;
    const left = dimensions.padding.left;
    const right = dimensions.width - dimensions.padding.right;
    const top = dimensions.padding.top;
    const bottom = dimensions.height - dimensions.padding.bottom;
    const gridGroup = svgElement("g", { class: "graph-grid" });

    for (const value of model.xTicks) {
      const x = mapper.xToPixel(value);
      appendLine(gridGroup, x, top, x, bottom, "grid-line");
      if (value !== 0) {
        gridGroup.append(svgElement("text", {
          x,
          y: clamp(mapper.yToPixel(0) + 22, top + 18, bottom + 24),
          class: "tick-label",
          "text-anchor": "middle",
        }, engine.formatNumber(value)));
      }
    }
    for (const value of model.yTicks) {
      const y = mapper.yToPixel(value);
      appendLine(gridGroup, left, y, right, y, "grid-line");
      if (value !== 0) {
        gridGroup.append(svgElement("text", {
          x: clamp(mapper.xToPixel(0) - 10, left - 28, right - 8),
          y: y + 5,
          class: "tick-label",
          "text-anchor": "end",
        }, engine.formatNumber(value)));
      }
    }
    svg.append(gridGroup);

    const axisGroup = svgElement("g", { class: "graph-axes" });
    if (viewport.yMin <= 0 && viewport.yMax >= 0) {
      const y = mapper.yToPixel(0);
      appendLine(axisGroup, left, y, right, y, "axis-line");
      axisGroup.append(svgElement("text", { x: right - 3, y: y - 10, class: "axis-label", "text-anchor": "end" }, "x"));
    }
    if (viewport.xMin <= 0 && viewport.xMax >= 0) {
      const x = mapper.xToPixel(0);
      appendLine(axisGroup, x, top, x, bottom, "axis-line");
      axisGroup.append(svgElement("text", { x: x + 10, y: top + 16, class: "axis-label" }, "y"));
    }
    svg.append(axisGroup);
  }

  function indicatorPolygon(indicator) {
    const { x, y, direction } = indicator;
    const points = {
      left: `${x},${y} ${x + 14},${y - 8} ${x + 14},${y + 8}`,
      right: `${x},${y} ${x - 14},${y - 8} ${x - 14},${y + 8}`,
      up: `${x},${y} ${x - 8},${y + 14} ${x + 8},${y + 14}`,
      down: `${x},${y} ${x - 8},${y - 14} ${x + 8},${y - 14}`,
    };
    return points[direction];
  }

  function render(svg, appState) {
    if (!svg || !appState || !appState.math) {
      throw new TypeError("GraphView.render 需要 SVG 元素和完整应用状态");
    }
    const dimensions = dimensionsForSvg(svg);
    const model = buildGraphModel(appState.math, appState.viewport, dimensions);
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    const defs = svgElement("defs");
    const clipPath = svgElement("clipPath", { id: "plot-clip" });
    clipPath.append(svgElement("rect", {
      x: dimensions.padding.left,
      y: dimensions.padding.top,
      width: model.mapper.plotWidth,
      height: model.mapper.plotHeight,
    }));
    defs.append(clipPath);
    svg.append(defs);
    renderGrid(svg, model);

    const curveGroup = svgElement("g", { "clip-path": "url(#plot-clip)" });
    curveGroup.append(svgElement("path", { d: model.pathData, class: "parabola-path" }));
    if (appState.visibility.vertex) {
      const axisX = appState.math.axisX;
      if (axisX >= appState.viewport.xMin && axisX <= appState.viewport.xMax) {
        appendLine(
          curveGroup,
          model.mapper.xToPixel(axisX),
          dimensions.padding.top,
          model.mapper.xToPixel(axisX),
          dimensions.height - dimensions.padding.bottom,
          "symmetry-line",
        );
      }
    }
    svg.append(curveGroup);

    if (appState.visibility.roots) {
      const labelGap = model.rootPoints.length === 2
        && model.rootPoints[1].x - model.rootPoints[0].x < 150 ? 30 : 0;
      model.rootPoints.forEach((point, index) => {
        const labelY = point.y < 75
          ? point.y + 48 + (index * labelGap)
          : point.y - 15 - (index * labelGap);
        svg.append(svgElement("circle", { cx: point.x, cy: point.y, r: 7, class: "root-point" }));
        svg.append(svgElement("text", {
          x: point.x,
          y: labelY,
          class: "point-label root-label",
          "text-anchor": "middle",
        }, point.label));
      });
    }

    if (appState.visibility.vertex && model.vertexPoint) {
      const point = model.vertexPoint;
      svg.append(svgElement("circle", { cx: point.x, cy: point.y, r: 6, class: "vertex-point" }));
      svg.append(svgElement("text", {
        x: point.x + 12,
        y: point.y + 23,
        class: "point-label vertex-label",
      }, appState.math.vertexLabel));
    }

    for (const indicator of model.edgeIndicators) {
      if ((indicator.kind === "root" && !appState.visibility.roots)
        || (indicator.kind === "vertex" && !appState.visibility.vertex)) {
        continue;
      }
      svg.append(svgElement("polygon", {
        points: indicatorPolygon(indicator),
        class: `edge-indicator ${indicator.kind}-indicator`,
      }));
    }

    return model;
  }

  return Object.freeze({
    DEFAULT_DIMENSIONS,
    createMapper,
    sampleParabola,
    computeAutoViewport,
    buildGraphModel,
    render,
  });
}));
