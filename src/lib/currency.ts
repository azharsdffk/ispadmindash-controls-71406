export type Currency = "IQD" | "USD";

export const currencySymbols: Record<Currency, string> = {
  IQD: "د.ع",
  USD: "$",
};

export const currencyNames: Record<Currency, string> = {
  IQD: "دينار عراقي",
  USD: "دولار أمريكي",
};

export function formatCurrency(amount: number, currency: Currency = "IQD"): string {
  return `${amount.toLocaleString()} ${currencySymbols[currency]}`;
}

export function getCurrencyLabel(currency: Currency): string {
  return `${currencyNames[currency]} (${currencySymbols[currency]})`;
}
