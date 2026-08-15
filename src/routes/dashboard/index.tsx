import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardSkeleton } from '../../components/layout/DashboardSkeleton'

export const Route = createFileRoute('/dashboard/')({
  head: () => ({
    meta: [
      {
        title: 'Dashboard Operasional — HomeeKost Management',
      },
    ],
  }),
  component: DashboardHomePage,
})

function DashboardHomePage() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [chartPeriod, setChartPeriod] = useState('6 Bulan')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Dummy Dashboard Data matching KostManagement.html
  const stats = {
    totalRooms: 12,
    occupiedRooms: 10,
    vacantRooms: 2,
    monthlyIncome: 'Rp6,8 jt',
    incomeGrowth: '8,2%',
    dueCount: 4,
    dueAmount: 'Rp3,2 jt',
    monthlyExpense: 'Rp2,1 jt',
  }

  const upcomingPayments = [
    {
      id: 'p1',
      tenant: 'Alya Putri',
      room: 'A-03',
      dueDate: '10 Agu',
      amount: 'Rp850.000',
      badgeText: '3 hari lagi',
      badgeClass: 'amber',
      actionText: 'Reminder',
    },
    {
      id: 'p2',
      tenant: 'Nabila Putri',
      room: 'B-02',
      dueDate: '12 Agu',
      amount: 'Rp950.000',
      badgeText: '5 hari lagi',
      badgeClass: 'green',
      actionText: 'Invoice',
    },
    {
      id: 'p3',
      tenant: 'Fira Aulia',
      room: 'A-07',
      dueDate: '08 Agu',
      amount: 'Rp850.000',
      badgeText: 'Terlambat',
      badgeClass: 'red',
      actionText: 'Reminder',
    },
    {
      id: 'p4',
      tenant: 'Sarah Anindita',
      room: 'C-01',
      dueDate: '15 Agu',
      amount: 'Rp1.200.000',
      badgeText: '8 hari lagi',
      badgeClass: 'green',
      actionText: 'Invoice',
    },
  ]

  const todayAttentions = [
    {
      id: 'att1',
      icon: '🎂',
      title: 'Sarah ulang tahun besok',
      desc: 'Kirim ucapan personal untuk menjaga engagement.',
      route: '/dashboard/engagement',
    },
    {
      id: 'att2',
      icon: '💳',
      title: '3 pembayaran mendekati jatuh tempo',
      desc: 'Pengingat otomatis akan berjalan sesuai jadwal.',
      route: '/dashboard/payments',
    },
    {
      id: 'att3',
      icon: '🔧',
      title: 'Maintenance kamar B-04',
      desc: 'Keluhan: lampu kamar perlu diganti.',
      route: '/dashboard/rooms',
    },
    {
      id: 'att4',
      icon: '💬',
      title: '2 penghuni perlu diperhatikan',
      desc: 'Ada pertanyaan dari penghuni terkait perpanjangan sewa.',
      route: '/dashboard/tenants',
    },
  ]

  const recentExpenses = [
    {
      id: 'e1',
      title: 'Abonemen WiFi',
      date: '03 Agu · Semua Kost',
      amount: 'Rp777.000',
    },
    {
      id: 'e2',
      title: 'Listrik',
      date: '05 Agu · Kos A',
      amount: 'Rp1.250.000',
    },
    {
      id: 'e3',
      title: 'Maintenance',
      date: '07 Agu · Kos B',
      amount: 'Rp450.000',
    },
  ]

  const propertySummary = [
    { id: 'ps1', name: 'Kost Melati Indah', rooms: '10 kamar', dueBadge: '3 mendekati', badgeColor: 'amber' },
    { id: 'ps2', name: 'Kost Mawar Residence', rooms: '12 kamar', dueBadge: '4 mendekati', badgeColor: 'amber' },
    { id: 'ps3', name: 'Kost Graha Asri', rooms: '9 kamar', dueBadge: '2 mendekati', badgeColor: 'green' },
  ]

  const recentActivities = [
    {
      id: 'a1',
      time: '10 menit lalu',
      desc: 'Invoice #INV-0021 dikirim ke Alya Putri via WhatsApp.',
      route: '/dashboard/invoices',
    },
    {
      id: 'a2',
      time: '1 jam lalu',
      desc: 'Pembayaran Rp850.000 dari Dinda Maharani diterima.',
      route: '/dashboard/payments',
    },
    {
      id: 'a3',
      time: '2 jam lalu',
      desc: 'Kamar A-05 diubah menjadi status kosong.',
      route: '/dashboard/rooms',
    },
    {
      id: 'a4',
      time: 'Hari ini, 08:40',
      desc: 'Pengeluaran listrik Rp1.250.000 dicatat.',
      route: '/dashboard/finance',
    },
  ]

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <>
      {/* Toast Popup Notification */}
      <div className={`toast ${toastMessage ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>

      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>
            Selamat pagi, Frisda <span className="emoji">👋</span>
          </h1>
          <p>
            <b id="dashboardPropertyName">Kost Melati Indah</b> · Berikut
            ringkasan kondisi kos hari ini.
          </p>
        </div>
        <div className="actions">
          <button className="btn" type="button" id="dashboardDateBtn">
            09 Agustus 2026 ▾
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="stats">
        <div
          className="card stat clickable"
          onClick={() => navigate({ to: '/dashboard/rooms' })}
        >
          <div className="stat-top">
            <span>Total Kamar</span>
            <span className="stat-icon">▦</span>
          </div>
          <div className="stat-value">{stats.totalRooms}</div>
          <div className="stat-sub">
            <span className="up">{stats.occupiedRooms} terisi</span> ·{' '}
            {stats.vacantRooms} kosong
          </div>
        </div>

        <div
          className="card stat clickable"
          onClick={() => navigate({ to: '/dashboard/finance' })}
        >
          <div className="stat-top">
            <span>Pendapatan Bulan Ini</span>
            <span className="stat-icon">Rp</span>
          </div>
          <div className="stat-value">{stats.monthlyIncome}</div>
          <div className="stat-sub">
            <span className="up">↑ {stats.incomeGrowth}</span> dari bulan lalu
          </div>
        </div>

        <div
          className="card stat clickable"
          onClick={() => navigate({ to: '/dashboard/payments' })}
        >
          <div className="stat-top">
            <span>Jatuh Tempo</span>
            <span className="stat-icon">◷</span>
          </div>
          <div className="stat-value">{stats.dueCount}</div>
          <div className="stat-sub">
            <span className="warn">{stats.dueAmount}</span> perlu ditindaklanjuti
          </div>
        </div>

        <div
          className="card stat clickable"
          onClick={() => navigate({ to: '/dashboard/finance' })}
        >
          <div className="stat-top">
            <span>Pengeluaran</span>
            <span className="stat-icon">−</span>
          </div>
          <div className="stat-value">{stats.monthlyExpense}</div>
          <div className="stat-sub">Bulan berjalan</div>
        </div>
      </div>

      {/* Main Grid: Chart & Occupancy */}
      <div className="grid-main">
        {/* Income & Expense SVG Chart Panel */}
        <div
          className="card panel clickable"
          onClick={() => navigate({ to: '/dashboard/finance' })}
        >
          <div className="panel-head">
            <div>
              <h2>Pendapatan & Pengeluaran</h2>
              <p>Perbandingan 6 bulan terakhir</p>
            </div>
            <select
              className="select"
              value={chartPeriod}
              onChange={(e) => {
                e.stopPropagation()
                setChartPeriod(e.target.value)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option>6 Bulan</option>
              <option>12 Bulan</option>
            </select>
          </div>

          <div className="chart-wrap">
            <svg
              className="chart-svg"
              viewBox="0 0 700 215"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#718b78" stopOpacity=".20" />
                  <stop offset="100%" stopColor="#718b78" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="45" y1="25" x2="680" y2="25" className="chart-grid" />
              <line x1="45" y1="70" x2="680" y2="70" className="chart-grid" />
              <line x1="45" y1="115" x2="680" y2="115" className="chart-grid" />
              <line x1="45" y1="160" x2="680" y2="160" className="chart-grid" />
              <text x="2" y="29" className="chart-label">
                20jt
              </text>
              <text x="8" y="74" className="chart-label">
                15jt
              </text>
              <text x="8" y="119" className="chart-label">
                10jt
              </text>
              <text x="14" y="164" className="chart-label">
                5jt
              </text>
              <path
                className="chart-area"
                d="M45,132 C90,116 125,124 165,103 S240,92 285,107 S360,71 410,84 S485,55 535,72 S615,48 680,42 L680,160 L45,160 Z"
              />
              <path
                className="chart-line"
                d="M45,132 C90,116 125,124 165,103 S240,92 285,107 S360,71 410,84 S485,55 535,72 S615,48 680,42"
              />
              <polyline
                points="45,148 165,140 285,133 410,139 535,126 680,118"
                fill="none"
                stroke="#c7d0c8"
                strokeWidth="2"
                strokeDasharray="4 5"
              />
              <text x="42" y="184" className="chart-label">
                Mar
              </text>
              <text x="158" y="184" className="chart-label">
                Apr
              </text>
              <text x="278" y="184" className="chart-label">
                Mei
              </text>
              <text x="403" y="184" className="chart-label">
                Jun
              </text>
              <text x="528" y="184" className="chart-label">
                Jul
              </text>
              <text x="670" y="184" className="chart-label">
                Agu
              </text>
            </svg>
          </div>

          <div className="legend">
            <span>
              <i className="dot"></i>Pendapatan
            </span>
            <span>
              <i className="dot gray"></i>Pengeluaran
            </span>
          </div>
        </div>

        {/* Room Status & Occupancy Donut Panel */}
        <div
          className="card panel clickable"
          onClick={() => navigate({ to: '/dashboard/rooms' })}
        >
          <div className="panel-head">
            <div>
              <h2>Status Kamar</h2>
              <p>Occupancy hari ini</p>
            </div>
            <span className="mini-link">Lihat semua</span>
          </div>

          <div className="occupancy">
            <div className="donut">
              <div className="donut-inner">
                <strong>75%</strong>
                <span>Terisi</span>
              </div>
            </div>

            <div className="occ-list">
              <div className="occ-row">
                <span className="occ-name">
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#718b78',
                    }}
                  />
                  Terisi
                </span>
                <b>18</b>
              </div>
              <div className="occ-row">
                <span className="occ-name">
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#dce7de',
                    }}
                  />
                  Kosong
                </span>
                <b>6</b>
              </div>
              <div className="occ-row">
                <span className="occ-name">
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#c8a46b',
                    }}
                  />
                  Maintenance
                </span>
                <b>0</b>
              </div>
              <div className="bar">
                <i style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Bottom 1: Tables & Attention */}
      <div className="grid-bottom">
        {/* Upcoming Payments Table */}
        <div
          className="card panel clickable"
          onClick={() => navigate({ to: '/dashboard/payments' })}
        >
          <div className="panel-head">
            <div>
              <h2>Pembayaran Terdekat</h2>
              <p>Yang perlu diperhatikan minggu ini</p>
            </div>
            <span className="mini-link">Kelola pembayaran</span>
          </div>

          {upcomingPayments.length === 0 ? (
            <div className="empty-state-box">
              Belum ada tagihan jatuh tempo terdekat
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Penghuni</th>
                    <th>Kamar</th>
                    <th>Jatuh Tempo</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPayments.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <b>{item.tenant}</b>
                      </td>
                      <td>{item.room}</td>
                      <td>{item.dueDate}</td>
                      <td>{item.amount}</td>
                      <td>
                        <span className={`badge ${item.badgeClass}`}>
                          {item.badgeText}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="row-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (item.actionText === 'Reminder') {
                              showToast(`Reminder WhatsApp dikirim ke ${item.tenant}`)
                            } else {
                              showToast(`Invoice dibuka untuk ${item.tenant}`)
                            }
                          }}
                        >
                          {item.actionText}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Today Attention Panel */}
        <div className="card panel">
          <div className="panel-head">
            <div>
              <h2>Perhatian Hari Ini</h2>
              <p>Hal kecil yang perlu ditindaklanjuti</p>
            </div>
          </div>

          {todayAttentions.length === 0 ? (
            <div className="empty-state-box">
              Tidak ada perhatian khusus hari ini
            </div>
          ) : (
            <div className="attention">
              {todayAttentions.map((att) => (
                <div
                  key={att.id}
                  className="attention-item clickable"
                  onClick={() => navigate({ to: att.route })}
                >
                  <div className="att-icon emoji">
                    <span className="emoji">{att.icon}</span>
                  </div>
                  <div>
                    <strong>{att.title}</strong>
                    <span>{att.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Bottom 2: Recent Expenses & Property Summary */}
      <div className="grid-bottom pdf-dashboard-grid">
        {/* Recent Expenses List */}
        <div className="card panel">
          <div className="panel-head">
            <div>
              <h2>Pengeluaran Terakhir</h2>
              <p>Transaksi biaya terbaru</p>
            </div>
            <span
              className="mini-link"
              onClick={() => navigate({ to: '/dashboard/finance' })}
            >
              Lihat semua
            </span>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="empty-state-box">
              Belum ada transaksi pengeluaran bulan ini
            </div>
          ) : (
            <div className="mini-list">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="mini-list-row">
                  <div>
                    <b>{exp.title}</b>
                    <span>{exp.date}</span>
                  </div>
                  <strong>{exp.amount}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rooms Approaching Due Date List */}
        <div className="card panel">
          <div className="panel-head">
            <div>
              <h2>Kamar Mendekati Pembayaran</h2>
              <p>Ringkasan per kost</p>
            </div>
            <span
              className="mini-link"
              onClick={() => navigate({ to: '/dashboard/payments' })}
            >
              Lihat semua
            </span>
          </div>

          <div className="mini-list">
            {propertySummary.map((ps) => (
              <div key={ps.id} className="mini-list-row">
                <div>
                  <b>{ps.name}</b>
                  <span>{ps.rooms}</span>
                </div>
                <span className={`badge ${ps.badgeColor}`}>{ps.dueBadge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline Panel */}
      <div className="activity card panel">
        <div className="panel-head">
          <div>
            <h2>Aktivitas Terbaru</h2>
            <p>Perubahan terakhir di HomeeKost</p>
          </div>
          <span className="mini-link">Lihat semua</span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="empty-state-box">
            Belum ada aktivitas tercatat hari ini
          </div>
        ) : (
          <div className="activity-list">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="activity-item clickable"
                onClick={() => navigate({ to: act.route })}
              >
                <small>{act.time}</small>
                <p>
                  <b>{act.desc}</b>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
