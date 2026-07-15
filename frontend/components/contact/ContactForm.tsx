"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError, submitLead, type LeadResult } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { SERVICES, INDUSTRIES } from "@/lib/content";
import { cn } from "@/lib/cn";

const schema = z.object({
  full_name: z.string().min(1, "Please enter your name").max(255),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().max(20).optional().or(z.literal("")),
  company_name: z.string().max(255).optional().or(z.literal("")),
  service: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  message: z.string().max(5000).optional().or(z.literal("")),
  origin_city: z.string().max(100).optional().or(z.literal("")),
  destination_city: z.string().max(100).optional().or(z.literal("")),
  weight_kg: z.coerce.number().positive("Weight must be positive").max(50000).optional().or(z.literal("")),
  shipment_type: z.enum(["ftl", "ltl", "express", "last_mile"]).default("ltl"),
});

type FormValues = z.input<typeof schema>;

const inputCls =
  "glass w-full rounded-[10px] px-4 py-3 text-sm placeholder:text-ink-3 focus:border-accent";
const labelCls = "mb-1.5 block text-sm font-medium text-ink-2";

export function ContactForm() {
  const params = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      service: params.get("service") ?? "",
      industry: params.get("industry") ?? "",
      shipment_type: "ltl",
    },
  });

  const mutation = useMutation<LeadResult, Error, FormValues>({
    mutationFn: (values) =>
      submitLead({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || undefined,
        company_name: values.company_name || undefined,
        message: values.message || undefined,
        service: values.service || undefined,
        industry: values.industry || undefined,
        origin_city: values.origin_city || undefined,
        destination_city: values.destination_city || undefined,
        weight_kg: values.weight_kg ? Number(values.weight_kg) : undefined,
        shipment_type: values.shipment_type,
      }),
  });

  if (mutation.isSuccess) {
    const quote = mutation.data.quote;
    return (
      <GlassCard className="p-8 md:p-10">
        <h2 className="font-display text-2xl font-semibold">Request received ✓</h2>
        <p className="mt-2 text-ink-2">
          Thanks, {mutation.data.full_name.split(" ")[0]} — our team will get back to you within one
          business day at {mutation.data.email}.
        </p>
        {quote && (
          <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-6">
            <p className="eyebrow">AI-estimated indicative range</p>
            <p className="mt-2 font-display text-3xl font-semibold">
              ₹{quote.price_min.toLocaleString("en-IN")} – ₹{quote.price_max.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {quote.origin_city} → {quote.destination_city} · ~{Math.round(quote.distance_km)} km
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-3">{quote.disclaimer}</p>
          </div>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 md:p-10">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="full_name" className={labelCls}>
              Full name *
            </label>
            <input id="full_name" {...register("full_name")} className={inputCls} placeholder="Priya Sharma" />
            {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Work email *
            </label>
            <input id="email" type="email" {...register("email")} className={inputCls} placeholder="priya@company.in" />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>
              Phone
            </label>
            <input id="phone" {...register("phone")} className={inputCls} placeholder="+91 98xxx xxxxx" />
          </div>
          <div>
            <label htmlFor="company_name" className={labelCls}>
              Company
            </label>
            <input id="company_name" {...register("company_name")} className={inputCls} placeholder="Company Pvt Ltd" />
          </div>
          <div>
            <label htmlFor="service" className={labelCls}>
              Service
            </label>
            <select id="service" {...register("service")} className={cn(inputCls, "appearance-none")}>
              <option value="">Select a service…</option>
              {SERVICES.map((s) => (
                <option key={s.slug} value={s.title}>
                  {s.title}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="industry" className={labelCls}>
              Industry
            </label>
            <select id="industry" {...register("industry")} className={cn(inputCls, "appearance-none")}>
              <option value="">Select an industry…</option>
              {INDUSTRIES.map((s) => (
                <option key={s.slug} value={s.title}>
                  {s.title}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <fieldset className="mt-8 rounded-2xl border border-line p-5">
          <legend className="eyebrow px-2">Optional — get an instant AI estimate</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="origin_city" className={labelCls}>
                From city
              </label>
              <input id="origin_city" {...register("origin_city")} className={inputCls} placeholder="Mumbai" />
            </div>
            <div>
              <label htmlFor="destination_city" className={labelCls}>
                To city
              </label>
              <input id="destination_city" {...register("destination_city")} className={inputCls} placeholder="Delhi" />
            </div>
            <div>
              <label htmlFor="weight_kg" className={labelCls}>
                Approx. weight (kg)
              </label>
              <input id="weight_kg" type="number" min="1" {...register("weight_kg")} className={inputCls} placeholder="500" />
              {errors.weight_kg && <p className="mt-1 text-xs text-danger">{errors.weight_kg.message}</p>}
            </div>
            <div>
              <label htmlFor="shipment_type" className={labelCls}>
                Shipment type
              </label>
              <select id="shipment_type" {...register("shipment_type")} className={cn(inputCls, "appearance-none")}>
                <option value="ltl">Part load (LTL)</option>
                <option value="ftl">Full truckload (FTL)</option>
                <option value="express">Express</option>
                <option value="last_mile">Last-mile distribution</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div className="mt-6">
          <label htmlFor="message" className={labelCls}>
            Your requirement
          </label>
          <textarea
            id="message"
            rows={4}
            {...register("message")}
            className={inputCls}
            placeholder="Lanes, volumes, frequency — anything that helps us quote accurately."
          />
        </div>

        {mutation.isError && (
          <p className="mt-4 text-sm text-danger">
            {mutation.error instanceof ApiError && mutation.error.status === 429
              ? "Too many requests — please wait a minute and try again."
              : "Something went wrong submitting your request. Please try again."}
          </p>
        )}

        <p className="mt-6 text-xs leading-relaxed text-ink-3">
          By submitting, you consent to NKP Logistics processing these details to respond to your
          enquiry, per our Privacy Policy (DPDP Act 2023).
        </p>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-5 w-full rounded-[10px] bg-accent px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
        >
          {mutation.isPending ? "Submitting…" : "Request a Quote"}
        </button>
      </form>
    </GlassCard>
  );
}
