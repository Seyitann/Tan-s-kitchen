import { Check } from "lucide-react";
import { statusLabel } from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/orderStatus";

// A row of steps showing how far along an order is.
// Delivery orders end with "On the way", pickup orders with "Ready for pickup".
export default function StatusSteps({
  status,
  fulfilment,
}: {
  status: OrderStatus;
  fulfilment: "delivery" | "pickup";
}) {
  const steps: OrderStatus[] = [
    "received",
    "preparing",
    fulfilment === "delivery" ? "on_the_way" : "ready",
    "completed",
  ];
  const current = steps.indexOf(status);
  // Cancelled orders and orders waiting for payment have no steps to show
  if (current === -1) return null;

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {steps.map((step, i) => (
        <li key={step} className="flex flex-1 items-start last:flex-none">
          <div className="flex w-16 flex-col items-center text-center">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold ${
                i <= current ? "bg-orange-500 text-white" : "bg-stone-800 text-stone-500"
              }`}
            >
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={`mt-1 text-[10px] leading-tight ${
                i === current ? "font-bold text-orange-300" : i < current ? "text-stone-300" : "text-stone-500"
              }`}
            >
              {statusLabel[step]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span
              className={`mt-3 h-0.5 flex-1 ${i < current ? "bg-orange-500" : "bg-stone-800"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}