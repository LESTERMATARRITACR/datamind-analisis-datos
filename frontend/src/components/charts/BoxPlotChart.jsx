import React from 'react';

/**
 * BoxPlotChart
 * Como Recharts no dispone de un BoxPlot nativo, cada columna se
 * representa como una tarjeta con sus estadísticos (mínimo, Q1,
 * mediana, Q3, máximo) y una barra visual que ubica esos valores en
 * una escala proporcional, además de listar los outliers detectados.
 *
 * Props:
 *  - data: Array<{ column, min, q1, median, q3, max, outliers }>
 */
function BoxPlotChart({ data }) {
  if (!data || !data.length) {
    return <p className="chart-empty">No hay datos de boxplot disponibles.</p>;
  }

  return (
    <div className="boxplot-grid">
      {data.map((item) => (
        <BoxPlotCard key={item.column} item={item} />
      ))}
    </div>
  );
}

/**
 * Tarjeta individual que dibuja una barra proporcional entre el mínimo
 * y el máximo, señalando el rango intercuartílico (Q1-Q3) y la
 * mediana dentro de ese rango.
 */
function BoxPlotCard({ item }) {
  const { column, min, q1, median, q3, max, outliers = [] } = item;

  const tieneRango = typeof min === 'number' && typeof max === 'number' && max !== min;
  const rango = tieneRango ? max - min : 1;

  const porcentaje = (valor) => {
    if (typeof valor !== 'number' || !tieneRango) return 0;
    return ((valor - min) / rango) * 100;
  };

  return (
    <div className="boxplot-card">
      <h4 className="boxplot-title">{column}</h4>

      <div className="boxplot-track">
        <div
          className="boxplot-box"
          style={{
            left: `${porcentaje(q1)}%`,
            width: `${Math.max(porcentaje(q3) - porcentaje(q1), 2)}%`,
          }}
        />
        <div className="boxplot-median" style={{ left: `${porcentaje(median)}%` }} />
      </div>

      <div className="boxplot-stats">
        <span><strong>Mín</strong>{min}</span>
        <span><strong>Q1</strong>{q1}</span>
        <span><strong>Mediana</strong>{median}</span>
        <span><strong>Q3</strong>{q3}</span>
        <span><strong>Máx</strong>{max}</span>
      </div>

      <div className="boxplot-outliers">
        <strong>Outliers:</strong>{' '}
        {outliers.length > 0 ? outliers.join(', ') : 'Ninguno'}
      </div>
    </div>
  );
}

export default BoxPlotChart;
