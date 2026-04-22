"use client";

import { useState, useEffect, useEffectEvent } from "react";
import type {
  TallyTSLMapItemNoId,
  TallyBus,
  TallyColorName,
  TSL5TallyType,
} from "@atemtally/common";
import { TallyColor, tallyColorToName, tallyColorNameToTallyColor } from "@atemtally/common";
import type { MapTallyRequestBody } from "@atemtally/server";

interface MapTallyFormProps<T> {
  titleText: string;
  submitButtonText?: string;
  loading: boolean;
  initialValues?: Partial<TallyTSLMapItemNoId>;
  onCancel?: () => void;
  onSubmit: (body: MapTallyRequestBody) => Promise<T | null>;
}

const FormFieldStateDefaults = {
  inputIndex: 1,
  mixEngineIndex: 0,
  tallyColor: TallyColor.RED,
  bus: "program",
  tallyType: "lh_tally",
} as const;

function updateMapItemRequestBodyToMapTallyRequestBody(body: Partial<TallyTSLMapItemNoId>): MapTallyRequestBody {
  return {
    inputIndex: body.index ?? FormFieldStateDefaults.inputIndex,
    mixEngineIndex: body.screen ?? FormFieldStateDefaults.mixEngineIndex,
    tallyColor: body.tallyColor ?? FormFieldStateDefaults.tallyColor,
    bus: body.bus ?? FormFieldStateDefaults.bus,
    tallyType: body.tallyType ?? FormFieldStateDefaults.tallyType,
    name: body.name,
  };
}

export default function MapTallyForm<T>({ titleText, submitButtonText = "Submit", loading, initialValues, onCancel, onSubmit }: MapTallyFormProps<T>) {
  const initialUpdateBody = initialValues ? updateMapItemRequestBodyToMapTallyRequestBody(initialValues) : undefined;
  const [inputIndex, setInputIndex] = useState(initialUpdateBody?.inputIndex ?? FormFieldStateDefaults.inputIndex);
  const [mixEngineIndex, setMixEngineIndex] = useState(initialUpdateBody?.mixEngineIndex ?? FormFieldStateDefaults.mixEngineIndex);
  const [tallyColor, setTallyColor] = useState<TallyColor>(initialUpdateBody?.tallyColor ?? FormFieldStateDefaults.tallyColor);
  const [bus, setBus] = useState<TallyBus>(initialUpdateBody?.bus ?? FormFieldStateDefaults.bus);
  const [tallyType, setTallyType] = useState<TSL5TallyType>(initialUpdateBody?.tallyType ?? FormFieldStateDefaults.tallyType);
  const [name, setName] = useState(initialUpdateBody?.name ?? "");
  const [mapResult, setMapResult] = useState<T | null>(null);

  const resetStates = useEffectEvent(() => {
    setInputIndex(initialUpdateBody?.inputIndex ?? FormFieldStateDefaults.inputIndex);
    setMixEngineIndex(initialUpdateBody?.mixEngineIndex ?? FormFieldStateDefaults.mixEngineIndex);
    setTallyColor(initialUpdateBody?.tallyColor ?? FormFieldStateDefaults.tallyColor);
    setBus(initialUpdateBody?.bus ?? FormFieldStateDefaults.bus);
    setTallyType(initialUpdateBody?.tallyType ?? FormFieldStateDefaults.tallyType);
    setName(initialUpdateBody?.name ?? "");
    console.log("setTallyColor: ", initialUpdateBody?.tallyColor);
    setMapResult(null);
  });

  useEffect(() => {
    resetStates();
  }, [initialValues]);

  const hasInitialValues = initialValues !== undefined;
  const isDirty = hasInitialValues && (
    inputIndex !== initialUpdateBody?.inputIndex ||
    mixEngineIndex !== initialUpdateBody?.mixEngineIndex ||
    tallyColor !== initialUpdateBody?.tallyColor ||
    bus !== initialUpdateBody?.bus ||
    tallyType !== initialUpdateBody?.tallyType ||
    name !== initialUpdateBody?.name
  );

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setMapResult(null);
    const body: MapTallyRequestBody = {
      inputIndex,
      mixEngineIndex,
      tallyColor,
      bus,
      tallyType,
      name: name || undefined,
    };
    const result = await onSubmit(body);
    setMapResult(result);
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{titleText}</h2>
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
        <SelectField<TallyColorName>
          label="Color"
          name="tallyColor"
          value={tallyColorToName(tallyColor)}
          onChange={(v) => setTallyColor(tallyColorNameToTallyColor(v))}
          options={[
            { label: "Off", value: "OFF" },
            { label: "Red", value: "RED" },
            { label: "Green", value: "GREEN" },
            { label: "Amber", value: "AMBER" },
          ]}
        />
        <SelectField<TallyBus>
          label="Bus"
          name="bus"
          value={bus}
          onChange={setBus}
          options={[
            { label: "Program", value: "program" },
            { label: "Preview", value: "preview" },
          ]}
        />
        <SelectField<TSL5TallyType>
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
        <div className="flex gap-4">
          <SubmitField label={submitButtonText} loading={loading} disabled={hasInitialValues ? !isDirty : false} />
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
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
  disabled?: boolean;
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
        disabled={props.disabled}
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
        disabled={props.disabled}
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
        disabled={props.disabled}
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

interface SubmitFieldProps {
  label: string;
  loading: boolean;
  className?: string;
  fieldClassName?: string;
  disabled?: boolean;
}

function SubmitField(
  { label, loading, className, fieldClassName, disabled }: SubmitFieldProps
) {
  const defaultFieldClass = "rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";
  return (
    <div className={`col-span-2 ${className ?? ""}`}>
      <button
        type="submit"
        disabled={loading || disabled}
        className={`${defaultFieldClass} ${fieldClassName ?? ""}`}
      >
        {label}
      </button>
    </div>
  );
}
