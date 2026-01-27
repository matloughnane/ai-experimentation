from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()
openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

@app.get("/")
def create_base_response():
    return { "status": 200, "message": "OpenAI Base" }

@app.post("/api/chatkit/session")
def create_chatkit_session():
    # print("openai")
    print(os.environ["OPENAI_API_KEY"])
    session = openai.chatkit.sessions.create({
      # ...
    })
    return {"client_secret": session.client_secret}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)