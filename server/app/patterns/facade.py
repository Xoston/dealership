from .strategy import AnnuityStrategy
from .. import crud

class LoanCalculatorFacade:
    def __init__(self, strategy=AnnuityStrategy()):
        self.strategy = strategy

    def calculate_and_save(self, user_id: int, loan_data):
        # loan_data - объект схемы (Pydantic)
        loan_dict = {
            "car_id": loan_data.car_id,
            "amount": loan_data.amount,
            "term_months": loan_data.term_months,
            "interest_rate": loan_data.interest_rate,
        }
        result = self.strategy.calculate(loan_dict["amount"], loan_dict["interest_rate"], loan_dict["term_months"])
        application = crud.create_loan_application(user_id, loan_dict, result)
        return result, application