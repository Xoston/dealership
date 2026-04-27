from ..schemas import CarCreate

class CarFactory:
    """Фабрика для создания объектов автомобилей с дефолтными значениями в зависимости от типа кузова."""
    @staticmethod
    def create_car(car_data: CarCreate) -> dict:
        """Оригинальный метод – принимает Pydantic-схему (не используется в новой реализации, но оставлен для совместимости)."""
        car_dict = car_data.dict()
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