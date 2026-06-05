from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        # Храним ключи строго как строки
        self.active_connections: Dict[str, dict] = {}

    async def connect(self, user_id, role: str, websocket: WebSocket):
        await websocket.accept()
        # Принудительно кастим к str
        self.active_connections[str(user_id)] = {"role": role, "websocket": websocket}

    def disconnect(self, user_id):
        uid_str = str(user_id)
        if uid_str in self.active_connections:
            del self.active_connections[uid_str]

    async def send_to_user(self, user_id, message: dict):
        uid_str = str(user_id)
        if uid_str in self.active_connections:
            try:
                await self.active_connections[uid_str]["websocket"].send_json(message)
            except Exception:
                self.disconnect(uid_str)

    async def send_to_roles(self, message: dict, roles: list):
        for conn_id, conn in list(self.active_connections.items()):
            if conn["role"] in roles:
                try:
                    await conn["websocket"].send_json(message)
                except Exception:
                    self.disconnect(conn_id)

ws_manager = ConnectionManager()