import pandas as pd
import requests, zipfile, io

url = "http://data.gdeltproject.org/gdeltv2/20240326200000.export.CSV.zip" 
r = requests.get(url)
with zipfile.ZipFile(io.BytesIO(r.content)) as z:
    with z.open(z.namelist()[0]) as f:
        df = pd.read_csv(f, sep='\t', header=None, nrows=10).fillna("NULL")
        row = df.iloc[0]
        for i, val in enumerate(row):
            print(f"Col {i}: {val}")
