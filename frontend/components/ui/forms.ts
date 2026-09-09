/**
 * Shared form field styles.
 *
 * Previously this exact string was duplicated verbatim in four files
 * (ai/Primitives, site/RaiseQueryForm, site/WarehousingLeadForm,
 * auth/LoginForm), so any change to field styling had to be made four times.
 */

export const inputCls =
  "w-full rounded-sm border border-line-strong bg-paper px-4 py-3 text-sm text-ink " +
  "placeholder:text-ink-3 transition-colors focus:border-ink focus:outline-none";

export const labelCls = "mb-2 block text-[12.5px] font-medium text-ink-2";

export const errorCls = "mt-1.5 block text-[12px] text-danger";
