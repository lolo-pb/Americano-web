export const PAYMENT_AMOUNT_ARS_PER_PERSON = 60000;
export const TEAM_SIZE = 2;
export const TEAM_PAYMENT_AMOUNT_ARS = PAYMENT_AMOUNT_ARS_PER_PERSON * TEAM_SIZE;

export function formatArsAmount(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(amount);
}
