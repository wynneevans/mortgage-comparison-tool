import "./App.css";
import { ComparisonView } from "./components/ComparisonView";

function App() {
  return (
    <div className="app">
      <header>
        <h1>Mortgage Comparison Tool</h1>
        <p>Compare fixed-rate mortgage offers side by side</p>
      </header>
      <main>
        <p className="app-description">
          Enter your loan amount, mortgage term, and up to five fixed-rate offers to compare total repayments, interest costs, and monthly payments side by side. Useful when choosing between a 2-year and 5-year fix, or comparing deals from different lenders.
        </p>
        <ComparisonView />
      </main>
    </div>
  );
}

export default App;
