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
        <ComparisonView />
      </main>
    </div>
  );
}

export default App;
