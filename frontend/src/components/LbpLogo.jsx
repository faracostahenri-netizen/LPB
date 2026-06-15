/**
 * Inline SVG approximation of the La Banque Postale logo.
 * Avoids external image dependencies and CSP issues.
 * Stylized "LBP postmark" stamp + wordmark.
 */
export default function LbpLogo({ className = "h-9 sm:h-10" }) {
  return (
    <svg
      data-testid="lbp-logo-img"
      className={className}
      viewBox="0 0 220 56"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="La Banque Postale"
    >
      {/* Postmark stamp: blue square with yellow corner cut */}
      <g>
        <rect x="2" y="6" width="44" height="44" rx="3" fill="#003B5C" />
        <path d="M2 6 L18 6 L2 22 Z" fill="#FFCD00" />
        <path d="M46 50 L30 50 L46 34 Z" fill="#FFCD00" />
        {/* Stylized envelope/line motif */}
        <path
          d="M10 22 L38 22 L24 34 Z"
          fill="none"
          stroke="#FFCD00"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M10 22 L10 42 L38 42 L38 22"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </g>

      {/* Wordmark */}
      <g fill="#003B5C" fontFamily="Public Sans, sans-serif" fontWeight="700">
        <text x="54" y="26" fontSize="14" letterSpacing="0.2">
          LA BANQUE
        </text>
        <text x="54" y="44" fontSize="14" letterSpacing="0.2">
          POSTALE
        </text>
      </g>
    </svg>
  );
}
