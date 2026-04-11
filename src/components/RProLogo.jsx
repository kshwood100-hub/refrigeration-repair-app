export default function RProLogo({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rp-bg" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" stopColor="#1B3A6B" />
          <stop offset="100%" stopColor="#060E1C" />
        </linearGradient>
        <linearGradient id="rp-ring" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="38%" stopColor="#F1F5F9" />
          <stop offset="72%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="rp-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 그림자 */}
      <polygon
        points="60,6 114,60 60,114 6,60"
        fill="#000000"
        opacity="0.3"
        transform="translate(2,3)"
      />

      {/* 스틸 테두리 */}
      <polygon
        points="60,6 114,60 60,114 6,60"
        fill="url(#rp-ring)"
      />

      {/* 다크 배경 */}
      <polygon
        points="60,13 107,60 60,107 13,60"
        fill="url(#rp-bg)"
      />

      {/* 상단 광택 */}
      <polygon
        points="60,13 107,60 83,47 60,42 37,47 13,60"
        fill="url(#rp-shine)"
      />

      {/* 꼭짓점 액센트 */}
      <circle cx="60" cy="6"   r="2" fill="#38BDF8" opacity="0.6" />
      <circle cx="60" cy="114" r="2" fill="#38BDF8" opacity="0.6" />
      <circle cx="6"  cy="60"  r="2" fill="#38BDF8" opacity="0.4" />
      <circle cx="114" cy="60" r="2" fill="#38BDF8" opacity="0.4" />

      {/* 메인 R */}
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontSize="44"
        fontWeight="900"
        fill="#38BDF8"
      >R</text>

      {/* 구분선 */}
      <line x1="35" y1="74" x2="85" y2="74" stroke="#38BDF8" strokeWidth="0.8" opacity="0.4" />

      {/* PRO */}
      <text
        x="60"
        y="88"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#E2E8F0"
        letterSpacing="5"
      >PRO</text>
    </svg>
  )
}
