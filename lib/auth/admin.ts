import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './options'

export async function exigirAdmin() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'admin') {
    redirect('/')
  }
  return session
}

export async function exigirAdminApi() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'admin') {
    return { session: null, erro: NextResponse.json({ error: 'Não autorizado' }, { status: 403 }) }
  }
  return { session, erro: null as null }
}
