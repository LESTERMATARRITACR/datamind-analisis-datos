/**
 * Generador de reportes exportables para DataMind (Requisito 7 — Salida de resultados).
 *
 * Construye un archivo HTML autocontenido (sin dependencias externas, sin
 * llamadas al backend) con el resumen del análisis, las estadísticas,
 * correlaciones, outliers, clustering, insights de IA y las visualizaciones
 * (histogramas, boxplots, dispersión, mapa de calor y distribuciones),
 * dibujadas como SVG generado a partir de los mismos datos que ya devuelve
 * el backend en /api/analizar.
 *
 * El archivo resultante se puede abrir en cualquier navegador y, desde ahí,
 * imprimir o "Guardar como PDF" si se necesita ese formato.
 */

// ----------------------------
// Utilidades
// ----------------------------

const escapeHtml = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

const numero = (valor, decimales = 2) => {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "-";
  return Number(valor).toLocaleString("es-CR", { maximumFractionDigits: decimales });
};

const escala = (valor, min, max, destinoMin, destinoMax) => {
  if (max === min) return (destinoMin + destinoMax) / 2;
  return destinoMin + ((valor - min) / (max - min)) * (destinoMax - destinoMin);
};

// ----------------------------
// Gráficos SVG
// ----------------------------

function svgHistograma(columna, datos, ancho = 520, alto = 170) {
  const bins = datos?.bins || [];
  const counts = datos?.counts || [];

  if (!counts.length) return `<p class="info-text">Sin datos suficientes para "${escapeHtml(columna)}".</p>`;

  const maxCount = Math.max(...counts, 1);
  const padding = 30;
  const anchoBarra = (ancho - padding * 2) / counts.length;

  const barras = counts.map((c, i) => {
    const alturaBarra = (c / maxCount) * (alto - padding * 2);
    const x = padding + i * anchoBarra;
    const y = alto - padding - alturaBarra;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(anchoBarra - 2).toFixed(1)}" height="${alturaBarra.toFixed(1)}" fill="#7c3aed" rx="2"/>`;
  }).join("");

  return `<svg viewBox="0 0 ${ancho} ${alto}" class="chart-svg">
    <line x1="${padding}" y1="${alto - padding}" x2="${ancho - padding}" y2="${alto - padding}" stroke="#334155"/>
    ${barras}
    <text x="${padding}" y="14" class="chart-label">${escapeHtml(columna)}</text>
    <text x="${padding}" y="${alto - 10}" class="chart-tick">${numero(bins[0])}</text>
    <text x="${ancho - padding}" y="${alto - 10}" class="chart-tick" text-anchor="end">${numero(bins[bins.length - 1])}</text>
  </svg>`;
}

function svgBoxplot(box, ancho = 520, alto = 110) {
  const { min, q1, median, q3, max, outliers = [] } = box;
  if ([min, q1, median, q3, max].some((v) => v === null || v === undefined)) {
    return `<p class="info-text">Sin datos suficientes para "${escapeHtml(box.column)}".</p>`;
  }

  const padding = 30;
  const y = alto / 2;
  const alturaCaja = 26;

  const x = (v) => escala(v, min, max, padding, ancho - padding);
  const outlierPuntos = outliers.slice(0, 40).map((v) =>
    `<circle cx="${x(v).toFixed(1)}" cy="${y}" r="3" fill="#f87171" opacity="0.85"/>`
  ).join("");

  return `<svg viewBox="0 0 ${ancho} ${alto}" class="chart-svg">
    <text x="${padding}" y="16" class="chart-label">${escapeHtml(box.column)}</text>
    <line x1="${x(min).toFixed(1)}" y1="${y}" x2="${x(q1).toFixed(1)}" y2="${y}" stroke="#94a3b8"/>
    <line x1="${x(q3).toFixed(1)}" y1="${y}" x2="${x(max).toFixed(1)}" y2="${y}" stroke="#94a3b8"/>
    <rect x="${x(q1).toFixed(1)}" y="${(y - alturaCaja / 2).toFixed(1)}" width="${(x(q3) - x(q1)).toFixed(1)}" height="${alturaCaja}" fill="#7c3aed44" stroke="#a855f7"/>
    <line x1="${x(median).toFixed(1)}" y1="${(y - alturaCaja / 2).toFixed(1)}" x2="${x(median).toFixed(1)}" y2="${(y + alturaCaja / 2).toFixed(1)}" stroke="#34d399" stroke-width="2"/>
    <line x1="${x(min).toFixed(1)}" y1="${(y - 8).toFixed(1)}" x2="${x(min).toFixed(1)}" y2="${(y + 8).toFixed(1)}" stroke="#94a3b8"/>
    <line x1="${x(max).toFixed(1)}" y1="${(y - 8).toFixed(1)}" x2="${x(max).toFixed(1)}" y2="${(y + 8).toFixed(1)}" stroke="#94a3b8"/>
    ${outlierPuntos}
  </svg>`;
}

function svgScatter(par, ancho = 520, alto = 260) {
  const puntos = (par.points || []).filter((p) => p.x !== null && p.y !== null);
  if (!puntos.length) return `<p class="info-text">Sin datos suficientes para "${escapeHtml(par.x)} vs ${escapeHtml(par.y)}".</p>`;

  const padding = 36;
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const px = (v) => escala(v, minX, maxX, padding, ancho - padding);
  const py = (v) => escala(v, minY, maxY, alto - padding, padding);

  const puntosSvg = puntos.slice(0, 500).map((p) =>
    `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="3" fill="#38bdf8" opacity="0.75"/>`
  ).join("");

  return `<svg viewBox="0 0 ${ancho} ${alto}" class="chart-svg">
    <line x1="${padding}" y1="${alto - padding}" x2="${ancho - padding}" y2="${alto - padding}" stroke="#334155"/>
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${alto - padding}" stroke="#334155"/>
    ${puntosSvg}
    <text x="${padding}" y="18" class="chart-label">${escapeHtml(par.x)} vs ${escapeHtml(par.y)}</text>
  </svg>`;
}

function svgDistribucion(columna, valores, ancho = 520, alto = 170) {
  if (!valores || !valores.length) return `<p class="info-text">Sin datos suficientes para "${escapeHtml(columna)}".</p>`;

  const padding = 30;
  const min = valores[0];
  const max = valores[valores.length - 1];

  const puntos = valores.map((v, i) => {
    const x = escala(i, 0, valores.length - 1, padding, ancho - padding);
    const y = escala(v, min, max, alto - padding, padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return `<svg viewBox="0 0 ${ancho} ${alto}" class="chart-svg">
    <text x="${padding}" y="14" class="chart-label">${escapeHtml(columna)}</text>
    <polyline points="${puntos}" fill="none" stroke="#fbbf24" stroke-width="2"/>
    <line x1="${padding}" y1="${alto - padding}" x2="${ancho - padding}" y2="${alto - padding}" stroke="#334155"/>
  </svg>`;
}

function tablaHeatmap(heatmap) {
  const labels = heatmap?.labels || [];
  const matriz = heatmap?.matrix || [];
  if (!labels.length) return `<p class="info-text">Se requieren al menos 2 variables numéricas.</p>`;

  const colorPara = (v) => {
    if (v === null || v === undefined) return "#1e293b";
    const intensidad = Math.min(Math.abs(v), 1);
    return v >= 0
      ? `rgba(52, 211, 153, ${0.15 + intensidad * 0.6})`
      : `rgba(248, 113, 113, ${0.15 + intensidad * 0.6})`;
  };

  const filas = labels.map((fila, i) => `
    <tr>
      <td class="col-name">${escapeHtml(fila)}</td>
      ${labels.map((_, j) => {
        const v = matriz[i]?.[j];
        return `<td style="background:${colorPara(v)}">${v !== null && v !== undefined ? Number(v).toFixed(2) : "-"}</td>`;
      }).join("")}
    </tr>
  `).join("");

  return `<div class="table-responsive"><table class="custom-table">
    <thead><tr><th>Variable</th>${labels.map((l) => `<th>${escapeHtml(l)}</th>`).join("")}</tr></thead>
    <tbody>${filas}</tbody>
  </table></div>`;
}

// ----------------------------
// Secciones por archivo
// ----------------------------

function seccionArchivo(payload, indice) {
  const nombreArchivo = payload.archivo || `Archivo ${indice + 1}`;
  const resumen = payload.resumen || {};
  const limpieza = payload.limpieza || {};
  const estadisticas = payload.estadisticas || {};
  const outliers = payload.outliers || {};
  const clustering = payload.clustering || {};
  const visualizations = payload.visualizations || {};
  const columnas = Object.keys(estadisticas);

  const interpretacionIA = payload.interpretacion_ia || payload.resumen_ia || "";
  const insightsIA = payload.insights_ia || [];
  const hallazgoPrioritarioIA = payload.hallazgo_prioritario_ia || "";
  const fuenteIA = payload.fuente_ia;

  const filasStats = columnas.map((col) => `
    <tr>
      <td class="col-name">${escapeHtml(col.toUpperCase())}</td>
      <td>${numero(estadisticas[col]?.count, 0)}</td>
      <td>${numero(estadisticas[col]?.mean)}</td>
      <td>${numero(estadisticas[col]?.min)}</td>
      <td>${numero(estadisticas[col]?.["50%"])}</td>
      <td>${numero(estadisticas[col]?.max)}</td>
      <td>${numero(estadisticas[col]?.std)}</td>
    </tr>
  `).join("");

  const histogramas = Object.entries(visualizations.histograms || {})
    .slice(0, 6)
    .map(([col, datos]) => `<div class="chart-box">${svgHistograma(col, datos)}</div>`)
    .join("");

  const boxplots = (visualizations.boxplots || [])
    .slice(0, 6)
    .map((box) => `<div class="chart-box">${svgBoxplot(box)}</div>`)
    .join("");

  const scatterplots = (visualizations.scatterplots || [])
    .map((par) => `<div class="chart-box">${svgScatter(par)}</div>`)
    .join("");

  const distribuciones = Object.entries(visualizations.distributions || {})
    .slice(0, 6)
    .map(([col, valores]) => `<div class="chart-box">${svgDistribucion(col, valores)}</div>`)
    .join("");

  return `
  <section class="report-file">
    <h2 class="file-title"><span class="file-title-icon">📄</span> ${escapeHtml(nombreArchivo)}</h2>

    <div class="card card-blue">
      <div class="card-head">
        <span class="card-icon">📊</span>
        <div>
          <span class="badge badge-blue">Resumen del análisis</span>
          <h3>Vista general del dataset</h3>
        </div>
      </div>
      <div class="metrics-grid">
        <div class="metric-box"><span class="metric-title">Filas procesadas</span><span class="metric-value">${numero(resumen.filas, 0)}</span></div>
        <div class="metric-box"><span class="metric-title">Columnas</span><span class="metric-value">${numero(resumen.columnas, 0)}</span></div>
        <div class="metric-box"><span class="metric-title">Variables numéricas</span><span class="metric-value">${numero(resumen.numericas, 0)}</span></div>
        <div class="metric-box"><span class="metric-title">Variables categóricas</span><span class="metric-value">${numero(resumen.categoricas, 0)}</span></div>
        <div class="metric-box"><span class="metric-title">Valores nulos atendidos</span><span class="metric-value text-green">${numero(limpieza.nulos, 0)}</span></div>
        <div class="metric-box"><span class="metric-title">Duplicados eliminados</span><span class="metric-value text-green">${numero(limpieza.duplicados, 0)}</span></div>
      </div>
      <p class="summary-text">${escapeHtml(payload.resumen_ia || "")}</p>
    </div>

    <div class="card card-purple">
      <div class="card-head">
        <span class="card-icon">🔍</span>
        <div>
          <span class="badge badge-purple">Análisis exploratorio</span>
          <h3>Estadística descriptiva</h3>
        </div>
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead><tr><th>Variable</th><th>N</th><th>Promedio</th><th>Mínimo</th><th>Mediana</th><th>Máximo</th><th>Desv. Est.</th></tr></thead>
          <tbody>${filasStats || `<tr><td colspan="7" class="empty-table">Sin variables numéricas.</td></tr>`}</tbody>
        </table>
      </div>
    </div>

    <div class="card card-cyan">
      <div class="card-head">
        <span class="card-icon">🧩</span>
        <div>
          <span class="badge badge-cyan">Relaciones entre variables</span>
          <h3>Mapa de calor de correlación</h3>
        </div>
      </div>
      ${tablaHeatmap(visualizations.heatmap)}
    </div>

    <div class="card card-amber">
      <div class="card-head">
        <span class="card-icon">⚠️</span>
        <div>
          <span class="badge badge-amber">Detección de anomalías</span>
          <h3>Valores atípicos (IQR)</h3>
        </div>
      </div>
      <div class="metrics-grid">
        ${Object.keys(outliers).length
          ? Object.keys(outliers).map((col) => `
            <div class="metric-box">
              <span class="metric-title">${escapeHtml(col.toUpperCase())}</span>
              <span class="metric-value ${outliers[col] > 0 ? "text-red" : "text-green"}">${outliers[col]}</span>
            </div>`).join("")
          : `<p class="info-text">No se encontraron desviaciones.</p>`}
      </div>
    </div>

    <div class="card card-emerald">
      <div class="card-head">
        <span class="card-icon">🧠</span>
        <div>
          <span class="badge badge-emerald">Modelado inteligente</span>
          <h3>Clustering (K-Means) e interpretación de IA</h3>
        </div>
      </div>
      <div class="metrics-grid" style="margin-bottom:16px">
        <div class="metric-box"><span class="metric-title">Modelo</span><span class="metric-value-text">${escapeHtml(clustering.algoritmo || "K-Means")}</span></div>
        <div class="metric-box"><span class="metric-title">Clústeres</span><span class="metric-value">${numero(clustering.n_clusters, 0)}</span></div>
      </div>
      <div class="ai-insight-box">
        <strong>🧠 Interpretación ${fuenteIA === "ollama" ? "(Ollama LLM)" : "(motor de reglas)"}:</strong>
        <p class="ai-text">${escapeHtml(interpretacionIA)}</p>
        ${insightsIA.length ? `<strong>✨ Insights automáticos:</strong><ul class="ai-text">${insightsIA.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : ""}
        ${hallazgoPrioritarioIA ? `<strong>🏆 Hallazgo prioritario:</strong><p class="ai-text">${escapeHtml(hallazgoPrioritarioIA)}</p>` : ""}
      </div>
    </div>

    <div class="card card-violet">
      <div class="card-head">
        <span class="card-icon">📈</span>
        <div>
          <span class="badge badge-violet">Visualizaciones</span>
          <h3>Histogramas</h3>
        </div>
      </div>
      <div class="charts-grid">${histogramas || `<p class="info-text">Sin datos.</p>`}</div>
    </div>

    <div class="card card-violet">
      <div class="card-head">
        <span class="card-icon">📦</span>
        <div>
          <span class="badge badge-violet">Visualizaciones</span>
          <h3>Diagramas de caja</h3>
        </div>
      </div>
      <div class="charts-grid">${boxplots || `<p class="info-text">Sin datos.</p>`}</div>
    </div>

    <div class="card card-violet">
      <div class="card-head">
        <span class="card-icon">✨</span>
        <div>
          <span class="badge badge-violet">Visualizaciones</span>
          <h3>Diagramas de dispersión</h3>
        </div>
      </div>
      <div class="charts-grid">${scatterplots || `<p class="info-text">Se requieren al menos 2 variables correlacionadas.</p>`}</div>
    </div>

    <div class="card card-violet">
      <div class="card-head">
        <span class="card-icon">📉</span>
        <div>
          <span class="badge badge-violet">Visualizaciones</span>
          <h3>Distribuciones</h3>
        </div>
      </div>
      <div class="charts-grid">${distribuciones || `<p class="info-text">Sin datos.</p>`}</div>
    </div>
  </section>`;
}

// ----------------------------
// Documento completo
// ----------------------------

function construirHtmlReporte(resultados) {
  const listado = Array.isArray(resultados) ? resultados : (resultados?.resultados || resultados?.data || [resultados]);
  const fecha = new Date().toLocaleString("es-CR");

  const secciones = listado.map((payload, i) => seccionArchivo(payload || {}, i)).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte DataMind</title>
<style>
  :root {
    --bg: #0f172a;
    --card: #1e293b;
    --border: #334155;
    --text: #f8fafc;
    --muted: #94a3b8;
    --accent: #7c3aed;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--text);
    font-family: "Segoe UI", -apple-system, Roboto, Arial, sans-serif;
    padding: 40px 20px;
    background:
      radial-gradient(circle at top left, rgba(79,70,229,.20), transparent 40%),
      radial-gradient(circle at bottom right, rgba(147,51,234,.20), transparent 40%),
      var(--bg);
  }
  .report-wrapper { max-width: 1000px; margin: 0 auto; }

  /* Portada */
  .report-header {
    text-align: center;
    padding: 44px 30px;
    margin-bottom: 44px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: linear-gradient(160deg, rgba(124,58,237,.18), rgba(56,189,248,.10));
    box-shadow: 0 20px 45px rgba(0,0,0,.35);
  }
  .report-header .report-logo { font-size: 2.6rem; margin-bottom: 6px; }
  .report-header h1 {
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -1px;
    margin: 0 0 10px;
    background: linear-gradient(135deg, #ffffff, #c4b5fd, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .report-header p { color: var(--muted); margin: 4px 0; font-size: 1.02rem; }
  .report-header .report-date {
    display: inline-block;
    margin-top: 14px;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 0.8rem;
    color: #c4b5fd;
    background: rgba(124,58,237,.15);
    border: 1px solid rgba(124,58,237,.35);
  }

  /* Título de archivo */
  .file-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.5rem;
    border-bottom: 2px solid var(--accent);
    padding-bottom: 12px;
    margin-top: 56px;
  }
  .file-title-icon { font-size: 1.3rem; }

  /* Tarjetas */
  .card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 26px;
    margin-bottom: 22px;
    box-shadow: 0 12px 24px rgba(0,0,0,.22);
    border-left: 4px solid var(--accent);
  }
  .card-blue    { border-left-color: #38bdf8; }
  .card-purple  { border-left-color: #a855f7; }
  .card-cyan    { border-left-color: #22d3ee; }
  .card-amber   { border-left-color: #fbbf24; }
  .card-emerald { border-left-color: #34d399; }
  .card-violet  { border-left-color: #818cf8; }

  .card-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .card-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    border-radius: 10px;
    background: rgba(255,255,255,.06);
  }
  .card h3 { margin: 4px 0 0; font-size: 1.15rem; color: var(--text); }

  .badge { display: inline-block; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 999px; letter-spacing: 0.6px; text-transform: uppercase; }
  .badge-blue    { background: rgba(56,189,248,.15); color: #38bdf8; }
  .badge-purple  { background: rgba(168,85,247,.15); color: #c084fc; }
  .badge-cyan    { background: rgba(6,182,212,.15); color: #22d3ee; }
  .badge-amber   { background: rgba(245,158,11,.15); color: #fbbf24; }
  .badge-emerald { background: rgba(16,185,129,.15); color: #34d399; }
  .badge-violet  { background: rgba(129,140,248,.15); color: #a5b4fc; }

  .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 4px; }
  .metric-box { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
  .metric-title { display: block; font-size: 0.78rem; color: var(--muted); margin-bottom: 4px; }
  .metric-value { font-size: 1.6rem; font-weight: 700; }
  .metric-value-text { font-size: 1.1rem; font-weight: 600; color: #38bdf8; }
  .text-green { color: #34d399; } .text-red { color: #f87171; }

  .summary-text { color: #cbd5e1; font-size: 0.95rem; line-height: 1.65; margin: 18px 0 0; padding-top: 16px; border-top: 1px solid var(--border); }

  .table-responsive { overflow-x: auto; }
  .custom-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 4px; }
  .custom-table th { background: var(--bg); color: var(--muted); padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
  .custom-table td { padding: 10px 14px; border-bottom: 1px solid #1e293b; }
  .custom-table tbody tr:nth-child(even) { background: rgba(255,255,255,.02); }
  .col-name { font-weight: 600; color: #c084fc; }

  .ai-insight-box { background: var(--bg); border-left: 4px solid #a855f7; border-radius: 10px; padding: 18px; margin-top: 4px; }
  .ai-text { color: #cbd5e1; font-size: 0.92rem; line-height: 1.65; }
  .info-text, .empty-table { color: var(--muted); font-size: 0.9rem; }

  .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .chart-box { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
  .chart-svg { width: 100%; height: auto; }
  .chart-label { fill: var(--muted); font-size: 11px; }
  .chart-tick { fill: var(--muted); font-size: 10px; }

  .report-footer { text-align: center; color: var(--muted); font-size: 0.8rem; margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--border); }

  @media print {
    body { background: white; color: black; }
    .report-header { background: #f1f5f9; box-shadow: none; }
    .card, .chart-box, .metric-box, .ai-insight-box { background: #f8fafc; border-color: #cbd5e1; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="report-wrapper">
    <div class="report-header">
      <div class="report-logo">🧠</div>
      <h1>DataMind — Reporte de Análisis</h1>
      <p>Plataforma automatizada de análisis de datos, clustering e IA generativa</p>
      <span class="report-date">Generado el ${escapeHtml(fecha)}</span>
    </div>
    ${secciones}
    <div class="report-footer">
      Reporte generado automáticamente por DataMind.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Genera el reporte y dispara la descarga en el navegador del usuario.
 * @param {Array|Object} resultados - Resultado(s) devueltos por /api/analizar
 */
export function descargarReporte(resultados) {
  const html = construirHtmlReporte(resultados);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  const fechaArchivo = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  enlace.href = url;
  enlace.download = `reporte-datamind-${fechaArchivo}.html`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  URL.revokeObjectURL(url);
}

/**
 * Genera el reporte en PDF a partir del mismo HTML que descargarReporte().
 * Renderiza el reporte oculto en un iframe y captura cada tarjeta (.card),
 * título de archivo y encabezado como bloques independientes con
 * html2canvas, para poder paginarlos con jsPDF sin cortar ninguna tarjeta
 * a la mitad entre dos páginas.
 *
 * @param {Array|Object} resultados - Resultado(s) devueltos por /api/analizar
 */
export async function descargarReportePDF(resultados) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const html = construirHtmlReporte(resultados);

  // Iframe oculto donde se renderiza el reporte completo con sus estilos.
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-10000px";
  iframe.style.left = "0";
  iframe.style.width = "900px";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve, reject) => {
      iframe.onload = resolve;
      iframe.onerror = reject;
      iframe.srcdoc = html;
    });

    // Pequeña espera para asegurar que los SVG terminaron de pintarse.
    await new Promise((r) => setTimeout(r, 150));

    const doc = iframe.contentDocument;
    const wrapper = doc.querySelector(".report-wrapper") || doc.body;

    // Cada bloque (encabezado, título de archivo o tarjeta) se captura por
    // separado, para poder decidir en cuál página entra sin partirlo.
    const bloques = Array.from(
      wrapper.querySelectorAll(".report-header, .file-title, .card, .report-footer")
    );

    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margen = 24;
    const anchoUtil = pdfWidth - margen * 2;

    // Pinta el fondo oscuro de la página actual, para que los espacios
    // entre tarjetas y los márgenes no queden en blanco (efecto "recorte").
    const pintarFondoPagina = () => {
      pdf.setFillColor(15, 23, 42); // #0f172a
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
    };
    pintarFondoPagina();

    let cursorY = margen;
    let esPrimerBloque = true;
    const alturaMaximaPagina = pdfHeight - margen * 2;

    for (const bloque of bloques) {
      const canvas = await html2canvas(bloque, {
        backgroundColor: "#0f172a",
        scale: 2,
        useCORS: true,
      });

      const factorEscala = anchoUtil / canvas.width;
      const alturaBloque = canvas.height * factorEscala;
      const imagenPNG = canvas.toDataURL("image/png");

      if (alturaBloque > alturaMaximaPagina) {
        // Tarjeta más alta que una página completa: se corta en varias
        // páginas en vez de perderla o dibujarla fuera del área visible.
        if (!esPrimerBloque) {
          pdf.addPage();
          pintarFondoPagina();
        }
        let alturaRestante = alturaBloque;
        let desplazamiento = 0;
        let primeraFranja = true;
        while (alturaRestante > 0) {
          if (!primeraFranja) {
            pdf.addPage();
            pintarFondoPagina();
          }
          pdf.addImage(imagenPNG, "PNG", margen, margen - desplazamiento, anchoUtil, alturaBloque);
          desplazamiento += alturaMaximaPagina;
          alturaRestante -= alturaMaximaPagina;
          primeraFranja = false;
        }
        cursorY = margen + (alturaBloque % alturaMaximaPagina || alturaMaximaPagina) + 14;
        esPrimerBloque = false;
        continue;
      }

      const cabeEnPaginaActual = cursorY + alturaBloque <= pdfHeight - margen;

      if (!esPrimerBloque && !cabeEnPaginaActual) {
        pdf.addPage();
        pintarFondoPagina();
        cursorY = margen;
      }

      pdf.addImage(imagenPNG, "PNG", margen, cursorY, anchoUtil, alturaBloque);
      cursorY += alturaBloque + 14;
      esPrimerBloque = false;
    }

    const fechaArchivo = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    pdf.save(`reporte-datamind-${fechaArchivo}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}