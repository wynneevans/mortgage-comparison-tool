import { useReducer, useCallback } from "react";
import type { Offer, CompareResponse } from "../types/mortgage";
import { createDefaultOffer } from "../types/mortgage";
import { compareMortgages } from "../api/mortgage";

interface State {
  loanAmount: number;
  totalTermYears: number;
  offers: Offer[];
  results: CompareResponse | null;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_LOAN_AMOUNT"; value: number }
  | { type: "SET_TOTAL_TERM"; value: number }
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
      };
    case "REMOVE_OFFER":
      if (state.offers.length <= 2) return state;
      return {
        ...state,
        offers: state.offers.filter((_, i) => i !== action.index),
      };
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { ...state, loading: false, results: action.results };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
  }
}

const initialState: State = {
  loanAmount: 250000,
  totalTermYears: 25,
  offers: [
    createDefaultOffer("2-year fix"),
    { ...createDefaultOffer("5-year fix"), fixed_term_years: 5, interest_rate: 4.5 },
  ],
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
        offers: state.offers,
      });
      dispatch({ type: "SUCCESS", results });
    } catch (e) {
      dispatch({ type: "ERROR", error: (e as Error).message });
    }
  }, [state.loanAmount, state.totalTermYears, state.offers]);

  return { state, dispatch, compare };
}
