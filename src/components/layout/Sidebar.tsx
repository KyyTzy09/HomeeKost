import { Link, useRouterState } from '@tanstack/react-router'
import { authClient } from '../../lib/auth-client.ts'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('homeekost_user')
      localStorage.removeItem('active_property_id')
    }
    await authClient.signOut()
    window.location.href = '/login'
  }

  const navLinks = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
      exact: true,
    },
    {
      to: '/select-property',
      label: 'Pilih Kos',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      to: '/dashboard/rooms',
      label: 'Kamar',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h18v14H3z" />
          <path d="M3 12h18" />
          <circle cx="8" cy="9.5" r="1" />
        </svg>
      ),
    },
    {
      to: '/dashboard/tenants',
      label: 'Penghuni',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      to: '/dashboard/payments',
      label: 'Pembayaran',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      to: '/dashboard/invoices',
      label: 'Invoice',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
        </svg>
      ),
    },
    {
      to: '/dashboard/finance',
      label: 'Keuangan',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      to: '/dashboard/engagement',
      label: 'Engagement',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/cctv',
      label: 'CCTV',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      to: '/dashboard/reports',
      label: 'Laporan & Insight',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16M4 12h16M4 19h10" />
          <circle cx="18" cy="19" r="2" />
        </svg>
      ),
    },
    {
      to: '/dashboard/users',
      label: 'User Management',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.6-3.5 2.5-5.5 5.5-5.5s4.9 2 5.5 5.5" />
          <path d="M16 11c2.4.1 4 1.7 4.5 4M16 5.5a2.6 2.6 0 0 1 0 5" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[rgba(28,40,31,0.30)] z-15 md:hidden"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        {/* Brand Header */}
        <div className="brand">
          <img src="/logo.png" alt="HomeeKost Logo" />
        </div>

        {/* Navigation */}
        <nav className="nav">
          {navLinks.map((item) => {
            const isActive = currentPath.replace("/dashboard/", "") === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={isActive ? 'active' : ''}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Area */}
        <div className="sidebar-bottom">
          <div className="help">
            <strong>Bantuan Cepat</strong>
            WhatsApp support siap membantu operasional kos Anda.
          </div>

          <div
            className="profile-mini"
            onClick={handleLogout}
            title="Klik untuk keluar"
          >
            <div className="avatar">BF</div>
            <div className="flex-1 min-w-0">
              <strong className="truncate">Frisda</strong>
              <span className="truncate">SuperAdmin (Owner)</span>
            </div>
            <span className="text-[10px] text-[#a65f5b] font-bold">Keluar</span>
          </div>
        </div>
      </aside>
    </>
  )
}
