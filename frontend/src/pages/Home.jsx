import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { UploadFiles } from "../components/UploadFiles";
import { Results } from "../components/Results";

function Home() {
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

const irAGraficos = () => {

  console.log("RESULTADOS:");
  console.log(resultados);

  navigate("/visualizations", {
    state: {
      resultados,
    },
  });

};

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="brand-container">
          <h1>DataMind</h1>
          <span className="version-tag">v1.0 Enterprise</span>
        </div>

        <p className="subtitle">
          Plataforma Automatizada de Análisis de Datos,
          Clustering e IA Generativa
        </p>

        <div className="tech-stack">
          <span className="tech-pill">Frontend: React</span>
          <span className="tech-pill">Backend: Python FastAPI</span>
          <span className="tech-pill">LLM: Ollama</span>
        </div>
      </header>

      <main className="app-main">
        <section className="dashboard-card">
          <div className="card-header">
            <span className="badge badge-blue">
              INGESTA DE DATOS
            </span>

            <h2>Carga de Archivos de Análisis</h2>
          </div>

          <UploadFiles
            onAnalisisCompleto={setResultados}
            setCargando={setCargando}
          />
        </section>

        {cargando && (
          <div className="loading-box">
            <div className="spinner"></div>

            <p>
              Procesando estructura de archivos,
              ejecutando pipeline de limpieza y modelos de ML...
            </p>
          </div>
        )}

        {!cargando && resultados && (
          <>
            <Results data={resultados} />

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "30px",
                marginBottom: "40px",
              }}
            >
              <button
                onClick={irAGraficos}
                style={{
                  padding: "14px 28px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  background: "#2563eb",
                  color: "white",
                  transition: "0.3s",
                }}
              >
                📊 Ver Visualizaciones
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Home;