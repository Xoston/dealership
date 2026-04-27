from abc import ABC, abstractmethod

class InterestStrategy(ABC):
    @abstractmethod
    def calculate(self, principal: float, annual_rate: float, months: int) -> dict:
        pass

class AnnuityStrategy(InterestStrategy):
    """Аннуитетный платёж (стандартный)"""
    def calculate(self, principal: float, annual_rate: float, months: int):
        monthly_rate = annual_rate / 12 / 100
        if monthly_rate == 0:
            monthly_payment = principal / months
        else:
            monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** months) / ((1 + monthly_rate) ** months - 1)
        total_payment = monthly_payment * months
        overpayment = total_payment - principal
        schedule = []
        balance = principal
        for m in range(1, months + 1):
            interest_payment = balance * monthly_rate
            principal_payment = monthly_payment - interest_payment
            balance -= principal_payment
            schedule.append({
                "month": m,
                "payment": round(monthly_payment, 2),
                "principal": round(principal_payment, 2),
                "interest": round(interest_payment, 2),
                "balance": round(balance, 2)
            })
        return {
            "monthly_payment": round(monthly_payment, 2),
            "total_payment": round(total_payment, 2),
            "overpayment": round(overpayment, 2),
            "schedule": schedule
        }