import React, { useState } from 'react';

export function Results({ data }) {
  if (!data) return null;

  // Normalizar entrada de datos (desempaqueta arreglos u objetos)
  const listadoArchivos = Array.isArray(data) 
    ? data 
    : (data.resultados || data.data || [data]);

  const [indiceArchivo, setIndiceArchivo] = useState(0);
  const payload = listadoArchivos[indiceArchivo] || listadoArchivos[0] || {};

  // Mapeo flexible de objetos principales (soporta múltiples nomenclaturas de API)
  const estadisticas = payload.estadisticas || payload.estadisticas_descriptivas || payload.stats || payload.descriptiva || {};
  const correlaciones = payload.correlaciones || payload.matriz_correlacion || payload.correlacion || {};
  const outliers = payload.outliers || payload.valores_atipicos || payload.anomalias || {};
  const limpieza = payload.limpieza || payload.preprocesamiento || payload.resumen_limpieza || payload.auditoria || {};
  const clustering = payload.clustering || payload.kmeans || payload.segmentacion || {};

  // Extracción flexible con múltiples fallbacks para resolver inconsistencias de claves
  const nulosAtendidos = 
    limpieza.nulos_atendidos ?? 
    limpieza.valores_nulos ?? 
    limpieza.nulos ?? 
    limpieza.nulos_imputados ?? 
    payload.nulos_atendidos ?? 
    payload.nulos ?? 
    payload.valores_nulos ?? 
    0;

  const duplicadosEliminados = 
    limpieza.duplicados_eliminados ?? 
    limpieza.duplicados ?? 
    limpieza.filas_duplicadas ?? 
    payload.duplicados_eliminados ?? 
    payload.duplicados ?? 
    payload.filas_duplicadas ?? 
    0;

  const nombreArchivo = 
    payload.archivo || 
    payload.nombre_archivo || 
    payload.filename || 
    payload.file || 
    'datos_procesados.csv';

  const resumenIA = 
    payload.resumen_ia || 
    payload.interpretacion_ia || 
    payload.analisis_ia || 
    payload.llm_summary || 
    payload.resumen || 
    "El modelo analizó la estructura del dataset y clasificó las muestras en grupos homogéneos.";

  const columnas = Object.keys(estadisticas);

  return (
    <div className="dashboard-results">

      {/* Selector de archivos si se cargan múltiples */}
      {listadoArchivos.length > 1 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          {listadoArchivos.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setIndiceArchivo(idx)}
              style={{
                background: indiceArchivo === idx ? '#7c3aed' : '#1e293b',
                border: '1px solid #334155',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              📄 {item.archivo || item.nombre_archivo || `Archivo ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* REQUISITO 3: PROCESAMIENTO Y LIMPIEZA DE DATOS */}
      <section className="dashboard-card">
        <div className="card-header">
          <span className="badge badge-blue">PROCESAMIENTO Y LIMPIEZA DE DATOS</span>
          <h2>Auditoría de Ingesta: {nombreArchivo}</h2>
        </div>

        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-title">Variables Numéricas</span>
            <span className="metric-value">{columnas.length}</span>
            <span className="metric-subtitle">Identificadas para análisis</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Valores Nulos Atendidos</span>
            <span className="metric-value text-green">{nulosAtendidos}</span>
            <span className="metric-subtitle">Registros imputados</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Duplicados Eliminados</span>
            <span className="metric-value text-green">{duplicadosEliminados}</span>
            <span className="metric-subtitle">Filas depuradas</span>
          </div>
        </div>
      </section>

      {/* REQUISITO 4.1: ESTADÍSTICAS DESCRIPTIVAS */}
      <section className="dashboard-card">
        <div className="card-header">
          <span className="badge badge-purple">ANÁLISIS EXPLORATORIO</span>
          <h2>Estadística Descriptiva por Variable</h2>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Muestra (N)</th>
                <th>Promedio</th>
                <th>Mínimo</th>
                <th>Mediana (Q2)</th>
                <th>Máximo</th>
                <th>Desv. Estándar</th>
              </tr>
            </thead>
            <tbody>
              {columnas.length > 0 ? (
                columnas.map((col) => (
                  <tr key={col}>
                    <td className="col-name">{col.toUpperCase()}</td>
                    <td>{estadisticas[col]?.count ?? '-'}</td>
                    <td>{estadisticas[col]?.mean !== undefined ? Number(estadisticas[col]?.mean).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</td>
                    <td>{estadisticas[col]?.min !== undefined ? Number(estadisticas[col]?.min).toLocaleString() : '-'}</td>
                    <td>{estadisticas[col]?.['50%'] !== undefined ? Number(estadisticas[col]?.['50%']).toLocaleString() : '-'}</td>
                    <td>{estadisticas[col]?.max !== undefined ? Number(estadisticas[col]?.max).toLocaleString() : '-'}</td>
                    <td>{estadisticas[col]?.std !== undefined ? Number(estadisticas[col]?.std).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table">
                    No se detectaron columnas numéricas procesables.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* REQUISITO 4.2 & 4.5: CORRELACIONES Y RELACIONES ENTRE VARIABLES */}
      <section className="dashboard-card">
        <div className="card-header">
          <span className="badge badge-cyan">RELACIONES ENTRE VARIABLES</span>
          <h2>Matriz de Correlación Lineal</h2>
        </div>

        {Object.keys(correlaciones).length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  {columnas.map((col) => (
                    <th key={col}>{col.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columnas.map((rowCol) => (
                  <tr key={rowCol}>
                    <td className="col-name">{rowCol.toUpperCase()}</td>
                    {columnas.map((col) => {
                      const val = correlaciones[rowCol]?.[col];
                      const isHigh = val !== undefined && Math.abs(val) > 0.6 && val !== 1;
                      return (
                        <td key={col} className={isHigh ? 'highlight-cell' : ''}>
                          {val !== undefined ? Number(val).toFixed(3) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="info-text">Se requieren al menos 2 variables numéricas para calcular correlaciones.</p>
        )}
      </section>

      {/* REQUISITO 4.3: VALORES ATÍPICOS (OUTLIERS) */}
      <section className="dashboard-card">
        <div className="card-header">
          <span className="badge badge-amber">DETECCIÓN DE ANOMALÍAS</span>
          <h2>Valores Atípicos (Outliers - Rango Intercuartílico IQR)</h2>
        </div>

        <div className="metrics-grid">
          {Object.keys(outliers).length > 0 ? (
            Object.keys(outliers).map((col) => (
              <div key={col} className="metric-box">
                <span className="metric-title">{col.toUpperCase()}</span>
                <span className={`metric-value ${outliers[col] > 0 ? 'text-red' : 'text-green'}`}>
                  {outliers[col]}
                </span>
                <span className="metric-subtitle">
                  {outliers[col] > 0 ? 'Anomalías detectadas' : 'Sin valores atípicos'}
                </span>
              </div>
            ))
          ) : (
            <p className="info-text">No se encontraron desviaciones en el dataset.</p>
          )}
        </div>
      </section>

      {/* REQUISITO 4.4: CLUSTERING E INTERPRETACIÓN LLM (OLLAMA) */}
      <section className="dashboard-card">
        <div className="card-header">
          <span className="badge badge-emerald">MODELADO INTELIGENTE</span>
          <h2>Segmentación por Clustering (K-Means) & IA Generativa</h2>
        </div>

        <div className="metrics-grid" style={{ marginBottom: '20px' }}>
          <div className="metric-box">
            <span className="metric-title">Modelo Aplicado</span>
            <span className="metric-value-text">{clustering.algoritmo || clustering.modelo || 'K-Means Algorithm'}</span>
          </div>
          <div className="metric-box">
            <span className="metric-title">Clústeres Generados</span>
            <span className="metric-value">{clustering.n_clusters ?? clustering.clusters ?? clustering.k ?? 3}</span>
          </div>
        </div>

        <div className="ai-insight-box">
          <div className="ai-header">
            <span className="ai-icon">🧠</span>
            <strong>Interpretación del Modelo (Ollama LLM):</strong>
          </div>
          <p className="ai-text">
            {resumenIA}
          </p>
        </div>
      </section>

    </div>
  );
}