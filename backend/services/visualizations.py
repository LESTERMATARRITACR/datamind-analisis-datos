"""
Módulo de generación de visualizaciones para DataMind.

Contiene funciones encargadas de transformar un DataFrame de Pandas y los
resultados del análisis exploratorio (correlaciones) en estructuras de datos
serializables a JSON, listas para ser consumidas por el frontend (React) y
renderizadas mediante librerías de gráficos del lado del cliente.

No se generan imágenes ni se utiliza matplotlib: todas las funciones
devuelven listas y tipos nativos de Python (int, float, str, list, dict).
"""

import numpy as np
import pandas as pd


# ----------------------------
# Utilidades internas
# ----------------------------

def _to_native(valor):
    """
    Convierte un valor numérico (incluyendo tipos de numpy/pandas) a un
    tipo nativo de Python compatible con la serialización JSON.

    Args:
        valor: Valor a convertir. Puede ser un escalar de numpy, pandas
            o un tipo nativo de Python.

    Returns:
        int, float o None: Representación nativa del valor. Los valores
        nulos, NaN o infinitos se convierten en None.
    """
    if valor is None:
        return None

    if isinstance(valor, (np.integer,)):
        return int(valor)

    if isinstance(valor, (np.floating, float)):
        if np.isnan(valor) or np.isinf(valor):
            return None
        return float(valor)

    if pd.isna(valor):
        return None

    return valor


def _serie_numerica_valida(df, columna):
    """
    Obtiene una serie numérica sin valores nulos ni infinitos para una
    columna determinada.

    Args:
        df (pandas.DataFrame): DataFrame de origen.
        columna (str): Nombre de la columna a extraer.

    Returns:
        pandas.Series: Serie limpia, sin NaN ni valores infinitos.
    """
    serie = pd.to_numeric(df[columna], errors="coerce")
    serie = serie.replace([np.inf, -np.inf], np.nan)
    return serie.dropna()


# ----------------------------
# Histogramas
# ----------------------------

def generate_histograms(df, numeric_columns):
    """
    Genera los datos de histograma para cada columna numérica utilizando
    binning automático (numpy.histogram con bins="auto").

    Args:
        df (pandas.DataFrame): DataFrame con los datos ya limpios.
        numeric_columns (list): Lista de nombres de columnas numéricas.

    Returns:
        dict: Estructura de la forma
            {
                "NOMBRE_COLUMNA": {
                    "bins": [...],
                    "counts": [...]
                }
            }
    """
    histogramas = {}

    for columna in numeric_columns:

        serie = _serie_numerica_valida(df, columna)

        if serie.empty:
            histogramas[columna] = {"bins": [], "counts": []}
            continue

        counts, bin_edges = np.histogram(serie.to_numpy(), bins="auto")

        histogramas[columna] = {
            "bins": [_to_native(b) for b in bin_edges.tolist()],
            "counts": [_to_native(c) for c in counts.tolist()],
        }

    return histogramas


# ----------------------------
# Boxplots
# ----------------------------

def generate_boxplots(df, numeric_columns):
    """
    Calcula los estadísticos necesarios para construir un diagrama de
    caja (boxplot) por cada columna numérica, incluyendo la lista de
    valores atípicos (outliers) determinados mediante el método IQR.

    Args:
        df (pandas.DataFrame): DataFrame con los datos ya limpios.
        numeric_columns (list): Lista de nombres de columnas numéricas.

    Returns:
        list: Lista de diccionarios con la forma
            {
                "column": "Edad",
                "min": ...,
                "q1": ...,
                "median": ...,
                "q3": ...,
                "max": ...,
                "outliers": [...]
            }
    """
    boxplots = []

    for columna in numeric_columns:

        serie = _serie_numerica_valida(df, columna)

        if serie.empty:
            boxplots.append({
                "column": columna,
                "min": None,
                "q1": None,
                "median": None,
                "q3": None,
                "max": None,
                "outliers": [],
            })
            continue

        q1 = serie.quantile(0.25)
        q3 = serie.quantile(0.75)
        mediana = serie.median()
        iqr = q3 - q1

        limite_inferior = q1 - 1.5 * iqr
        limite_superior = q3 + 1.5 * iqr

        valores_atipicos = serie[
            (serie < limite_inferior) | (serie > limite_superior)
        ]

        boxplots.append({
            "column": columna,
            "min": _to_native(serie.min()),
            "q1": _to_native(q1),
            "median": _to_native(mediana),
            "q3": _to_native(q3),
            "max": _to_native(serie.max()),
            "outliers": [_to_native(v) for v in valores_atipicos.tolist()],
        })

    return boxplots


# ----------------------------
# Scatterplots
# ----------------------------

def generate_scatterplots(df, numeric_columns, correlations):
    """
    Genera pares de dispersión (scatterplots) únicamente para las 5
    combinaciones de columnas con mayor correlación absoluta, evitando
    la diagonal principal y las parejas duplicadas.

    Args:
        df (pandas.DataFrame): DataFrame con los datos ya limpios.
        numeric_columns (list): Lista de nombres de columnas numéricas.
        correlations (dict): Matriz de correlaciones en forma de
            diccionario anidado, tal como la produce analizar_dataframe.

    Returns:
        list: Lista de diccionarios con la forma
            {
                "x": "INGRESOS",
                "y": "GASTO",
                "points": [{"x": 1200, "y": 900}, ...]
            }
    """
    pares_evaluados = set()
    pares_correlacion = []

    for col_x in numeric_columns:

        if col_x not in correlations:
            continue

        for col_y in numeric_columns:

            if col_x == col_y:
                continue

            if col_y not in correlations.get(col_x, {}):
                continue

            clave = frozenset((col_x, col_y))

            if clave in pares_evaluados:
                continue

            pares_evaluados.add(clave)

            valor_correlacion = correlations[col_x][col_y]

            if valor_correlacion is None:
                continue

            pares_correlacion.append(
                (col_x, col_y, abs(valor_correlacion), valor_correlacion)
            )

    pares_correlacion.sort(key=lambda item: item[2], reverse=True)
    mejores_pares = pares_correlacion[:5]

    scatterplots = []

    for col_x, col_y, _, _ in mejores_pares:

        subconjunto = df[[col_x, col_y]].copy()
        subconjunto[col_x] = pd.to_numeric(subconjunto[col_x], errors="coerce")
        subconjunto[col_y] = pd.to_numeric(subconjunto[col_y], errors="coerce")
        subconjunto = subconjunto.replace([np.inf, -np.inf], np.nan).dropna()

        puntos = [
            {
                "x": _to_native(fila[col_x]),
                "y": _to_native(fila[col_y]),
            }
            for _, fila in subconjunto.iterrows()
        ]

        scatterplots.append({
            "x": col_x,
            "y": col_y,
            "points": puntos,
        })

    return scatterplots


# ----------------------------
# Heatmap
# ----------------------------

def generate_heatmap(correlations):
    """
    Transforma la matriz de correlaciones (diccionario anidado) en una
    estructura de etiquetas y matriz numérica, apta para ser dibujada
    como un HeatMap en el frontend.

    Args:
        correlations (dict): Matriz de correlaciones en forma de
            diccionario anidado, tal como la produce analizar_dataframe.

    Returns:
        dict: Estructura de la forma
            {
                "labels": [...],
                "matrix": [[...], [...], ...]
            }
    """
    etiquetas = list(correlations.keys())

    matriz = []

    for fila in etiquetas:

        valores_fila = []

        for columna in etiquetas:
            valor = correlations.get(fila, {}).get(columna)
            valores_fila.append(_to_native(valor))

        matriz.append(valores_fila)

    return {
        "labels": etiquetas,
        "matrix": matriz,
    }


# ----------------------------
# Distribuciones
# ----------------------------

def generate_distributions(df, numeric_columns):
    """
    Obtiene, para cada columna numérica, el listado de valores válidos
    ordenados de menor a mayor.

    Args:
        df (pandas.DataFrame): DataFrame con los datos ya limpios.
        numeric_columns (list): Lista de nombres de columnas numéricas.

    Returns:
        dict: Estructura de la forma
            {
                "Edad": [18, 19, 20, 21, ...]
            }
    """
    distribuciones = {}

    for columna in numeric_columns:

        serie = _serie_numerica_valida(df, columna)
        valores_ordenados = serie.sort_values().tolist()

        distribuciones[columna] = [_to_native(v) for v in valores_ordenados]

    return distribuciones


# ----------------------------
# Punto de entrada del módulo
# ----------------------------

def generate_visualizations(df, numeric_columns, correlations):
    """
    Genera el conjunto completo de visualizaciones (histogramas,
    boxplots, scatterplots, heatmap y distribuciones) a partir de un
    DataFrame y su matriz de correlaciones.

    Args:
        df (pandas.DataFrame): DataFrame con los datos ya limpios.
        numeric_columns (list): Lista de nombres de columnas numéricas.
        correlations (dict): Matriz de correlaciones en forma de
            diccionario anidado, tal como la produce analizar_dataframe.

    Returns:
        dict: Estructura de la forma
            {
                "histograms": ...,
                "boxplots": ...,
                "scatterplots": ...,
                "heatmap": ...,
                "distributions": ...
            }
    """
    return {
        "histograms": generate_histograms(df, numeric_columns),
        "boxplots": generate_boxplots(df, numeric_columns),
        "scatterplots": generate_scatterplots(df, numeric_columns, correlations),
        "heatmap": generate_heatmap(correlations),
        "distributions": generate_distributions(df, numeric_columns),
    }