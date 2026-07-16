'use client'

import { signOut } from 'next-auth/react'

export default function SairButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/' })} className="mt-1 text-xs text-slate-400 hover:text-slate-700">
      Sair
    </button>
  )
}
