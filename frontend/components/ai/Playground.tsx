"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchModelMetrics } from "@/lib/aiApi";
import { CopilotModule } from "@/components/ai/CopilotModule";
import { DelayModule } from "@/components/ai/DelayModule";
import { EtaModule } from "@/components/ai/EtaModule";
import { ForecastModule } from "@/components/ai/ForecastModule";
import { FraudModule } from "@/components/ai/FraudModule";
import { RouteModule } from "@/components/ai/RouteModule";

/**
 * The six AI features, live. Model-accuracy badges come from /ai/models —
 * real held-out evaluation metrics, not marketing numbers.
 */
export function Playground() {
  const metrics = useQuery({ queryKey: ["ai-models"], queryFn: fetchModelMetrics });
  const m = metrics.data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <RouteModule badge="OR-Tools solver" />
      <EtaModule badge={m ? `R² ${m.eta.r2.toFixed(2)} · ±${m.eta.mae_hours}h MAE` : undefined} />
      <DelayModule badge={m ? `AUC ${m.delay.roc_auc.toFixed(2)}` : undefined} />
      <FraudModule badge={m ? `AUC ${m.fraud.roc_auc.toFixed(2)}` : undefined} />
      <ForecastModule badge={m ? `${(m.forecast.mape_mean * 100).toFixed(0)}% MAPE` : undefined} />
      <CopilotModule badge="live platform data" />
    </div>
  );
}
