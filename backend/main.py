from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Assistant Backend Running"}

@app.get("/about")
def about():
    return {
        "project": "AI Assistant Platform",
        "developers": ["Mohammed Taif", "Fazil Ahmed Khan"]
    }
