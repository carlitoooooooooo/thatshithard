export default function GraffitiLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 52"
      height="42"
      style={{ display: "block", overflow: "visible" }}
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id="gLogo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ff2d78" />
          <stop offset="45%"  stopColor="#ff6600" />
          <stop offset="100%" stopColor="#ffe600" />
        </linearGradient>
        <linearGradient id="gShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="gSpray">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="gGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Spray halo behind text */}
      <ellipse cx="170" cy="26" rx="168" ry="22" fill="rgba(255,45,120,0.07)" filter="url(#gSpray)"/>
      <ellipse cx="170" cy="26" rx="140" ry="18" fill="rgba(255,102,0,0.05)"  filter="url(#gSpray)"/>

      {/* Fat black outline — graffiti outline layer */}
      <text
        x="170" y="38"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="38"
        fontWeight="900"
        fontStyle="italic"
        stroke="#000"
        strokeWidth="8"
        strokeLinejoin="round"
        fill="none"
        letterSpacing="-1"
      >ThatShitHard</text>

      {/* Dark purple mid-outline for depth */}
      <text
        x="170" y="38"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="38"
        fontWeight="900"
        fontStyle="italic"
        stroke="#330022"
        strokeWidth="5"
        strokeLinejoin="round"
        fill="none"
        letterSpacing="-1"
      >ThatShitHard</text>

      {/* Main fill — gradient */}
      <text
        x="170" y="38"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="38"
        fontWeight="900"
        fontStyle="italic"
        fill="url(#gLogo)"
        filter="url(#gGlow)"
        letterSpacing="-1"
      >ThatShitHard</text>

      {/* Shine highlight on top half */}
      <text
        x="170" y="38"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="38"
        fontWeight="900"
        fontStyle="italic"
        fill="url(#gShine)"
        letterSpacing="-1"
        opacity="0.7"
      >ThatShitHard</text>

      {/* Paint drip off the 'T' */}
      <rect x="13"  y="40" width="4" height="10" rx="2" fill="#ff2d78" opacity="0.9"/>
      <circle cx="15" cy="51" r="3" fill="#ff2d78" opacity="0.9"/>

      {/* Paint drip off the 'H' in Hard */}
      <rect x="256" y="40" width="3" height="8" rx="1.5" fill="#ffe600" opacity="0.85"/>
      <circle cx="257.5" cy="49" r="2.5" fill="#ffe600" opacity="0.85"/>

      {/* Small star accents */}
      <text x="2"   y="14" fontSize="9" fill="#ffe600" opacity="0.8">★</text>
      <text x="330" y="18" fontSize="7" fill="#aaff00" opacity="0.7">★</text>
      <text x="158" y="6"  fontSize="6" fill="#ff2d78" opacity="0.6">✦</text>
    </svg>
  );
}
