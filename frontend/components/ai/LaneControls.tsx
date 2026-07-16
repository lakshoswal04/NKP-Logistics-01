"use client";

import { CITIES } from "@/lib/cities";
import { inputCls, labelCls } from "@/components/ai/Primitives";

export interface LaneState {
  origin_city: string;
  destination_city: string;
  shipment_type: string;
  weight_kg: number;
}

export function LaneControls({
  value,
  onChange,
  idPrefix,
}: {
  value: LaneState;
  onChange: (v: LaneState) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor={`${idPrefix}-origin`} className={labelCls}>
          From
        </label>
        <select
          id={`${idPrefix}-origin`}
          className={inputCls}
          value={value.origin_city}
          onChange={(e) => onChange({ ...value, origin_city: e.target.value })}
        >
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-dest`} className={labelCls}>
          To
        </label>
        <select
          id={`${idPrefix}-dest`}
          className={inputCls}
          value={value.destination_city}
          onChange={(e) => onChange({ ...value, destination_city: e.target.value })}
        >
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-type`} className={labelCls}>
          Type
        </label>
        <select
          id={`${idPrefix}-type`}
          className={inputCls}
          value={value.shipment_type}
          onChange={(e) => onChange({ ...value, shipment_type: e.target.value })}
        >
          <option value="ftl">Full truckload</option>
          <option value="ltl">Part load</option>
          <option value="express">Express</option>
          <option value="last_mile">Last-mile</option>
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-weight`} className={labelCls}>
          Weight (kg)
        </label>
        <input
          id={`${idPrefix}-weight`}
          type="number"
          min={1}
          max={50000}
          className={inputCls}
          value={value.weight_kg}
          onChange={(e) => onChange({ ...value, weight_kg: Number(e.target.value) || 1 })}
        />
      </div>
    </div>
  );
}
