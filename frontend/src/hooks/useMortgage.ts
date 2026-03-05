import { useReducer, useCallback } from "react";
import type { Offer, CompareResponse, OfferResult } from "../types/mortgage";
import { createDefaultOffer } from "../types/mortgage";
import { compareMortgages } from "../api/mortgage";
import { COLORS, nextColor } from "../utils/colors";

interface ResultsState {
  results: OfferResult[];
  colors: string[];
}

interface State {
  loanAmount: number;
  totalTermYears: number;
  futureRate: number;
  offers: Offer[];
  offerIds: string[];
  offerColors: string[];
  results: ResultsState | null;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_LOAN_AMOUNT"; value: number }
  | { type: "SET_TOTAL_TERM"; value: number }
  | { type: "SET_FUTURE_RATE"; value: number }
  | { type: "UPDATE_OFFER"; index: number; offer: Offer }
  | { type: "ADD_OFFER" }
  | { type: "REMOVE_OFFER"; index: number }
  | { type: "LOADING" }
  | { type: "SUCCESS"; results: CompareResponse }
  | { type: "ERROR"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOAN_AMOUNT":
      return { ...state, loanAmount: action.value };
    case "SET_TOTAL_TERM":
      return { ...state, totalTermYears: action.value };
    case "SET_FUTURE_RATE":
      return { ...state, futureRate: action.value };
    case "UPDATE_OFFER": {
      const offers = [...state.offers];
      offers[action.index] = action.offer;
      return { ...state, offers };
    }
    case "ADD_OFFER":
      if (state.offers.length >= 5) return state;
      return {
        ...state,
        offers: [
          ...state.offers,
          createDefaultOffer(`Offer ${state.offers.length + 1}`),
        ],
        offerIds: [...state.offerIds, crypto.randomUUID()],
        offerColors: [...state.offerColors, nextColor(state.offerColors)],
      };
    case "REMOVE_OFFER":
      if (state.offers.length <= 2) return state;
      return {
        ...state,
        offers: state.offers.filter((_, i) => i !== action.index),
        offerIds: state.offerIds.filter((_, i) => i !== action.index),
        offerColors: state.offerColors.filter((_, i) => i !== action.index),
        results: state.results
          ? {
              results: state.results.results.filter((_, i) => i !== action.index),
              colors: state.results.colors.filter((_, i) => i !== action.index),
            }
          : null,
      };
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return {
        ...state,
        loading: false,
        results: { results: action.results.results, colors: state.offerColors },
      };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
  }
}

const initialState: State = {
  loanAmount: 250000,
  totalTermYears: 25,
  futureRate: 5.5,
  offers: [
    createDefaultOffer("2-year fix"),
    { ...createDefaultOffer("5-year fix"), fixed_term_years: 5, interest_rate: 4.5 },
  ],
  offerIds: [crypto.randomUUID(), crypto.randomUUID()],
  offerColors: [COLORS[0], COLORS[1]],
  results: null,
  loading: false,
  error: null,
};

export function useMortgage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const compare = useCallback(async () => {
    dispatch({ type: "LOADING" });
    try {
      const results = await compareMortgages({
        loan_amount: state.loanAmount,
        total_term_years: state.totalTermYears,
        future_rate: state.futureRate,
        offers: state.offers,
      });
      dispatch({ type: "SUCCESS", results });
    } catch (e) {
      dispatch({ type: "ERROR", error: e instanceof Error ? e.message : String(e) });
    }
  }, [state.loanAmount, state.totalTermYears, state.futureRate, state.offers]);

  return { state, dispatch, compare };
}
