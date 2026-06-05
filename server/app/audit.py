import asyncio
from .patterns.observer import EventManager, FileLoggerObserver
from .ws_manager import ws_manager

# Инициализируем глобальный менеджер событий
event_manager = EventManager()

class NotificationObserver:
    def update(self, event_type: str, data: dict):
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.handle_notification(event_type, data))
        except RuntimeError:
            asyncio.run(self.handle_notification(event_type, data))

    async def handle_notification(self, event_type: str, data: dict):
        # 1. ЗАЯВКИ ОТ ЮЗЕРА -> ТОЛЬКО АДМИНАМ И МЕНЕДЖЕРАМ
        if event_type == "TESTDRIVE_REQUESTED":
            msg = {"type": "info", "message": f"Новая заявка на тест-драйв от {data.get('user', 'пользователя')}"}
            await ws_manager.send_to_roles(msg, ["admin", "manager"])
            
        elif event_type == "LOAN_REQUESTED":
            msg = {"type": "info", "message": f"Новая заявка на кредит от {data.get('user', 'пользователя')}"}
            await ws_manager.send_to_roles(msg, ["admin", "manager"])

        # 2. СМЕНА СТАТУСА АДМИНОМ -> ТОЛЬКО ЮЗЕРУ (КОТОРЫЙ ОТПРАВЛЯЛ)
        elif event_type == "TESTDRIVE_STATUS_CHANGED":
            user_id = data.get("user_id")
            status = data.get("new_status")
            if user_id and status:
                status_ru = "одобрена" if status == "approved" else "отклонена" if status == "rejected" else status
                msg = {
                    "type": "success" if status == "approved" else "error",
                    "message": f"Ваша заявка на тест-драйв была {status_ru}."
                }
                await ws_manager.send_to_user(user_id, msg)

        elif event_type == "LOAN_STATUS_CHANGED":
            user_id = data.get("user_id")
            status = data.get("new_status")
            if user_id and status:
                status_ru = "одобрена" if status == "approved" else "отклонена" if status == "rejected" else status
                msg = {
                    "type": "success" if status == "approved" else "error",
                    "message": f"Ваша заявка на кредит была {status_ru}."
                }
                await ws_manager.send_to_user(user_id, msg)

# Подключаем логгер в файл и наш новый класс уведомлений
file_logger = FileLoggerObserver("audit.log")
notification_logger = NotificationObserver()

event_manager.subscribe(file_logger)
event_manager.subscribe(notification_logger)