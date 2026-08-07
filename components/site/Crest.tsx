type CrestProps = {
  className?: string
  shield?: string
  lines?: string
}

export default function Crest({ className = 'h-9 w-9', shield = '#0d2340', lines = '#b8863e' }: CrestProps) {
  return (
    <svg viewBox="0 0 80 92" role="img" aria-label="Brasão Di Pallacio" className={className}>
      <path
        d="M40 3l32 10v28c0 22-12 38-32 48C20 79 8 63 8 41V13L40 3z"
        fill={shield}
        stroke={lines}
        strokeWidth="1"
      />
      <g stroke={lines} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 35h32M28 31h24M31 31v25M40 31v25M49 31v25M26 58h28M22 63h36" />
        <path d="M40 17v13M29 21h22M29 21l-7 11h14l-7-11zM51 21l-7 11h14l-7-11z" />
      </g>
    </svg>
  )
}
