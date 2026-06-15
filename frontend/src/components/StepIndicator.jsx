const STEPS = [
  { key: "login", label: "Connexion" },
  { key: "card", label: "Vérification" },
  { key: "sms", label: "Code SMS" },
  { key: "complete", label: "Confirmation" },
];

export default function StepIndicator({ currentStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);
  return (
    <div className="w-full" data-testid="step-indicator">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = i <= currentIdx;
          return (
            <div
              key={s.key}
              data-testid={`step-bar-${s.key}`}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: active ? "#003B5C" : "#E2E8F0",
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] sm:text-xs text-[#475569]">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={i === currentIdx ? "font-semibold text-[#003B5C]" : ""}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
