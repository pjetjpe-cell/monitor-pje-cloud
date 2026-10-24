import fs from 'fs'
import path from 'path'
import Image from 'next/image'

const EXTENSOES = ['webp', 'jpg', 'jpeg', 'png']

export type SlotFoto = 'hero' | 'porto2life' | 'granvalley' | 'familia' | 'calculadora'

/** Procura public/fotos/<slot>.(webp|jpg|jpeg|png); devolve o caminho público ou null. */
export function fotoDoSlot(slot: SlotFoto): string | null {
  for (const ext of EXTENSOES) {
    const arquivo = `${slot}.${ext}`
    if (fs.existsSync(path.join(process.cwd(), 'public', 'fotos', arquivo))) return `/fotos/${arquivo}`
  }
  return null
}

const PALETAS: Record<SlotFoto, [string, string, string]> = {
  hero: ['#0d2340', '#1e4677', '#f2b27a'],
  porto2life: ['#0b4747', '#1a7373', '#f6d49b'],
  granvalley: ['#15335c', '#2a6f97', '#f4c58a'],
  familia: ['#0d2340', '#125e5e', '#f2a56f'],
  calculadora: ['#08182e', '#15335c', '#4fdcb3'],
}

/** Arte vetorial discreta (pôr do sol, horizonte e palmeiras) usada enquanto não há foto autorizada. */
function Arte({ slot }: { slot: SlotFoto }) {
  const [topo, meio, sol] = PALETAS[slot]
  const id = `arte-${slot}`
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={topo} />
          <stop offset="0.62" stopColor={meio} />
          <stop offset="1" stopColor={sol} />
        </linearGradient>
        <radialGradient id={`${id}-sol`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3dc" stopOpacity="0.95" />
          <stop offset="1" stopColor={sol} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-mar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={meio} stopOpacity="0.9" />
          <stop offset="1" stopColor={topo} />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#${id}-ceu)`} />
      <circle cx="540" cy="360" r="190" fill={`url(#${id}-sol)`} />
      <circle cx="540" cy="372" r="46" fill="#fff3dc" opacity="0.92" />
      <rect y="395" width="800" height="205" fill={`url(#${id}-mar)`} />
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={430 + i * 8} y={402 + i * 18} width={220 - i * 16} height="2.4" rx="1.2" fill="#fff3dc" opacity={0.5 - i * 0.07} />
      ))}
      <path d="M0 420 C 140 392 260 440 400 414 C 540 388 660 432 800 404 L800 440 L0 440Z" fill={topo} opacity="0.55" />
      <g fill={topo} opacity="0.92">
        <rect x="70" y="330" width="14" height="200" rx="5" />
        <path d="M77 336c-50-30-96-22-130 8 36-12 74-6 130 6Zm0 0c40-38 92-40 128-14-38-4-80 4-128 14Zm0 0c-18-46-4-86 22-110-6 40-6 74-22 110Zm0 0c-30-30-30-72-12-104 2 38 8 70 12 104Z" />
        <rect x="690" y="360" width="11" height="170" rx="4" />
        <path d="M696 366c-42-26-82-18-110 6 30-10 62-4 110 4Zm0 0c34-32 78-34 108-12-32-2-66 6-108 12Zm0 0c-14-40-2-72 20-92-5 34-5 62-20 92Z" />
      </g>
      <rect y="520" width="800" height="80" fill={topo} />
    </svg>
  )
}

interface Props {
  slot: SlotFoto
  alt: string
  className?: string
  sizes?: string
  prioridade?: boolean
}

/** Foto de public/fotos quando existir; caso contrário, arte ilustrativa. Sempre preenche o container pai. */
export default function FotoOuArte({ slot, alt, className = '', sizes = '100vw', prioridade = false }: Props) {
  const src = fotoDoSlot(slot)
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={prioridade} className="object-cover" />
      ) : (
        <Arte slot={slot} />
      )}
    </div>
  )
}
