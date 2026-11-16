import { useState } from "react";
import { Search } from "lucide-react";
import { validId } from "../../utils/format";
export function StudentPicker({
  onSelect,
  initialValue = "",
  label = "Consultar estudiante",
}: {
  onSelect: (id: number) => void;
  initialValue?: string;
  label?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(false);
  return (
    <form
      className="student-picker"
      onSubmit={(event) => {
        event.preventDefault();
        if (!validId(value)) {
          setError(true);
          return;
        }
        setError(false);
        onSelect(Number(value));
      }}
    >
      <div>
        <label htmlFor="student-id">ID de estudiante</label>
        <div className="input-icon">
          <Search size={17} />
          <input
            id="student-id"
            inputMode="numeric"
            value={value}
            placeholder="Ej. 1"
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={error}
            aria-describedby={error ? "id-error" : undefined}
          />
        </div>
      </div>
      <button className="btn" type="submit">
        {label}
      </button>
      {error && (
        <p id="id-error" role="alert" className="text-red-700">
          Ingresa un ID entero positivo.
        </p>
      )}
    </form>
  );
}
