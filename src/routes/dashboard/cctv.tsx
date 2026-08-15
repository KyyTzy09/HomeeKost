import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/cctv')({
  head: () => ({
    meta: [{ title: 'Pemantauan CCTV — HomeeKost Management' }],
  }),
  component: CctvPage,
})

function CctvPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Pemantauan CCTV Kos</h1>
          <p>Live stream kamera keamanan area kos, status online/offline perangkat.</p>
        </div>
      </div>
      <div className="empty-state-box">
        Halaman Pemantauan CCTV sedang dalam tahap pengembangan.
      </div>
    </div>
  )
}
