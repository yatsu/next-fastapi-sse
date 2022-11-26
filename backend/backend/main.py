from fastapi import FastAPI

app = FastAPI()


@app.get("/api/data")
def Hello():
    return {"data": "hello"}
