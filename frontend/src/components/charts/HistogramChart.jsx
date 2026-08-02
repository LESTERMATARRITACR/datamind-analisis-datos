import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

/**
 * HistogramChart
 * Muestra el histograma de una variable numérica seleccionada por el
 * usuario. Recibe los datos ya calculados en el backend (bins + counts
 * por columna) y permite alternar entre variables mediante un selector.
 *
 * Props:
 *  - data: { [columna]: { bins: number[], counts: number[] } }
 */
function HistogramChart({ data }) {
  const columnas = useMemo(() => Object.keys(data || {}), [data]);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState(columnas[0] || '');

  const columnaActual = columnaSeleccionada || columnas[0];
  const histograma = data ? data[columnaActual] : null;

  // Transforma bins/counts en filas legibles para el BarChart.
  const chartData = useMemo(() => {
    if (!histograma) return [];

    const { bins, counts } = histograma;

    return counts.map((count, index) => {
      const inicio = bins[index];
      const fin = bins[index + 1];

      return {
        rango: `${Number(inicio).toFixed(1)} - ${Number(fin).toFixed(1)}`,
        conteo: count,
      };
    });
  }, [histograma]);

  if (!columnas.length) {
    return <p className="chart-empty">No hay variables numéricas disponibles.</p>;
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <label htmlFor="histogram-select">Variable:</label>
        <select
          id="histogram-select"
          value={columnaActual}
          onChange={(evento) => setColumnaSeleccionada(evento.target.value)}
        >
          {columnas.map((columna) => (
            <option key={columna} value={columna}>
              {columna}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="rango"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={60}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#f8fafc' }}
            itemStyle={{ color: '#38bdf8' }}
          />
          <Bar dataKey="conteo" name="Frecuencia" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HistogramChart;
