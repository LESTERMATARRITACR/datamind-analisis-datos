import React from 'react';

/**
 * HeatmapChart
 * Dibuja la matriz de correlaciones como una tabla HTML, sin depender
 * de librerías externas de gráficos. El color de cada celda se
 * interpola entre rojo (-1), blanco (0) y azul (1).
 *
 * Props:
 *  - data: { labels: string[], matrix: number[][] }
 */
function HeatmapChart({ data }) {
  const labels = data?.labels || [];
  const matrix = data?.matrix || [];

  if (!labels.length) {
    return <p className="chart-empty">No hay correlaciones disponibles.</p>;
  }

  return (
    <div className="heatmap-scroll">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th className="heatmap-corner"></th>
            {labels.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((filaLabel, filaIndice) => (
            <tr key={filaLabel}>
              <th>{filaLabel}</th>
              {labels.map((columnaLabel, columnaIndice) => {
                const valor = matrix?.[filaIndice]?.[columnaIndice];

                return (
                  <td
                    key={columnaLabel}
                    style={{ backgroundColor: colorPorValor(valor) }}
                    title={`${filaLabel} vs ${columnaLabel}: ${valor}`}
                  >
                    {typeof valor === 'number' ? valor.toFixed(2) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Interpola un color entre rojo (-1), blanco (0) y azul (1) según el
 * valor de correlación recibido.
 */
function colorPorValor(valor) {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    return '#334155';
  }

  const valorAcotado = Math.max(-1, Math.min(1, valor));

  const blanco = [255, 255, 255];
  const rojo = [239, 68, 68];
  const azul = [59, 130, 246];

  const objetivo = valorAcotado < 0 ? rojo : azul;
  const factor = Math.abs(valorAcotado);

  const [r, g, b] = blanco.map((canal, indice) =>
    Math.round(canal + (objetivo[indice] - canal) * factor)
  );

  return `rgb(${r}, ${g}, ${b})`;
}

export default HeatmapChart;
