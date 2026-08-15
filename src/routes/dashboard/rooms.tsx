import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/rooms')({
  head: () => ({
    meta: [{ title: 'Manajemen Kamar — HomeeKost Management' }],
  }),
  component: RoomsPage,
})

function RoomsPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Manajemen Kamar</h1>
          <p>Daftar kamar, status ketersediaan, dan fasilitas per kamar.</p>
        </div>
      </div>
      <div className="empty-state-box">
        Halaman Manajemen Kamar sedang dalam tahap pengembangan.
      </div>
    </div>
  )
}
