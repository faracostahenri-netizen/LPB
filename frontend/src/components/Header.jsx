import LbpLogo from "@/components/LbpLogo";
import { Lock } from "lucide-react";

export default function Header() {
  return (
    <header
      data-testid="lbp-header"
      className="sticky top-0 z-40 w-full bg-white border-b border-[#E8ECF1]"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="/"
          data-testid="lbp-logo-link"
          className="flex items-center"
          aria-label="La Banque Postale - accueil"
        >
          <LbpLogo className="h-9 sm:h-10" />
        </a>

        <div
          data-testid="secure-session-indicator"
          className="flex items-center gap-2 rounded-full bg-[#F1F5FA] px-3 py-1.5 text-xs font-medium text-[#0033A0]"
        >
          <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">Session sécurisée</span>
          <span className="sm:hidden">Sécurisé</span>
        </div>
      </div>
      <div className="h-1 w-full bg-[#FFCD00]" aria-hidden="true" />
    </header>
  );
}
