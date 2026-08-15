import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.ts'

export const Route = createFileRoute('/select-property')({
  head: () => ({
    meta: [
      {
        title: 'Pilih Properti Kos — HomeeKost Management',
      },
    ],
  }),
  component: SelectPropertyPage,
})

function SelectPropertyPage() {
  const navigate = useNavigate()

  const properties = [
    {
      id: 'prop-melati',
      name: 'Kost Melati Indah (Pusat)',
      address: 'Jl. Kaliurang KM 5.2 No. 18, Sleman, Yogyakarta',
      totalRooms: 12,
      occupiedRooms: 10,
      badge: '92% Okupansi',
      badgeColor: 'bg-[#e8f2ea] text-[#568062]',
    },
    {
      id: 'prop-mawar',
      name: 'Kost Mawar Residence (Cabang 2)',
      address: 'Jl. Gejayan Gg. Jembatan Merah No. 4, Depok, Sleman',
      totalRooms: 8,
      occupiedRooms: 6,
      badge: '75% Okupansi',
      badgeColor: 'bg-[#f6f0e4] text-[#99773d]',
    },
    {
      id: 'prop-graha',
      name: 'Kost Graha Asri (Cabang 3)',
      address: 'Jl. Seturan Raya No. 88, Caturtunggal, Sleman',
      totalRooms: 15,
      occupiedRooms: 14,
      badge: '93% Okupansi',
      badgeColor: 'bg-[#e8f2ea] text-[#568062]',
    },
  ]

  const handleSelectProperty = (propertyId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_property_id', propertyId)
    }
    navigate({ to: '/dashboard' })
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('homeekost_user')
      localStorage.removeItem('active_property_id')
    }
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-[#f5f8f5] z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-[520px] bg-white border border-[#e2e9e3] rounded-[24px] p-8 shadow-[0_20px_60px_rgba(47,69,55,0.10)]">
        {/* Header */}
        <div className="text-center mb-7">
          <img
            className="block w-[150px] max-h-[80px] object-contain mx-auto mb-4"
            src="/logo.png"
            alt="HomeeKost Logo"
          />
          <h1 className="text-[22px] font-bold text-[#26372c] m-0 mb-1 leading-tight">
            Pilih Cabang Properti
          </h1>
          <p className="text-[#7b897e] text-xs m-0">
            Pilih properti kos yang ingin Anda kelola saat ini.
          </p>
        </div>

        {/* Property Cards List */}
        <div className="space-y-3 mb-6">
          {properties.map((prop) => (
            <button
              key={prop.id}
              type="button"
              onClick={() => handleSelectProperty(prop.id)}
              className="w-full text-left p-4 rounded-2xl border border-[#dfe7e0] bg-[#fbfcfb] hover:bg-[#f3f7f3] hover:border-[#8fa594] transition-all duration-150 flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-bold text-[#26372c] group-hover:text-[#4f6958] transition-colors">
                    {prop.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${prop.badgeColor}`}
                  >
                    {prop.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#7b897e] m-0 line-clamp-1">
                  {prop.address}
                </p>
                <div className="text-[10.5px] text-[#506257] font-medium mt-1">
                  🛏️ {prop.occupiedRooms} / {prop.totalRooms} Kamar Terisi
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white border border-[#dfe7e0] flex items-center justify-center text-[#4f6958] group-hover:bg-[#4f6958] group-hover:text-white transition-all shrink-0 ml-3">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#edf1ed] text-xs">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[#a65f5b] hover:text-[#8a4b48] font-semibold transition-colors"
          >
            ← Keluar dari Akun
          </button>
          <span className="text-[10px] text-[#9aa49c]">
            Multi-Property Manager
          </span>
        </div>
      </div>
    </div>
  )
}
