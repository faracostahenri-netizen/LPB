import { Shield, Lock, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer
      data-testid="lbp-footer"
      className="mt-12 border-t border-[#E2E8F0] bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-[#475569]">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 mt-0.5 text-[#003B5C]" />
            <div>
              <div className="font-semibold text-[#003B5C]">Connexion sécurisée SSL</div>
              <div>Chiffrement bout-en-bout de vos données.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 mt-0.5 text-[#003B5C]" />
            <div>
              <div className="font-semibold text-[#003B5C]">Protection des données</div>
              <div>Conforme au RGPD - Banque de France certifié.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 mt-0.5 text-[#003B5C]" />
            <div>
              <div className="font-semibold text-[#003B5C]">Service client</div>
              <div>3639 - du lundi au samedi de 8h à 20h</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#64748B]">
          <a href="#" className="hover:underline">Mentions légales</a>
          <a href="#" className="hover:underline">Conditions générales</a>
          <a href="#" className="hover:underline">Politique de confidentialité</a>
          <a href="#" className="hover:underline">Cookies</a>
          <a href="#" className="hover:underline">Accessibilité</a>
        </div>

        <div className="mt-6 border-t border-[#E2E8F0] pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} La Banque Postale - SA à directoire et conseil de surveillance au capital de 6 585 350 218 €
          </p>
          <p
            data-testid="redteam-disclosure"
            className="text-[10px] uppercase tracking-wide text-[#94A3B8]"
            title="TIBER-FR / DORA - Exercice de Red Team démonstratif - BdF-2024-RT-018"
          >
            Exercice TIBER-FR · Démonstratif
          </p>
        </div>
      </div>
    </footer>
  );
}
