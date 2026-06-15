import LbpLogo from "@/components/LbpLogo";

export default function Header() {
  return (
    <header
      data-testid="lbp-header"
      className="sticky top-0 z-40 w-full bg-white"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-start px-4 sm:px-6">
        <a
          href="/"
          data-testid="lbp-logo-link"
          className="flex items-center"
          aria-label="La Banque Postale - accueil"
        >
          <LbpLogo className="h-9 sm:h-11" />
        </a>
      </div>
    </header>
  );
}
