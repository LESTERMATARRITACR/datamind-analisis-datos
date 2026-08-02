import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import HistogramChart from "../components/charts/HistogramChart";
import BoxPlotChart from "../components/charts/BoxPlotChart";
import ScatterPlotChart from "../components/charts/ScatterPlotChart";
import HeatmapChart from "../components/charts/HeatmapChart";
import DistributionChart from "../components/charts/DistributionChart";

import "./Visualizations.css";

function Visualizations() {

    const location = useLocation();
    const navigate = useNavigate();

    const resultados = location.state?.resultados;

    if (!resultados) {

        return (

            <div className="no-data">

                <h2>No hay datos para visualizar.</h2>

                <button onClick={() => navigate("/")}>
                    Volver al inicio
                </button>

            </div>

        );

    }

    const visualizations = resultados[0].visualizations;

    return (

        <div className="visualizations-page">

            <h1 className="page-title">

                📊 Visualizaciones

            </h1>

            <button
                className="back-button"
                onClick={() => navigate("/")}
            >
                ← Volver
            </button>

            <div className="visualizations-grid">

                <VisualizationCard title="Histogramas">

                    <HistogramChart
                        data={visualizations.histograms}
                    />

                </VisualizationCard>

                <VisualizationCard title="Diagramas de Caja">

                    <BoxPlotChart
                        data={visualizations.boxplots}
                    />

                </VisualizationCard>

                <VisualizationCard title="Diagramas de Dispersión">

                    <ScatterPlotChart
                        data={visualizations.scatterplots}
                    />

                </VisualizationCard>

                <VisualizationCard title="Mapa de Calor">

                    <HeatmapChart
                        data={visualizations.heatmap}
                    />

                </VisualizationCard>

                <VisualizationCard title="Distribuciones">

                    <DistributionChart
                        data={visualizations.distributions}
                    />

                </VisualizationCard>

            </div>

        </div>

    );

}

function VisualizationCard({ title, children }) {

    return (

        <section className="visualization-card">

            <h2>{title}</h2>

            {children}

        </section>

    );

}

export default Visualizations;