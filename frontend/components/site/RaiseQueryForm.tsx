"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/forms";
import { createTicket } from "@/lib/api";
import { SUPPORT_QUERY_CATEGORIES } from "@/lib/content";

const schema = z.object({
  category: z.string().min(1, "Please choose a category"),
  subject: z.string().min(4, "Give it a short subject").max(200),
  body: z.string().min(10, "A little more detail helps us route this").max(4000),
  full_name: z.string().max(160).optional(),
  email: z.email("Please enter a valid email address"),
  phone: z.string().max(20).optional(),
  tracking_id: z.string().max(20).optional(),
});

type FormValues = z.infer<typeof schema>;

export function RaiseQueryForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { category: "" } });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createTicket({
        category: values.category,
        subject: values.subject,
        body: values.body,
        email: values.email,
        full_name: values.full_name || undefined,
        phone: values.phone || undefined,
        tracking_id: values.tracking_id || undefined,
      }),
  });

  if (mutation.isSuccess) {
    return (
      <div className="rounded-2xl bg-mist p-8">
        <span className="block size-10 rounded-lg bg-success" aria-hidden />
        <h3 className="mt-5 font-display text-[21px] font-bold text-ink">Query logged</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          Your reference is{" "}
          <span className="font-display text-[16px] font-bold text-ink">
            {mutation.data.ticket_id}
          </span>
          . We&rsquo;ve emailed a copy to you — quote that reference on any follow-up.
        </p>
        <p className="mt-3 text-[13px] text-ink-3">
          Support desks respond within one working day. Shipment queries flagged as delivery issues
          are picked up the same day.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="rounded-2xl bg-mist p-7 sm:p-8"
    >
      <h3 className="font-display text-[19px] font-bold text-ink">Raise a query</h3>
      <p className="mt-1.5 text-[13px] text-ink-3">
        No sign-in needed. You&rsquo;ll get a reference by email straight away.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="What is this about?" error={errors.category?.message} className="sm:col-span-2">
          <select {...register("category")} className={inputCls}>
            <option value="">Select a category</option>
            {SUPPORT_QUERY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Your name" optional error={errors.full_name?.message}>
          <input {...register("full_name")} className={inputCls} autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} type="email" className={inputCls} autoComplete="email" />
        </Field>
        <Field label="Phone" optional error={errors.phone?.message}>
          <input {...register("phone")} type="tel" className={inputCls} autoComplete="tel" />
        </Field>
        <Field label="AWB / LRN" optional error={errors.tracking_id?.message}>
          <input {...register("tracking_id")} className={inputCls} placeholder="NKP2026A1B2" />
        </Field>
        <Field label="Subject" error={errors.subject?.message} className="sm:col-span-2">
          <input {...register("subject")} className={inputCls} />
        </Field>
        <Field label="Tell us what happened" error={errors.body?.message} className="sm:col-span-2">
          <textarea {...register("body")} rows={5} className={`${inputCls} resize-y`} />
        </Field>
      </div>

      {mutation.isError && (
        <p role="alert" className="mt-4 border-l-2 border-danger bg-danger-soft p-3 text-[13px] text-danger">
          We couldn&rsquo;t log that just now. Please try again, or email support@nkplogistics.in
          directly.
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="mt-6" size="lg">
        {mutation.isPending ? "Submitting…" : "Submit query"}
      </Button>
    </form>
  );
}


function Field({
  label,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-3">(optional)</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-[12px] text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
