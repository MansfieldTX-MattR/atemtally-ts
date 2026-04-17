"use client";

import { useState } from "react";
import type {
  MapTallyRequestBody,
  TallyTSLMapItem,
  TallyBus,
  TSL5TallyType,
} from "@atemtally/common";
import { TallyColor } from "@atemtally/common";

interface MapTallyFormProps {
  loading: boolean;
  onSubmit: (body: MapTallyRequestBody) => Promise<TallyTSLMapItem | null>;
}

export default function MapTallyForm({ loading, onSubmit }: MapTallyFormProps) {
  const [inputIndex, setInputIndex] = useState(1);
  const [mixEngineIndex, setMixEngineIndex] = useState(0);
  const [color, setColor] = useState<TallyColor>(TallyColor.RED);
  const [bus, setBus] = useState<TallyBus>("program");
  const [tallyType, setTallyType] = useState<TSL5TallyType>("rh_tally");
  const [name, setName] = useState("");
  const [mapResult, setMapResult] = useState<TallyTSLMapItem | null>(null);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setMapResult(null);
    const body: MapTallyRequestBody = {
      inputIndex,
      mixEngineIndex,
      color,
      bus,
      tallyType,
      name: name || undefined,
    };
    const result = await onSubmit(body);
    setMapResult(result);
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Map Tally to TSL</h2>
      <form onSubmit={(e) => { handleSubmit(e).catch(console.error); }} className="grid grid-cols-2 gap-4 max-w-lg">
        <NumberField
          label="Input Index"
          name="inputIndex"
          value={inputIndex}
          onChange={setInputIndex}
        />
        <NumberField
          label="Mix Engine Index"
          name="mixEngineIndex"
          value={mixEngineIndex}
          onChange={setMixEngineIndex}
        />
        <SelectField
          label="Color"
          name="color"
          value={color}
          onChange={setColor}
          options={[
            { label: "Off", value: TallyColor.OFF },
            { label: "Red", value: TallyColor.RED },
            { label: "Green", value: TallyColor.GREEN },
            { label: "Amber", value: TallyColor.AMBER },
          ]}
        />
        <SelectField
          label="Bus"
          name="bus"
          value={bus}
          onChange={setBus}
          options={[
            { label: "Program", value: "program" },
            { label: "Preview", value: "preview" },
          ]}
        />
        <SelectField
          label="Tally Type"
          name="tallyType"
          value={tallyType}
          onChange={setTallyType}
          options={[
            { label: "RH Tally", value: "rh_tally" },
            { label: "LH Tally", value: "lh_tally" },
            { label: "Text Tally", value: "text_tally" },
          ]}
        />
        <TextField
          label="Name (optional)"
          name="name"
          value={name}
          onChange={setName}
        />
        <SubmitField label="Map Tally" loading={loading} />
      </form>
      {mapResult && (
        <pre className="mt-4 rounded bg-zinc-100 p-4 text-sm overflow-x-auto dark:bg-zinc-800">
          {JSON.stringify(mapResult, null, 2)}
        </pre>
      )}
    </section>
  );
}


interface FormFieldProps<T> {
  label: string;
  name: string;
  value: T;
  onChange: (v: T) => void;
  children?: React.ReactNode;
  className?: string;
  fieldClassName?: string;
}

const FormFieldDefaults = {
  className: "flex flex-col gap-1",
  fieldClassName: "rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800",
};

function FormField<T> ({ label, children, className }: FormFieldProps<T>) {
  return (
    <label className={`${FormFieldDefaults.className} ${className ?? ""}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function TextField(props: FormFieldProps<string>) {
  return (
    <FormField {...props} >
      <input
        type="text"
        name={props.name}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={`${FormFieldDefaults.fieldClassName} ${props.fieldClassName ?? ""}`}
      />
    </FormField>
  );
}

function NumberField<T extends number>(props: FormFieldProps<T>) {
  return (
    <FormField {...props} >
      <input
        type="number"
        name={props.name}
        value={props.value}
        onChange={(e) => props.onChange(typeof props.value === "number" ? Number(e.target.value) as T : (e.target.value as unknown as T))}
        className={`${FormFieldDefaults.fieldClassName} ${props.fieldClassName ?? ""}`}
      />
    </FormField>
  );
}

interface SelectFieldOption<T> {
  label: string;
  value: T;
}

interface SelectFieldProps<T extends string | number> extends FormFieldProps<T> {
  options: SelectFieldOption<T>[];
}

function SelectField<T extends string | number> (props: SelectFieldProps<T>) {
  return (
    <FormField {...props} >
      <select
        name={props.name}
        value={String(props.value)}
        onChange={(e) => props.onChange(e.target.value as unknown as T)}
        className={`${FormFieldDefaults.fieldClassName} ${props.fieldClassName ?? ""}`}
      >
        {props.options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}


function SubmitField(
  { label, loading, className, fieldClassName }:
  { label: string; loading: boolean; className?: string; fieldClassName?: string }
) {
  const defaultFieldClass = "rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";
  return (
    <div className={`col-span-2 ${className ?? ""}`}>
      <button
        type="submit"
        disabled={loading}
        className={`${defaultFieldClass} ${fieldClassName ?? ""}`}
      >
        {label}
      </button>
    </div>
  );
}
