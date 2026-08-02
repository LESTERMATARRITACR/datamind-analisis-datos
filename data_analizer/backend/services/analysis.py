def generar_analisis_exploratorio(df, num_cols):
    if not num_cols:
        return {}
        
    # Estadísticas descriptivas
    estadisticas = df[num_cols].describe().to_dict()
    
    # Correlaciones
    correlaciones = df[num_cols].corr().to_dict() if len(num_cols) > 1 else {}
    
    # Outliers (IQR)
    outliers = {}
    for col in num_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        outliers[col] = int(((df[col] < (q1 - 1.5 * iqr)) | (df[col] > (q3 + 1.5 * iqr))).sum())
        
    return {
        "estadisticas": estadisticas,
        "correlaciones": correlaciones,
        "outliers": outliers
    }