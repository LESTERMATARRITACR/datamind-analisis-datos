from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def aplicar_clustering(df, num_cols, k=3):
    if len(num_cols) < 2 or len(df) < k:
        return {"clusters_creados": 0}
        
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(df[num_cols])
    
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(data_scaled)
    
    return {
        "clusters_creados": k,
        "conteo_por_cluster": df['cluster'].value_counts().to_dict()
    }