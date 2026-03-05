import { useState } from "react";

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: string;
  min?: number;
  max?: number;
  integer?: boolean;
}

export function NumericInput({ value, onChange, step, min, max, integer = false }: NumericInputProps) {
  const [display, setDisplay] = useState(String(value));

  const parse = (s: string) => (integer ? parseInt(s, 10) : parseFloat(s));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);
    const parsed = parse(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parse(display);
    if (isNaN(parsed)) {
      setDisplay(String(value)); // restore last valid value
    } else {
      setDisplay(String(parsed)); // normalise trailing dot e.g. "5." → "5"
    }
  };

  return (
    <input
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      step={step}
      min={min}
      max={max}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
