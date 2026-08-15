import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.ts'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'Memuat Sesi — HomeeKost Management',
      },
    ],
  }),
  component: SessionGatewayPage,
})

function SessionGatewayPage() {
  const navigate = useNavigate()
  const [statusText, setStatusText] = useState('Sedang memuat sesi')

  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const session = await authClient.getSession()
        if (!isMounted) return

        if (!session?.data?.user) {
          navigate({ to: '/login', replace: true })
          return
        }

        const user = session.data.user as { role?: string }
        setStatusText('Mengalihkan ke dashboard...')

        // SuperAdmin with multi-property access
        if (user.role === 'SUPER_ADMIN') {
          navigate({ to: '/select-property', replace: true })
          return
        }

        // Branch Admin with single property
        navigate({ to: '/dashboard', replace: true })
      } catch {
        if (isMounted) {
          navigate({ to: '/login', replace: true })
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <div className="fixed inset-0 min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center p-6 z-50 select-none">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Animated Brand Logo */}
        <div className="w-[180px] max-h-[100px] mb-5 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="HomeeKost Logo"
            className="w-full h-auto max-h-[90px] object-contain animate-pulse"
          />
        </div>

        {/* Loading Indicator with Bouncing Dots */}
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#506257] bg-[#eef4ef] border border-[#dce6df] px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(79,105,88,0.06)]">
          <span>{statusText}</span>
          <span className="flex items-center gap-1 ml-1 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f6958] animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  )
}
