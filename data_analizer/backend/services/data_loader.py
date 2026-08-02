import pandas as pd
import io

def cargar_archivos(archivos):
    dataframes = {}
    for archivo in archivos:
        if archivo.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(archivo.read()))
        elif archivo.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(archivo.read()))
        else:
            continue
        dataframes[archivo.filename] = df
    return dataframes