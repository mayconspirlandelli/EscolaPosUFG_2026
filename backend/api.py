from fastapi import FastAPI

app = FastAPI(
    title="Chatbot Checador de Veracidade API",
    description="API para o sistema de checagem de fake news",
    version="0.1.0"
)

@app.get("/")
async def root():
    return {"message": "Hello World", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
