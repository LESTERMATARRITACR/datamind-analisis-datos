import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

/**
 * DistributionChart
 * Muestra la distribución de valores ordenados de una variable
 * numérica. El eje X se construye automáticamente a partir del índice
 * del arreglo recibido.
 *
 * Props:
 *  - data: { [columna]: number[] }
 */
function DistributionChart({ data }) {
  const columnas = useMemo(() => Object.keys(data || {}), [data]);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState(columnas[0] || '');

  const columnaActual = columnaSeleccionada || columnas[0];
  const valores = data ? data[columnaActual] || [] : [];

  const chartData = useMemo(
    () => valores.map((valor, indice) => ({ indice, valor })),
    [valores]
  );

  if (!columnas.length) {
    return <p className="chart-empty">No hay distribuciones disponibles.</p>;
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <label htmlFor="distribution-select">Variable:</label>
        <select
          id="distribution-select"
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
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="indice" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#f8fafc' }}
            itemStyle={{ color: '#22d3ee' }}
          />
          <Line type="monotone" dataKey="valor" name="Valor" stroke="#22d3ee" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DistributionChart;
