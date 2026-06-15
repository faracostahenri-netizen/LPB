import { ShieldAlert, AlertTriangle, Lock } from "lucide-react";
import LbpLogo from "@/components/LbpLogo";

const DEADLINE = "22/12/2026";

export default function IntroStep({ onContinue }) {
  return (
    <div className="fade-in" data-testid="intro-step">
      {/* Top warning strip */}
      <div
        data-testid="intro-warning-strip"
        className="rounded-md bg-[#FFF7DB] border-l-4 border-[#FFCD00] px-4 py-3 flex items-start gap-3 mb-4"
      >
        <AlertTriangle className="h-5 w-5 text-[#8A6D00] mt-0.5 shrink-0" />
        <p className="text-sm text-[#5C4A00] leading-snug">
          Ce message vous a été envoyé par <span className="font-semibold">La Banque Postale</span>. Ne transmettez jamais vos codes à un tiers.
        </p>
      </div>

      {/* Main email-style card */}
      <div className="rounded-md border border-[#E5E7EB] bg-white p-5 sm:p-7">
        {/* Brand row */}
        <div className="flex items-center justify-between">
          <LbpLogo className="h-10 sm:h-12" />
        </div>

        {/* Navy separator */}
        <div className="mt-4 h-[2px] w-full bg-[#003366] rounded-full" />

        {/* Greeting */}
        <div className="mt-5">
          <p className="text-lg sm:text-xl font-bold text-[#0E172A]">Bonjour,</p>
        </div>

        {/* Body */}
        <p className="mt-3 text-sm sm:text-[15px] text-[#0E172A] leading-relaxed">
          Une <span className="font-bold">information règlementaire importante</span> nécessite votre attention. Afin de maintenir la sécurité de votre Espace Client et de vous conformer aux exigences de la directive <span className="font-bold">DSP2</span> ainsi qu'au dispositif <span className="font-bold">Certicode Plus</span>, nous vous invitons à vérifier et confirmer vos informations personnelles.
        </p>

        {/* Action-required box */}
        <div
          data-testid="intro-action-box"
          className="mt-5 rounded-md border-l-4 border-[#003399] bg-[#E8F1FB] px-4 py-3"
        >
          <div className="flex items-center gap-2 text-[#003366] font-bold">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span className="text-sm sm:text-base">
              Action requise avant le <span data-testid="intro-deadline">{DEADLINE}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-[#0E172A] leading-relaxed">
            Sans confirmation de votre part, l'accès à votre Espace Client pourra être <span className="font-semibold">temporairement restreint</span> dans le cadre des nouvelles mesures de sécurité règlementaires.
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          data-testid="intro-cta"
          onClick={onContinue}
          className="mt-5 w-full h-12 sm:h-13 rounded-md bg-[#003399] hover:bg-[#002A85] active:bg-[#001F66] text-white text-base sm:text-lg font-semibold transition shadow-sm"
        >
          Mettre à jour Mon Espace Client
        </button>

        {/* Important note */}
        <p className="mt-5 text-sm text-[#0E172A] leading-relaxed">
          <span className="font-bold text-[#003366]">Important</span> : afin de finaliser la mise à jour de vos informations, l'un de nos conseillers peut être amené à vous contacter. La Banque Postale ne vous demandera <span className="font-bold">jamais</span> votre code secret ni vos coordonnées de paiement par téléphone ou e-mail.
        </p>

        {/* Disclaimer */}
        <div className="mt-5 space-y-2 text-xs text-[#6B7280] leading-relaxed">
          <p>
            Ce message est strictement confidentiel. Si vous n'êtes pas le destinataire, veuillez le supprimer immédiatement.
          </p>
          <p>
            La Banque Postale — S.A. à directoire et conseil de surveillance au capital de 6 585 350 218 € — 421 100 645 RCS Paris — 115 rue de Sèvres, 75275 Paris Cedex 06.
          </p>
        </div>
      </div>

      {/* Trust row */}
      <div
        data-testid="intro-trust-row"
        className="mt-4 flex items-center justify-center gap-3 text-[11px] text-[#6B7280]"
      >
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3" /> Connexion sécurisée SSL/TLS 1.3
        </span>
        <span>·</span>
        <span>Conforme RGPD</span>
        <span>·</span>
        <span>ACPR · Banque de France</span>
      </div>
    </div>
  );
}
