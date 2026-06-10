from fastapi import APIRouter, Body
import httpx
import re
from .. import crud

router = APIRouter(tags=["chat"])

# Список известных автомобильных брендов (в нижнем регистре) для проверки контекста
KNOWN_BRANDS = {
    "bmw", "audi", "mercedes", "porsche", "lexus", "bentley", "rolls-royce",
    "lamborghini", "ferrari", "mclaren", "land rover", "jaguar", "maserati",
    "aston martin", "cadillac", "infiniti", "genesis", "bugatti", "koenigsegg",
    "pagani", "alfa romeo", "lotus", "rimac", "polestar", "lucid",
    # русские написания
    "бугати", "бугатти", "бвм", "ауди", "мерседес", "порш", "лексус", "бентли",
    "роллс-ройс", "ламборгини", "феррари", "макларен", "ягуар", "мазерати",
    "астон мартин", "кадиллак", "инфинити", "дженезис", "бугатти"
}

def filter_relevant_cars(query: str, cars: list):
    """
    Отбирает машины по запросу:
    1. По совпадению бренда/модели.
    2. По ценовому диапазону (ищет фразы вроде "от 100 млн", "до 5 миллионов").
    3. Иначе возвращает первые 10 машин.
    """
    query_lower = query.lower()

    # 1. Поиск по бренду/модели (релевантные машины)
    relevant = [c for c in cars if query_lower in f"{c['brand']} {c['model']}".lower()]
    if relevant:
        return relevant[:10]

    # 2. Поиск по цене – ищем числа с указанием "млн", "миллион", "мн", "млн.", "млн. руб" и т.д.
    # Примеры: "от 100млн", "до 5 миллионов", "100 млн руб"
    price_pattern = r'(\d+)\s*(?:млн|миллион|млн\.|млн\.\s*руб|мн)\b'
    match = re.search(price_pattern, query_lower)
    if match:
        min_price = int(match.group(1)) * 1_000_000
        # Если упоминается "от", то фильтруем >= min_price, иначе считаем это "примерно до"
        if "от" in query_lower:
            filtered = [c for c in cars if c['price'] >= min_price]
        elif "до" in query_lower:
            filtered = [c for c in cars if c['price'] <= min_price]
        else:
            # Просто упоминание суммы – считаем ориентиром "в районе"
            filtered = [c for c in cars if abs(c['price'] - min_price) <= min_price * 0.2]  # ±20%
        if filtered:
            return sorted(filtered, key=lambda x: x['price'])[:10]
        else:
            return []  # честно скажем, что машин не нашли

    # 3. Ничего не распознали – отдаём все машины (но не больше 10)
    return cars[:10] if cars else []

@router.post("/")
async def chat(payload: dict = Body(...)):
    user_message = payload.get("message", "").strip()
    if not user_message:
        return {"reply": "Пожалуйста, напишите сообщение."}

    # Получаем список авто из базы
    try:
        all_cars = crud.get_cars()
    except Exception as e:
        print(f"[CHAT] Ошибка получения машин: {e}")
        all_cars = []

    cars_to_show = filter_relevant_cars(user_message, all_cars)

    if cars_to_show:
        car_list = "\n".join(
            f"- {c['brand']} {c['model']} ({c['year']}): {c['price']} ₽"
            for c in cars_to_show
        )
    else:
        car_list = "В салоне сейчас нет автомобилей, соответствующих вашему запросу."

    # Определяем, является ли запрос автомобильным (по ключевым словам)
    is_car_query = False
    msg_lower = user_message.lower()
    # проверяем наличие брендов или явных слов "машина", "авто", "bmw" и т.д.
    if any(brand in msg_lower for brand in KNOWN_BRANDS):
        is_car_query = True
    if any(word in msg_lower for word in ["машин", "авто", "bmw", "audi", "мерс", "тачка", "джип", "седан", "купе"]):
        is_car_query = True

    # Если запрос НЕ автомобильный – вежливо отказываемся
    if not is_car_query:
        # Дополнительная проверка: совсем постороннее
        if not any(word in msg_lower for word in ["сникерс", "погода", "анекдот", "шутка", "привет"]):
            # если ни одного триггера, возможно это короткое "да", "нет", "спасибо" – не будем отказывать
            pass
        else:
            return {"reply": "Я консультирую только по автомобилям. Чем могу помочь с выбором машины?"}

    system_prompt = (
        "Ты — помощник премиального автосалона Luxury Dealer. Говори кратко (2–3 предложения), "
        "строго по делу, только на русском языке.\n"
        "Ниже приведён **единственный** список автомобилей, которые сейчас есть в салоне. "
        "За его пределами машин НЕ существует!\n\n"
        f"{car_list}\n\n"
        "ПРАВИЛА (нарушать нельзя):\n"
        "1. Если клиент спрашивает о конкретной модели и она ЕСТЬ в списке — расскажи о ней, укажи цену.\n"
        "2. Если модели НЕТ в списке — скажи: «Такой модели сейчас нет, но могу предложить…» и назови ДВЕ машины из списка, наиболее близкие по классу или цене.\n"
        "3. НИКОГДА не называй автомобили, которых нет в этом списке. НИКОГДА не придумывай модели.\n"
        "4. Если список пуст (нет машин) — скажи: «К сожалению, подходящих автомобилей сейчас нет. Обратитесь позже.»\n"
        "5. Если запрос о цене ('от 100 млн', 'бюджет 5 млн') — работай только с автомобилями из списка. "
        "Если ни один не подходит — скажи: «В этом бюджете машин нет. Могу предложить ближайшие по цене.» и покажи две ближайшие.\n"
        "6. Отвечай на русском, без эмодзи и спецсимволов."
    )

    full_prompt = f"{system_prompt}\n\nВопрос клиента: {user_message}\nОтвет менеджера:"

    OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": "llama3.2:3b",
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.2,
                        "num_predict": 200
                    }
                },
            )
            if response.status_code != 200:
                return {"reply": "Извините, ИИ-консультант временно недоступен."}
            data = response.json()
            reply = data.get("response", "").strip()
            return {"reply": reply}
    except Exception as e:
        print(f"[CHAT ERROR] {e}")
        return {"reply": "чат временно не работает"}