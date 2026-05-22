from fastapi import APIRouter, Body
import httpx
import os

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Вставьте сюда ваш ключ OpenRouter (или задайте переменную окружения OPENROUTER_API_KEY)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")

@router.post("/")
async def chat(payload: dict = Body(...)):
    user_message = payload.get("message", "")
    if not user_message:
        return {"reply": "Пожалуйста, напишите сообщение."}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Ты — менеджер премиального автосалона Luxury Dealer. "
                                "Отвечай кратко, вежливо, на русском языке. "
                                "Помогай с выбором автомобиля, рассказывай о кредите, тест-драйве, характеристиках машин. "
                                "Если вопрос не по теме — вежливо переведи разговор на автомобили."
                            )
                        },
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 200,
                },
            )
            data = response.json()
            reply = data["choices"][0]["message"]["content"].strip()
    except Exception:
        reply = "Извините, я временно недоступен. Пожалуйста, попробуйте позже."

    return {"reply": reply}