import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/finance')({
  head: () => ({
    meta: [{ title: 'Keuangan & Arus Kas — HomeeKost Management' }],
  }),
  component: FinancePage,
})

function FinancePage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Laporan Keuangan & Arus Kas</h1>
          <p>Pencatatan pengeluaran operasional, pemasukan sewa, dan laba bersih per kos.</p>
        </div>
      </div>
      <div className="empty-state-box">
        Halaman Keuangan sedang dalam tahap pengembangan.
      </div>
    </div>
  )
}
