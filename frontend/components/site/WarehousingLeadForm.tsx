"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/forms";
import { submitLead } from "@/lib/api";

const FC_LOCATIONS = [
  "Bhiwandi (Mumbai)",
  "Hoskote (Bengaluru)",
  "Gurugram (Delhi NCR)",
  "Sriperumbudur (Chennai)",
  "Bhiwandi + Hoskote",
  "Not sure yet — advise me",
] as const;

const schema = z.object({
  full_name: z.string().min(2, "Please enter your name").max(120),
  company_name: z.string().min(2, "Please enter your company").max(160),
  email: z.email("Please enter a valid email address"),
  phone: z
    .string()
    .min(8, "Please enter a contact number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Digits, spaces and + - ( ) only"),
  fc_location: z.string().min(1, "Please choose a location"),
  message: z.string().max(1200).optional(),
});

type FormValues = z.infer<typeof schema>;

/**
 * Warehousing enquiry form.
 *
 * Fields mirror what a fulfilment sales desk actually needs to respond — the
 * preferred FC location matters more than a generic "how did you hear about us",
 * because it determines which regional team picks the enquiry up.
 */
export function WarehousingLeadForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fc_location: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      submitLead({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        company_name: values.company_name,
        service: "Warehousing",
        industry: `Preferred FC: ${values.fc_location}`,
        message: values.message || undefined,
      }),
  });

  if (mutation.isSuccess) {
    return (
      <div className="rounded-2xl bg-mist p-8">
        <span className="block size-10 rounded-lg bg-success" aria-hidden />
        <h3 className="mt-5 font-display text-[21px] font-bold text-ink">Enquiry received</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          Reference <span className="font-semibold text-ink">#{mutation.data.id}</span>. A
          confirmation is on its way to your inbox, and someone from the fulfilment team will be in
          touch within one working day.
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
      <h3 className="font-display text-[19px] font-bold text-ink">Contact us</h3>
      <p className="mt-1.5 text-[13px] text-ink-3">We&rsquo;ll get in touch with you.</p>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="Name" error={errors.full_name?.message}>
          <input {...register("full_name")} className={inputCls} autoComplete="name" />
        </Field>
        <Field label="Company name" error={errors.company_name?.message}>
          <input {...register("company_name")} className={inputCls} autoComplete="organization" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} type="email" className={inputCls} autoComplete="email" />
        </Field>
        <Field label="Phone number" error={errors.phone?.message}>
          <input {...register("phone")} type="tel" className={inputCls} autoComplete="tel" />
        </Field>
        <Field label="Preferred fulfilment centre" error={errors.fc_location?.message}>
          <select {...register("fc_location")} className={inputCls}>
            <option value="">Select a location</option>
            {FC_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Anything else?" optional error={errors.message?.message}>
          <textarea
            {...register("message")}
            rows={3}
            placeholder="SKU count, monthly order volume, where your customers are…"
            className={`${inputCls} resize-y`}
          />
        </Field>
      </div>

      {mutation.isError && (
        <p role="alert" className="mt-4 border-l-2 border-danger bg-danger-soft p-3 text-[13px] text-danger">
          We couldn&rsquo;t submit that just now. Please try again, or email{" "}
          <a href="mailto:sales@nkplogistics.in" className="underline">
            sales@nkplogistics.in
          </a>
          .
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full" size="lg">
        {mutation.isPending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}


function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
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
