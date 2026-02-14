interface ScenarioInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function ScenarioInput({ value, onChange }: ScenarioInputProps) {
  return (
    <div className="field">
      <label>Rate after fixed period (%)</label>
      <input
        type="number"
        step="0.1"
        min="0.1"
        max="100"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}
