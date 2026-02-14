export interface Offer {
  label: string;
  interest_rate: number;
  fixed_term_years: number;
  mortgage_type: "repayment" | "interest_only";
  scenario_rates: number[];
}

export interface CompareRequest {
  loan_amount: number;
  total_term_years: number;
  offers: Offer[];
}

export interface MonthlyDataPoint {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining_balance: number;
  annual_rate: number;
  is_fixed_period: boolean;
}

export interface OfferResult {
  label: string;
  schedule: MonthlyDataPoint[];
  total_paid: number;
  total_interest: number;
  total_principal: number;
}

export interface CompareResponse {
  results: OfferResult[];
}

export function createDefaultOffer(label: string): Offer {
  return {
    label,
    interest_rate: 4.0,
    fixed_term_years: 2,
    mortgage_type: "repayment",
    scenario_rates: [5.5],
  };
}
