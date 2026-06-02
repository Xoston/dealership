class CarFactory:
    """Фабрика для создания объектов автомобилей с дефолтными значениями в зависимости от типа кузова."""
    
    @staticmethod
    def create_car(car_data: "CarCreate") -> dict:
        """Оригинальный метод – принимает Pydantic-схему (не используется в новой реализации, но оставлен для совместимости)."""
        # Локальный абсолютный импорт предотвращает циклическую зависимость при старте приложения
        from app.schemas import CarCreate
        
        # Безопасное приведение схемы к словарю (с поддержкой Pydantic v2 model_dump)
        car_dict = car_data.model_dump() if hasattr(car_data, "model_dump") else car_data.dict()
        return CarFactory._apply_defaults(car_dict)

    @staticmethod
    def create_car_from_dict(car_dict: dict) -> dict:
        """Новый метод – принимает простой словарь и добавляет значения по умолчанию."""
        return CarFactory._apply_defaults(car_dict)

    @staticmethod
    def _apply_defaults(car_dict: dict) -> dict:
        if not car_dict.get("image_url"):
            body = car_dict.get("body_type", "sedan")
            defaults = {
                "sedan": "/images/sedan-placeholder.jpg",
                "suv": "/images/suv-placeholder.jpg",
                "coupe": "/images/coupe-placeholder.jpg",
            }
            car_dict["image_url"] = defaults.get(body, "/images/default-car.jpg")
        return car_dict