from .patterns.observer import EventManager
from .patterns.observer import FileLoggerObserver
import asyncio
from .ws_manager import ws_manager

class NotificationObserver:
    def update(self, event_type: str, data: dict):
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.handle_notification(event_type, data))
        except RuntimeError:
            asyncio.run(self.handle_notification(event_type, data))

    async def handle_notification(self, event_type: str, data: dict):
        # 1. Заявка на тест-драйв создана
        if event_type == "TESTDRIVE_REQUESTED":
            admin_msg = {
                "type": "info",
                "message": f"Новая заявка на тест-драйв от {data.get('user')}"
            }
            await ws_manager.send_to_roles(admin_msg, ["admin", "manager"])
            
            # Добавляем уведомление для самого клиента
            user_id = data.get("user_id")
            if user_id:
                await ws_manager.send_to_user(user_id, {
                    "type": "success",
                    "message": "Ваша заявка на тест-драйв успешно отправлена!"
                })
            
        # 2. Заявка на кредит создана
        elif event_type == "LOAN_REQUESTED":
            admin_msg = {
                "type": "info",
                "message": f"Новая заявка на кредит от {data.get('user')}"
            }
            await ws_manager.send_to_roles(admin_msg, ["admin", "manager"])
            
            # Добавляем уведомление для самого клиента
            user_id = data.get("user_id")
            if user_id:
                await ws_manager.send_to_user(user_id, {
                    "type": "success",
                    "message": "Ваша заявка на кредит успешно отправлена и ожидает решения."
                })

        # 3. Статус тест-драйва изменен
        elif event_type == "TESTDRIVE_STATUS_UPDATED":
            user_id = data.get("user_id")
            status = data.get("status")
            status_ru = "одобрена" if status == "approved" else "отклонена" if status == "rejected" else status
            msg = {
                "type": "success" if status == "approved" else "error",
                "message": f"Ваша заявка на тест-драйв была {status_ru}."
            }
            if user_id:
                await ws_manager.send_to_user(user_id, msg)

        # 4. Статус кредита изменен
        elif event_type == "LOAN_STATUS_UPDATED":
            user_id = data.get("user_id")
            status = data.get("status")
            status_ru = "одобрена" if status == "approved" else "отклонена" if status == "rejected" else status
            msg = {
                "type": "success" if status == "approved" else "error",
                "message": f"Ваша заявка на кредит была {status_ru}."
            }
            if user_id:
                await ws_manager.send_to_user(user_id, msg)

event_manager = EventManager()