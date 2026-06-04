from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        # Структура словаря: { user_id: { "role": str, "websocket": WebSocket } }
        self.active_connections: Dict[int, dict] = {}

    async def connect(self, user_id: int, role: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = {"role": role, "websocket": websocket}

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id]["websocket"].send_json(message)
            except Exception:
                self.disconnect(user_id)

    async def send_to_roles(self, message: dict, roles: list):
        for user_id, conn in list(self.active_connections.items()):
            if conn["role"] in roles:
                try:
                    await conn["websocket"].send_json(message)
                except Exception:
                    self.disconnect(user_id)

ws_manager = ConnectionManager()