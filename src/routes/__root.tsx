import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Link,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../common/integrations/tanstack-query/devtools.tsx'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'HomeeKost — Sistem Pengelolaan Kos Bude Frisda',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-[460px] bg-white border border-[#e2e9e3] rounded-[24px] p-8 shadow-[0_20px_60px_rgba(47,69,55,0.08)]">
        <img
          src="/logo.png"
          alt="HomeeKost Logo"
          className="w-36 max-h-16 object-contain mx-auto mb-5 opacity-90"
        />
        <div className="inline-block bg-[#f3f7f3] border border-[#dce7de] text-[#4f6958] text-[11px] font-bold px-3 py-1 rounded-full mb-3">
          404 · Halaman Tidak Ditemukan
        </div>
        <h1 className="text-[20px] font-bold text-[#26372c] m-0 mb-2">
          Halaman Belum Tersedia
        </h1>
        <p className="text-[#687a6e] text-[12px] m-0 mb-6 leading-relaxed">
          Halaman yang Anda tuju sedang dalam tahap integrasi operasional atau URL tidak sesuai.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center h-[38px] px-5 rounded-[10px] bg-[#6f8976] hover:bg-[#4f6958] text-white text-[12px] font-bold transition-colors no-underline"
          >
            Ke Dashboard
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-[38px] px-5 rounded-[10px] bg-white border border-[#dfe7e0] hover:bg-[#f6faf6] text-[#34463a] text-[12px] font-bold transition-colors no-underline"
          >
            Ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[#faf9f5] text-[#252925] font-sans antialiased selection:bg-[#e8f0ea] selection:text-[#4f6958]">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
