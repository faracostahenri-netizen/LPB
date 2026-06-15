import LbpLogo from "@/components/LbpLogo";
import { Search, X } from "lucide-react";

export default function Header() {
  return (
    <header
      data-testid="lbp-header"
      className="sticky top-0 z-40 w-full bg-white"
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="/"
          data-testid="lbp-logo-link"
          className="flex items-center"
          aria-label="La Banque Postale - accueil"
        >
          <LbpLogo className="h-12 sm:h-14" />
        </a>

        <div className="flex items-center gap-4 sm:gap-6 text-[#003366]">
          <button
            type="button"
            data-testid="header-search"
            aria-label="Rechercher"
            className="hover:opacity-70 transition"
          >
            <Search className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            data-testid="header-close"
            aria-label="Fermer"
            className="hover:opacity-70 transition"
          >
            <X className="h-7 w-7" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </header>
  );
}
