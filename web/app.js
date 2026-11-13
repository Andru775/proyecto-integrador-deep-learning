/* Página del proyecto: llena cifras desde assets/data.js (generado a partir de resultados_fase3.json)
   y dibuja los gráficos y el especímen interactivo. Sin dependencias externas. */
(function () {
  "use strict";
  const D = window.DATA;
  const C = window.CONFIG || {};
  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const col = { musgo: "#2f6b4f", salvia: "#b9cbb0", helecho: "#5e9f45", ocre: "#b5741c", bosque: "#143a2c", gris: "#56655b", liquen: "#dce6d2" };

  // ---------- formato numérico en español ----------
  const fmt = (v, d = 2) => (v === null || v === undefined || isNaN(v)) ? "–" : (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : Number(v)).toFixed(d).replace(".", ",").replace("-", "−");
  const pct = (v) => Math.round(v * 100) + " %";

  // ---------- enlaces al repositorio ----------
  document.querySelectorAll("[data-repo]").forEach((a) => { if (C.repo) { a.href = C.repo; a.target = "_blank"; a.rel = "noopener"; } });

  // ---------- cifras enlazadas en el texto ----------
  function resolve(path) {
    if (path === "errores.total") return D.errores.fp + D.errores.fn;
    if (path.startsWith("saliencia.cat_")) { const c = D.saliencia.cat.find((x) => x.c === path.slice(14)); return c ? c.razon : null; }
    if (path.startsWith("pert.")) {
      const [, v, k] = path.split(".");
      const p = D.perturbaciones.find((x) => x.variante === v); return p ? p[k] : null;
    }
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), D);
  }
  document.querySelectorAll("[data-k]").forEach((el) => {
    const v = resolve(el.dataset.k);
    if (el.hasAttribute("data-pct")) el.textContent = pct(v);
    else if (el.dataset.d) el.textContent = fmt(v, +el.dataset.d);
    else el.textContent = (typeof v === "number" && Math.abs(v) >= 1000) ? v.toLocaleString("es-CO") : v;
  });

  // ---------- utilidades SVG ----------
  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs = {}) { const t = el("text", Object.assign({ x, y, "font-size": 13 }, attrs), parent); t.textContent = s; return t; }

  // ---------- especímen interactivo (casos de respuesta conocida) ----------
  const NOMBRES = ["La capital de Colombia", "La moneda oficial", "Cómo se elige al presidente", "Lavarse las manos",
                   "Quién organiza las elecciones", "Las vacunas aprobadas por el INVIMA", "Quién fija la tasa de interés", "Cuántos departamentos hay"];
  const sel = document.getElementById("par");
  const pares = [...new Set(D.casos.map((c) => c.par))];
  pares.forEach((p) => { const o = document.createElement("option"); o.value = p; o.textContent = NOMBRES[p - 1] || ("Par " + p); sel.appendChild(o); });
  const estado = { par: pares[0], y: 1, tono: "sobria" };

  const svg = document.getElementById("tallo");
  const H = 180, BASE = 205, X = 60;
  el("line", { x1: 8, x2: 112, y1: BASE, y2: BASE, stroke: col.bosque, "stroke-width": 2, "stroke-linecap": "round" }, svg);
  for (let i = 0; i <= 4; i++) {
    const y = BASE - (H * i) / 4;
    el("line", { x1: 104, x2: 110, y1: y, y2: y, stroke: col.salvia, "stroke-width": 1.5 }, svg);
    txt(svg, 114, y + 4, ["0", "0,25", "0,5", "0,75", "1"][i], { "font-size": 10, fill: col.gris });
  }
  const yU = BASE - H * D.umbral;
  el("line", { x1: 8, x2: 104, y1: yU, y2: yU, stroke: col.ocre, "stroke-width": 1.2, "stroke-dasharray": "4 4" }, svg);
  txt(svg, 8, yU - 5, "umbral", { "font-size": 10, fill: col.ocre });
  const tallo = el("path", { fill: "none", stroke: col.musgo, "stroke-width": 4, "stroke-linecap": "round" }, svg);
  const hoja = el("path", { fill: col.helecho }, svg);
  let hActual = 0;

  function dibujarTallo(h) {
    const top = BASE - h;
    tallo.setAttribute("d", `M${X} ${BASE} C ${X - 8} ${BASE - h * 0.35}, ${X + 8} ${BASE - h * 0.7}, ${X} ${top}`);
    hoja.setAttribute("d", `M${X} ${top} c 6 -14 22 -18 30 -16 c -4 10 -14 20 -30 16 z M${X} ${top} c -6 -12 -20 -14 -26 -12 c 4 8 12 15 26 12 z`);
  }
  function animar(hDestino) {
    if (reduce) { hActual = hDestino; dibujarTallo(hActual); return; }
    const h0 = hActual, t0 = performance.now(), dur = 650;
    function paso(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      hActual = h0 + (hDestino - h0) * e; dibujarTallo(hActual);
      if (k < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  function actualizar() {
    const tipo = (estado.y ? "verdadera" : "falsa") + " · " + estado.tono;
    const c = D.casos.find((x) => x.par === +estado.par && x.tipo === tipo);
    const q = document.getElementById("texto-caso");
    q.textContent = c.texto; q.classList.toggle("sensacionalista", estado.tono !== "sobria");
    document.getElementById("p-num").textContent = fmt(c.p, 2);
    const pred = c.p >= D.umbral ? 1 : 0;
    const v = document.getElementById("veredicto");
    v.innerHTML = `El modelo dice <b>${pred ? "verdadera" : "falsa"}</b>. ` +
      (pred === c.y ? '<span class="ok">Acierta.</span>' : '<span class="mal">Se equivoca.</span>');
    animar(Math.max(4, H * c.p));
  }
  function segmentado(id, clave) {
    document.querySelectorAll(`#${id} button`).forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll(`#${id} button`).forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      estado[clave] = clave === "y" ? +b.dataset.v : b.dataset.v; actualizar();
    }));
  }
  segmentado("f-hecho", "y"); segmentado("f-tono", "tono");
  sel.addEventListener("change", () => { estado.par = +sel.value; actualizar(); });
  dibujarTallo(0); actualizar();

  // hallazgo resumido bajo el especímen
  (function () {
    const g = (p, t) => D.casos.find((x) => x.par === p && x.tipo === t).p;
    let tono = 0, hecho = 0;
    pares.forEach((p) => {
      tono += (Math.abs(g(p, "verdadera · sobria") - g(p, "verdadera · sensacionalista")) + Math.abs(g(p, "falsa · sobria") - g(p, "falsa · sensacionalista"))) / 2;
      hecho += Math.abs(g(p, "verdadera · sobria") - g(p, "falsa · sobria"));
    });
    tono /= pares.length; hecho /= pares.length;
    document.getElementById("hero-hallazgo").textContent =
      `En promedio, cambiar el tono mueve la probabilidad ${fmt(tono, 2)}; cambiar el hecho la mueve ${fmt(hecho, 2)}. ` +
      `Son las probabilidades reales del modelo final sobre ${D.casos.length} afirmaciones redactadas para la auditoría.`;
  })();

  // ---------- gráfico de barras horizontales genérico ----------
  function barras(cont, filas, opt) {
    cont.innerHTML = "";
    // el ancho del viewBox sigue al contenedor para que el texto conserve su tamaño en pantallas pequeñas
    const W = Math.max(320, Math.min(620, cont.clientWidth || 560));
    const k = W < 480 ? 0.8 : 1;
    const izq = opt.izq || 150, der = Math.round((opt.der || 70) * k), alto = opt.alto || 26, sep = opt.sep || 10;
    const fEtq = W < 480 ? 12 : 13.5;
    const grupos = filas.length, porGrupo = filas[0].vals.length;
    const top = opt.leyenda ? 34 : 8;
    const Ht = top + grupos * (porGrupo * alto + sep + 8) + 22;
    const s = el("svg", { viewBox: `0 0 ${W} ${Ht}`, role: "img", "aria-label": opt.aria }, cont);
    const [lo, hi] = opt.dominio;
    const x = (v) => izq + ((v - lo) / (hi - lo)) * (W - izq - der);
    if (opt.leyenda) {
      let lx = izq;
      opt.leyenda.forEach(([nombre, c]) => {
        el("rect", { x: lx, y: 6, width: 12, height: 12, rx: 3, fill: c }, s);
        const t = txt(s, lx + 18, 16, nombre, { "font-size": 12.5, fill: col.gris });
        lx += 30 + nombre.length * 7;
      });
    }
    const ref = opt.referencia;
    let y = top;
    filas.forEach((f) => {
      txt(s, 0, y + (porGrupo * alto) / 2 + 4, f.nombre, { "font-size": fEtq, fill: col.bosque, "font-weight": 600 });
      f.vals.forEach((v, j) => {
        const x0 = x(Math.max(lo, Math.min(0, v.v))), x1 = x(v.v);
        el("rect", { x: Math.min(x0, x1), y: y + j * alto + 3, width: Math.max(2, Math.abs(x1 - x0)), height: alto - 8, rx: 4, fill: v.c }, s);
        txt(s, Math.max(x0, x1) + 6, y + j * alto + alto / 2 + 3, v.etq, { "font-size": 12.5, fill: col.tinta });
      });
      y += porGrupo * alto + sep + 8;
    });
    if (ref !== undefined) {
      el("line", { x1: x(ref.v), x2: x(ref.v), y1: top - 4, y2: y - 6, stroke: col.gris, "stroke-dasharray": "3 4", "stroke-width": 1 }, s);
      txt(s, x(ref.v) + 4, y + 8, ref.etq, { "font-size": 11.5, fill: col.gris });
    }
  }

  // ---------- resultados: métricas por conjunto ----------
  const NOM_SET = { desarrollo_oof_107: "validación cruzada (107 casos)", prueba_27: "prueba (27 casos)", agregado_134: "las 134 predicciones fuera de muestra" };
  function pintarSet(k) {
    const r = D.comparacion[k];
    const filas = [["AUC", "auc"], ["MCC", "mcc"], ["F1", "f1"]].map(([n, m]) => ({
      nombre: n, vals: [{ v: r.T[m], c: col.musgo, etq: fmt(r.T[m]) }, { v: r.B[m], c: col.salvia, etq: fmt(r.B[m]) }],
    }));
    barras(document.getElementById("graf-metricas"), filas, {
      dominio: [-0.2, 1], izq: 56, leyenda: [["RoBERTa-BNE + cabeza", col.musgo], ["Línea base TF-IDF", col.salvia]],
      referencia: { v: 0, etq: "0" }, aria: `AUC, MCC y F1 del Transformer y de la línea base en ${NOM_SET[k]}`,
    });
    let s = `En ${NOM_SET[k]}, el Transformer obtiene AUC ${fmt(r.T.auc)} y MCC ${fmt(r.T.mcc)}; la línea base, AUC ${fmt(r.B.auc)} y MCC ${fmt(r.B.mcc)}. ` +
            `La diferencia de AUC es ${fmt(r.dAUCm, 3)}, con intervalo de 95 % entre ${fmt(r.dAUC[0], 3)} y ${fmt(r.dAUC[1], 3)}.`;
    if (k === "prueba_27") s += ` Como referencia, decir siempre «verdadera» da F1 ${fmt(D.trivial.f1)} y MCC 0.`;
    document.getElementById("lectura-set").textContent = s;
  }
  function pestanas(selector, attr, fn) {
    const bs = document.querySelectorAll(selector);
    bs.forEach((b) => b.addEventListener("click", () => { bs.forEach((o) => o.setAttribute("aria-selected", String(o === b))); fn(b.dataset[attr]); }));
    const act = [...bs].find((b) => b.getAttribute("aria-selected") === "true"); fn(act.dataset[attr]);
  }
  pestanas("#resultados .pestanas button", "set", pintarSet);

  // ---------- perturbaciones ----------
  const pintarPerturb = () => barras(document.getElementById("graf-perturb"),
    D.perturbaciones.filter((p) => p.variante !== "original").map((p) => ({
      nombre: p.variante.replace(" (min. y sin signos)", ""), vals: [{ v: p.cambia_pred, c: col.musgo, etq: `${pct(p.cambia_pred)} · MCC ${fmt(p.mcc)}` }],
    })),
    { dominio: [0, 0.4], izq: 160, der: 120, alto: 30, sep: 2, aria: "Porcentaje de predicciones que cambian con cada perturbación del texto" });
  pintarPerturb();

  // ---------- saliencia por categoría de token ----------
  const ORDEN = ["MAYÚSCULAS", "arroba/hashtag", "exclamación", "número", "palabra", "puntuación"];
  const pintarSaliencia = () => barras(document.getElementById("graf-saliencia"),
    ORDEN.map((c) => D.saliencia.cat.find((x) => x.c === c)).filter(Boolean).map((c) => ({
      nombre: c.c, vals: [{ v: c.razon, c: c.razon > 1.05 ? col.ocre : col.salvia, etq: "× " + fmt(c.razon) }],
    })),
    { dominio: [0, 2.4], izq: 120, der: 60, alto: 28, sep: 2, referencia: { v: 1, etq: "proporcional a su frecuencia" },
      aria: "Saliencia recibida por cada tipo de token relativa a su frecuencia" });
  pintarSaliencia();

  // ---------- visor de saliencia (textos de prueba) ----------
  const selE = document.getElementById("ejemplo");
  D.ejemplos.forEach((e, i) => {
    const o = document.createElement("option"); o.value = i;
    o.textContent = `${e.nombre} · p = ${fmt(e.p)}`; selE.appendChild(o);
  });
  function pintarEjemplo(i) {
    const e = D.ejemplos[i], cont = document.getElementById("fichas");
    cont.innerHTML = "";
    e.tokens.forEach((t, k) => {
      const v = e.s[k], a = Math.min(0.85, Math.pow(Math.abs(v), 0.7) * 0.85);
      const sp = document.createElement("span");
      sp.textContent = t;
      sp.style.background = v > 0 ? `rgba(94,159,69,${a})` : `rgba(181,116,28,${a})`;
      sp.title = (v > 0 ? "hacia verdadera " : "hacia falsa ") + fmt(Math.abs(v));
      cont.appendChild(sp);
    });
    document.getElementById("visor-meta").textContent =
      `Realidad: ${e.y ? "verdadera" : "falsa"}. Probabilidad de «verdadera» según el modelo: ${fmt(e.p)}. Fuente: ${e.fuente.toLowerCase()}, publicado en ${e.medio}.`;
  }
  selE.addEventListener("change", () => pintarEjemplo(+selE.value));
  pintarEjemplo(0);

  // ---------- fuera de dominio ----------
  const ul = document.getElementById("lista-ood");
  D.ood.forEach((o) => { const li = document.createElement("li"); li.innerHTML = `<span></span><b>${fmt(o.p, 2)}</b>`; li.firstChild.textContent = o.texto; ul.appendChild(li); });

  // ---------- fallas ----------
  const NOM_LARGO = { corto: "Cortos", medio: "Medianos", largo: "Largos" };
  function pintarFallas(g) {
    let filas = D.fallas[g].filter((f) => f.n >= 5);
    if (g !== "largo") filas = filas.sort((a, b) => b.error - a.error);
    barras(document.getElementById("graf-fallas"),
      filas.map((f) => ({ nombre: (NOM_LARGO[f.grupo] || f.grupo), vals: [{ v: f.error, c: f.error >= 0.5 ? col.ocre : col.musgo, etq: `${pct(f.error)} · n = ${f.n}` }] })),
      { dominio: [0, 1], izq: 170, der: 110, alto: 30, sep: 2, aria: "Tasa de error por grupo" });
  }
  pestanas("#fallas .pestanas button", "g", pintarFallas);

  // redibujar los gráficos si cambia el ancho de la ventana
  let ultimoAncho = window.innerWidth, espera;
  window.addEventListener("resize", () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      if (Math.abs(window.innerWidth - ultimoAncho) < 40) return;
      ultimoAncho = window.innerWidth;
      const activo = (sel) => document.querySelector(sel + ' [aria-selected="true"]');
      pintarSet(activo("#resultados .pestanas").dataset.set);
      pintarFallas(activo("#fallas .pestanas").dataset.g);
      pintarPerturb(); pintarSaliencia();
    }, 200);
  });
})();
