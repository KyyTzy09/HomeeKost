import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/engagement')({
  head: () => ({
    meta: [{ title: 'WhatsApp Engagement — HomeeKost Management' }],
  }),
  component: EngagementPage,
})

function EngagementPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>WhatsApp Engagement & Pengumuman</h1>
          <p>Broadcast agenda kos, ucapan ulang tahun otomatis, dan percakapan penagihan.</p>
        </div>
      </div>
      <div className="empty-state-box">
        Halaman WhatsApp Engagement sedang dalam tahap pengembangan.
      </div>
    </div>
  )
}
