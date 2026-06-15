/**
 * Faithful inline SVG of the La Banque Postale 2022 logo:
 *  - Stylized two-tone blue "envelope flap / postal swoosh" mark
 *  - "LA BANQUE POSTALE" wordmark stacked on 3 lines on the right
 * Uses official colors: cyan #009BE0 + navy #003366.
 */
export default function LbpLogo({ className = "h-10 sm:h-12" }) {
  return (
    <svg
      data-testid="lbp-logo-img"
      className={className}
      viewBox="0 0 200 90"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="La Banque Postale"
    >
      {/* Mark: layered envelope-flap stripes (cyan + navy) */}
      <g>
        {/* Cyan top swoosh */}
        <path
          d="M2 38 L48 6 L62 6 L16 38 Z"
          fill="#009BE0"
        />
        {/* Mid cyan stripe */}
        <path
          d="M2 56 L62 14 L62 26 L2 68 Z"
          fill="#3FB6E8"
        />
        {/* Navy bottom block */}
        <path
          d="M2 70 L62 28 L62 46 L2 84 Z"
          fill="#003366"
        />
      </g>

      {/* Wordmark - 3 stacked lines, navy */}
      <g
        fill="#003366"
        fontFamily="'Public Sans', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="18"
        letterSpacing="0.5"
      >
        <text x="74" y="28">LA</text>
        <text x="74" y="52">BANQUE</text>
        <text x="74" y="76">POSTALE</text>
      </g>
    </svg>
  );
}
