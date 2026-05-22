import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

const ADMIN_EMAIL = 'serveupadmin@gmail.com'

export const metadata = { title: 'Panel Admin — ServeUp' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.email !== ADMIN_EMAIL) redirect('/')

  return <DashboardClient />
}
