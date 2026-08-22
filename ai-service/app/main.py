from fastapi import FastAPI

app = FastAPI(title="Placement Nexus AI Service")

@app.get("/health")
def health_check():
    return {"status": "ok"}
