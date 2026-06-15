/**
 * Official La Banque Postale logo (current 2022+ branding with the stylized swallow / hirondelle).
 * Asset: /lbp-logo.svg sourced from labanquepostale.fr official CDN.
 * Colors: #39A8E5 cyan + #164194 navy.
 */
export default function LbpLogo({ className = "h-9 sm:h-11" }) {
  return (
    <img
      data-testid="lbp-logo-img"
      src="/lbp-logo.svg"
      alt="La Banque Postale"
      className={className}
      width={120}
      height={120}
    />
  );
}
