import { Loader2, ShieldCheck } from "lucide-react";

export default function VerifyingStep() {
  return (
    <div className="fade-in text-center py-10 sm:py-14" data-testid="verifying-step">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F1FB] mb-5">
        <Loader2 className="h-8 w-8 text-[#003366] animate-spin" />
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-[#003366]">
        Vérification de vos informations en cours…
      </h2>
      <p className="mt-2 text-sm text-[#4F5A6B]">
        Veuillez patienter quelques instants, ne fermez pas cette fenêtre.
      </p>

      {/* Progress shimmer bar */}
      <div className="mt-6 mx-auto h-1 w-48 sm:w-64 overflow-hidden rounded-full bg-[#E8ECF1]">
        <div
          className="h-full w-1/3 rounded-full bg-[#003399]"
          style={{ animation: "verifySlide 1.4s ease-in-out infinite" }}
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#7A8294]">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Connexion sécurisée · Données chiffrées</span>
      </div>

      <style>{`
        @keyframes verifySlide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(120%); }
          100% { transform: translateX(360%); }
        }
      `}</style>
    </div>
  );
}
