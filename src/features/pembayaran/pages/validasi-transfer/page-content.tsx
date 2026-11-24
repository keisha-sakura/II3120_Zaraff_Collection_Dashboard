import { PaymentValidation } from "../../components/payment-validation";
export function TransferValidationPage({ id }: { id: string }) {
  return <PaymentValidation id={id} method="transfer" />;
}
