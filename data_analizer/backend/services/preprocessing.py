def limpiar_y_preparar(df):
    # Estandarizar nombres de columnas
    df.columns = df.columns.str.strip().str.lower()
    
    # Detectar tipos de variables
    num_cols = df.select_dtypes(include=['number']).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # Limpieza básica
    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())
    for col in cat_cols:
        df[col] = df[col].fillna('Desconocido')
        
    return df, num_cols, cat_cols