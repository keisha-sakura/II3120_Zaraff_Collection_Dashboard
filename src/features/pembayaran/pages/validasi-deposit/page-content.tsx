import { PaymentValidation } from "../../components/payment-validation";
export function DepositValidationPage({ id }: { id: string }) {
  return <PaymentValidation id={id} method="deposit" />;
}
