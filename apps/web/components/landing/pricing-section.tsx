"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "The full social app",
    features: [
      "Unlimited trips on your map",
      "Followers, feed & discovery",
      "Travel passport & stamps",
      "Save to bucket list",
      "Public profile page",
    ],
    cta: "Start your map",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For creators & nomads",
    features: [
      "Everything in Free",
      "Premium map themes",
      "Exclusive profile layouts",
      "Watermark-free recap exports",
      "Priority profile in discovery",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Creator",
    price: "$19",
    period: "/month",
    description: "Build a travel audience",
    features: [
      "Everything in Pro",
      "Sell itineraries & guides",
      "Audience & growth analytics",
      "Custom profile domain",
      "Early access to new features",
    ],
    cta: "Become a Creator",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-secondary-800 text-white ring-4 ring-primary-500/20"
                  : "bg-surface border border-border"
              }`}
            >
              <div className="mb-6">
                <h3 className={`font-heading text-xl font-semibold ${plan.highlighted ? "text-white" : "text-text-primary"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? "text-white/60" : "text-text-tertiary"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-text-primary"}`}>
                  {plan.price}
                </span>
                <span className={plan.highlighted ? "text-white/60" : "text-text-tertiary"}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-primary-400" : "text-primary-500"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-white/80" : "text-text-secondary"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <SignInButton mode="modal">
                <Button
                  variant={plan.highlighted ? "primary" : "outline"}
                  fullWidth
                  className={plan.highlighted ? "bg-primary-500 hover:bg-primary-600" : ""}
                >
                  {plan.cta}
                </Button>
              </SignInButton>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
