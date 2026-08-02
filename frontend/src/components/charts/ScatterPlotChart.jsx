import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

/**
 * ScatterPlotChart
 * Permite elegir dos variables (X e Y) mediante selectores y busca
 * automáticamente, dentro del arreglo de scatterplots recibido del
 * backend, la combinación correspondiente (en cualquier orden).
 *
 * Props:
 *  - data: Array<{ x, y, points: Array<{ x, y }> }>
 */
function ScatterPlotChart({ data }) {
  const variables = useMemo(() => {
    const unicas = new Set();
    (data || []).forEach((item) => {
      unicas.add(item.x);
      unicas.add(item.y);
    });
    return Array.from(unicas);
  }, [data]);

  const [varX, setVarX] = useState('');
  const [varY, setVarY] = useState('');

  const seleccionX = varX || variables[0] || '';
  const seleccionY = varY || variables[1] || variables[0] || '';

  // Busca la combinación exacta o invertida dentro del arreglo recibido.
  const scatterEncontrado = useMemo(() => {
    if (!data) return null;

    return data.find(
      (item) =>
        (item.x === seleccionX && item.y === seleccionY) ||
        (item.x === seleccionY && item.y === seleccionX)
    );
  }, [data, seleccionX, seleccionY]);

  const estaInvertido = scatterEncontrado && scatterEncontrado.x !== seleccionX;

  const puntos = useMemo(() => {
    if (!scatterEncontrado) return [];
    if (!estaInvertido) return scatterEncontrado.points;

    // Si el par recibido está invertido respecto a la selección actual,
    // se transponen los ejes para respetar lo elegido por el usuario.
    return scatterEncontrado.points.map((punto) => ({
      x: punto.y,
      y: punto.x,
    }));
  }, [scatterEncontrado, estaInvertido]);

  if (!variables.length) {
    return <p className="chart-empty">No hay combinaciones de dispersión disponibles.</p>;
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <label htmlFor="scatter-select-x">Variable X:</label>
        <select
          id="scatter-select-x"
          value={seleccionX}
          onChange={(evento) => setVarX(evento.target.value)}
        >
          {variables.map((variable) => (
            <option key={variable} value={variable}>
              {variable}
            </option>
          ))}
        </select>

        <label htmlFor="scatter-select-y">Variable Y:</label>
        <select
          id="scatter-select-y"
          value={seleccionY}
          onChange={(evento) => setVarY(evento.target.value)}
        >
          {variables.map((variable) => (
            <option key={variable} value={variable}>
              {variable}
            </option>
          ))}
        </select>
      </div>

      {scatterEncontrado ? (
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              type="number"
              dataKey="x"
              name={seleccionX}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={seleccionY}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Scatter data={puntos} fill="#a855f7" />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <p className="chart-empty">
          No existe una combinación calculada entre {seleccionX} y {seleccionY}.
        </p>
      )}
    </div>
  );
}

export default ScatterPlotChart;
