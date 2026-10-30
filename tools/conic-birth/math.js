(function (root) {
  'use strict';
  const radians = degrees => degrees * Math.PI / 180;
  function derive(theta, alpha, d) {
    if (![theta, alpha, d].every(Number.isFinite) || theta < 0 || theta > 90 || alpha < 10 || alpha > 45 || d > -0.2 || d < -2.2) {
      throw new RangeError('角度或顶点距超出实验范围');
    }
    const t = radians(theta), a = radians(alpha), k = Math.tan(a);
    const sin = Math.sin(t), cos = Math.cos(t), beta = 90 - alpha;
    const e = sin / Math.cos(a), A = 1 - e * e;
    const B = d * (1 + k * k) * sin * cos;
    const type = theta === 0 ? 'circle' : Math.abs(theta - beta) < 1e-9 ? 'parabola' : theta < beta ? 'ellipse' : 'hyperbola';
    const g = { theta, alpha, beta, d, k, sin, cos, e, A, B, type };
    if (type === 'parabola') {
      g.center = d * d * (sin * sin - k * k * cos * cos) / (2 * B);
      g.p = Math.abs(B) / 2;
      g.direction = Math.sign(B);
    } else {
      g.center = B / A;
      g.a = Math.abs(k * d / A);
      g.b = Math.abs(k * d) / Math.sqrt(Math.abs(A));
      g.c = g.e * g.a;
    }
    g.spheres = [cos + Math.sin(a), cos - Math.sin(a)]
      .filter(den => Math.abs(den) > 1e-10)
      .map(den => {
        const z = d / den, radius = Math.abs(z) * Math.sin(a);
        const delta = z * cos - d;
        return { z, radius, focus: [delta * sin, 0, z - delta * cos], u: z * sin, contactZ: z * Math.cos(a) ** 2 };
      });
    g.foci = type === 'parabola' ? [g.p] : type === 'circle' ? [0] : [-g.c, g.c];
    return g;
  }
  function toWorld(g, x, y) {
    const u = g.center + (g.type === 'parabola' ? g.direction * x : x);
    return [-g.d * g.sin + u * g.cos, y, g.d * g.cos + u * g.sin];
  }
  function toPlot(g, point) {
    const u = point[0] * g.cos + point[2] * g.sin;
    return [(u - g.center) * (g.type === 'parabola' ? g.direction : 1), point[1]];
  }
  function point(g, phase, branch = 1) {
    if (g.type === 'parabola') {
      const y = (phase * 2 - 1) * 5 * g.p;
      return [y * y / (4 * g.p), y];
    }
    if (g.type === 'hyperbola') {
      const t = (phase * 2 - 1) * 1.5;
      return [branch * g.a * Math.cosh(t), g.b * Math.sinh(t)];
    }
    const t = phase * 2 * Math.PI;
    return [g.a * Math.cos(t), g.b * Math.sin(t)];
  }
  function measurement(g, p) {
    const lengths = g.foci.map(f => Math.hypot(p[0] - f, p[1]));
    if (g.type === 'circle') return { lengths, value: lengths[0], target: g.a };
    if (g.type === 'ellipse') return { lengths, value: lengths[0] + lengths[1], target: 2 * g.a };
    if (g.type === 'hyperbola') return { lengths, value: Math.abs(lengths[0] - lengths[1]), target: 2 * g.a };
    const directrix = Math.abs(p[0] + g.p);
    return { lengths, directrix, value: lengths[0] / directrix, target: 1 };
  }
  // Sample the cone's generators: unbounded branches stop only at the displayed cone's rim.
  function section(g, height, samples = 960) {
    const paths = []; let path = [], lastZ = null;
    for (let i = 0; i <= samples; i++) {
      const phi = i / samples * 2 * Math.PI;
      const den = g.cos - g.k * g.sin * Math.cos(phi), z = g.d / den;
      if (!Number.isFinite(z) || Math.abs(z) > height || (lastZ !== null && z * lastZ < 0)) {
        if (path.length > 1) paths.push(path); path = []; lastZ = null;
        if (!Number.isFinite(z) || Math.abs(z) > height) continue;
      }
      path.push([g.k * z * Math.cos(phi), g.k * z * Math.sin(phi), z]); lastZ = z;
    }
    if (path.length > 1) paths.push(path);
    return paths;
  }
  const api = { derive, toWorld, toPlot, point, measurement, section };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ConicMath = api;
})(globalThis);
