from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import os

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def root():
    return {
        "message": "AI Assistant Backend Running"
    }

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": request.message
                }
            ]
        )

        return {
            "reply": completion.choices[0].message.content
        }

    except Exception as e:
        return {
            "error": str(e)
        }