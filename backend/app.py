from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
import numpy as np
import io

from services.visualizations import generate_visualizations
from services.ai_insights import generar_insights_ia

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

app = FastAPI(title="Analizador de Datos")

# ----------------------------
# CORS
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------
# Utilidades
# ----------------------------

def clean_number(value):
    """Convierte cualquier valor numérico a un float válido para JSON."""
    if pd.isna(value):
        return 0

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating, float)):
        if np.isinf(value):
            return 0
        return float(value)

    return value


def leer_archivo(contents, filename):

    if filename.lower().endswith(".csv"):

        for enc in ["utf-8-sig", "utf-8", "latin1"]:

            try:
                return pd.read_csv(
                    io.BytesIO(contents),
                    encoding=enc,
                    sep=None,
                    engine="python",
                )
            except:
                pass

        raise Exception("No fue posible leer el CSV.")

    return pd.read_excel(io.BytesIO(contents))


# ----------------------------
# Análisis principal
# ----------------------------

def analizar_dataframe(df: pd.DataFrame, nombre_archivo: str):

    if df.empty:
        raise Exception("El archivo está vacío.")

    # Copia para evitar warnings
    df = df.copy()

    # Reemplazar infinitos
    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    filas_originales = len(df)

    nulos = int(df.isna().sum().sum())
    duplicados = int(df.duplicated().sum())

    df.drop_duplicates(inplace=True)

    columnas_numericas = df.select_dtypes(include=np.number).columns.tolist()
    columnas_categoricas = df.select_dtypes(exclude=np.number).columns.tolist()

    # --------------------
    # LIMPIEZA
    # --------------------

    for col in columnas_numericas:

        media = df[col].mean()

        if pd.isna(media):
            media = 0

        df[col] = df[col].fillna(media)

    for col in columnas_categoricas:

        if df[col].isna().sum():

            moda = df[col].mode()

            if len(moda):
                df[col] = df[col].fillna(moda.iloc[0])
            else:
                df[col] = df[col].fillna("Sin dato")

    # --------------------
    # ESTADÍSTICAS
    # --------------------

    estadisticas = {}

    if columnas_numericas:

        describe = df[columnas_numericas].describe()

        for col in columnas_numericas:

            estadisticas[col] = {}

            for indice in describe.index:

                estadisticas[col][indice] = clean_number(
                    describe.loc[indice, col]
                )

    # --------------------
    # CORRELACIÓN
    # --------------------

    correlaciones = {}

    if len(columnas_numericas) > 1:

        matriz = (
            df[columnas_numericas]
            .corr()
            .fillna(0)
        )

        for col in matriz.columns:

            correlaciones[col] = {}

            for otra in matriz.columns:

                correlaciones[col][otra] = clean_number(
                    matriz.loc[col, otra]
                )

    # --------------------
    # OUTLIERS
    # --------------------

    outliers = {}

    for col in columnas_numericas:

        q1 = df[col].quantile(.25)
        q3 = df[col].quantile(.75)

        iqr = q3 - q1

        if iqr == 0 or pd.isna(iqr):

            outliers[col] = 0

            continue

        inferiores = q1 - 1.5 * iqr
        superiores = q3 + 1.5 * iqr

        cantidad = len(
            df[
                (df[col] < inferiores) |
                (df[col] > superiores)
            ]
        )

        outliers[col] = int(cantidad)

    # --------------------
    # CLUSTERING
    # --------------------

    clustering = {
        "algoritmo": "K-Means",
        "n_clusters": 0,
        "inercia": 0,
        "clusters": []
    }

    if len(columnas_numericas):

        if len(df) >= 3:

            try:

                datos = StandardScaler().fit_transform(
                    df[columnas_numericas]
                )

                n_clusters = min(3, len(df))

                modelo = KMeans(
                    n_clusters=n_clusters,
                    random_state=42,
                    n_init=10
                )

                modelo.fit(datos)

                clustering = {
                    "algoritmo": "K-Means",
                    "n_clusters": int(n_clusters),
                    "inercia": clean_number(modelo.inertia_),
                    "clusters": modelo.labels_.tolist()
                }

            except Exception:

                pass

    # --------------------
    # VISUALIZACIONES
    # --------------------

    visualizations = generate_visualizations(
        df,
        columnas_numericas,
        correlaciones
    )

    # --------------------
    # RESUMEN
    # --------------------

    resumen = (
        f"Se analizaron {len(df)} registros "
        f"y {len(df.columns)} columnas. "
        f"Se detectaron {len(columnas_numericas)} variables numéricas "
        f"y {len(columnas_categoricas)} categóricas. "
        f"Se eliminaron {duplicados} duplicados "
        f"y se atendieron {nulos} valores nulos."
    )

    resultado = {

        "archivo": nombre_archivo,

        "resumen": {

            "filas": len(df),
            "filas_originales": filas_originales,
            "columnas": len(df.columns),
            "numericas": len(columnas_numericas),
            "categoricas": len(columnas_categoricas)

        },

        "limpieza": {

            "nulos": nulos,
            "duplicados": duplicados

        },

        "estadisticas": estadisticas,

        "correlaciones": correlaciones,

        "outliers": outliers,

        "clustering": clustering,

        "visualizations": visualizations,

        "resumen_ia": resumen

    }

    # --------------------
    # INTELIGENCIA ARTIFICIAL (Punto 6)
    # Interpreta los resultados, genera insights automáticos y prioriza
    # el hallazgo más importante. Usa Ollama si está disponible, y si no,
    # cae en un generador basado en reglas (ver services/ai_insights.py).
    # --------------------

    insights_ia = generar_insights_ia(resultado)

    resultado["interpretacion_ia"] = insights_ia["interpretacion"]
    resultado["insights_ia"] = insights_ia["insights"]
    resultado["hallazgo_prioritario_ia"] = insights_ia["hallazgo_prioritario"]
    resultado["fuente_ia"] = insights_ia["fuente"]

    return resultado

# ----------------------------
# Rutas 
# ----------------------------

@app.get("/")
def inicio():
    return {
        "status": "ok",
        "mensaje": "Backend funcionando."
    }


@app.post("/analizar")
@app.post("/api/analizar")
async def analizar(
    files: list[UploadFile] = File(default=None),
    file: UploadFile = File(default=None)
):
    # Detecta automáticamente si React envió 'file' (singular) o 'files' (plural)
    archivos_a_procesar = []
    if files:
        archivos_a_procesar.extend(files)
    if file:
        archivos_a_procesar.append(file)

    if not archivos_a_procesar:
        raise HTTPException(
            status_code=400, 
            detail="No se recibió ningún archivo. Revisa el FormData de React."
        )

    resultados = []

    for archivo in archivos_a_procesar:
        try:
            contenido = await archivo.read()
            df = leer_archivo(contenido, archivo.filename)
            resultados.append(
                analizar_dataframe(df, archivo.filename)
            )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"{archivo.filename}: {e}"
            )

    return resultados