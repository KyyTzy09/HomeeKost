import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/reports')({
  head: () => ({
    meta: [{ title: 'Laporan & AI Insight — HomeeKost Management' }],
  }),
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Laporan Eksekutif & AI Insight</h1>
          <p>Kalkulasi performa finansial PostgreSQL disertai analisis bisnis naratif LLM.</p>
        </div>
      </div>
      <div className="empty-state-box">
        Halaman Laporan & AI Insight sedang dalam tahap pengembangan.
      </div>
    </div>
  )
}
