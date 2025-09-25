import { Controller } from "react-hook-form";
import ReactSelect from "react-select";

type Option = { label: string; value: string };

interface FormMultiSelectProps {
  name: string;
  control: any;
  options: Option[];
  label?: string;
  placeholder?: string;
}

export function MultiSelect({
  name,
  control,
  options,
  label,
  placeholder,
}: FormMultiSelectProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="space-y-2">
          {label && <label className="text-sm font-medium">{label}</label>}
          <ReactSelect
            isMulti
            options={options}
            value={(field.value || []).map((val: string) => {
              const match = options.find((opt) => opt.value === val);
              return match || { label: val, value: val };
            })}
            onChange={(selected) =>
              field.onChange(selected.map((s: any) => s.value))
            }
            placeholder={placeholder}
          />
        </div>
      )}
    />
  );
}
