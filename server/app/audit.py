from .patterns.observer import EventManager
from .patterns.observer import FileLoggerObserver

event_manager = EventManager()
# Добавляем наблюдателя при старте приложения (в main.py)