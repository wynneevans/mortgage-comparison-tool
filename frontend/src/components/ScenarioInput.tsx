interface ScenarioInputProps {
  values: number[];
  onChange: (values: number[]) => void;
}

export function ScenarioInput({ values, onChange }: ScenarioInputProps) {
  const updateRate = (index: number, value: number) => {
    const updated = [...values];
    updated[index] = value;
    onChange(updated);
  };

  const removeRate = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const addRate = () => {
    onChange([...values, 5.5]);
  };

  return (
    <div className="field">
      <label>Interim rate(s) (%)</label>
      {values.map((value, i) => (
        <div key={i} style={{ display: "flex", gap: "0.25rem", marginTop: i > 0 ? "0.25rem" : 0 }}>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="100"
            value={value}
            onChange={(e) => updateRate(i, parseFloat(e.target.value) || 0)}
            style={{ flex: 1 }}
          />
          {values.length > 1 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => removeRate(i)}
              style={{ padding: "0 0.5rem" }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary"
        onClick={addRate}
        style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}
      >
        + Add interim rate
      </button>
    </div>
  );
}
