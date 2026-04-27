from abc import ABC, abstractmethod
from datetime import datetime
import json

class Observer(ABC):
    @abstractmethod
    def update(self, event_type: str, data: dict):
        pass

class EventManager:
    def __init__(self):
        self._observers = []

    def subscribe(self, observer: Observer):
        self._observers.append(observer)

    def unsubscribe(self, observer: Observer):
        self._observers.remove(observer)

    def notify(self, event_type: str, data: dict):
        for observer in self._observers:
            observer.update(event_type, data)

class FileLoggerObserver(Observer):
    def __init__(self, log_file: str):
        self.log_file = log_file

    def update(self, event_type: str, data: dict):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event_type,
            "data": data
        }
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")