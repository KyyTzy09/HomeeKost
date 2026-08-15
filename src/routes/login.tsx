import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { sanitizedLoginSchema } from '../common/validations/auth.schema.ts'
import { authClient } from '../lib/auth-client.ts'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      {
        title: 'Masuk — HomeeKost Management',
      },
    ],
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setAuthError(null)
      setIsLoading(true)

      try {
        // Validation & username sanitization via Zod Schema
        const validation = sanitizedLoginSchema.safeParse(value)

        if (!validation.success) {
          const firstError =
            validation.error.issues[0]?.message || 'Input yang dimasukkan tidak valid.'
          setAuthError(firstError)
          setIsLoading(false)
          return
        }

        const { email, password } = validation.data

        const res = await authClient.signIn.email({
          email,
          password,
        })

        if (res.error) {
          setAuthError(
            res.error.message || 'Email atau password yang Anda masukkan salah.',
          )
          setIsLoading(false)
          return
        }

        if (res.data) {
          navigate({ to: '/dashboard', replace: true })
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan pada sistem saat masuk.'
        setAuthError(errorMessage)
        setIsLoading(false)
      }
    },
  })

  return (
    <div className="fixed inset-0 min-h-screen bg-[#f5f8f5] z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-[430px] bg-white border border-[#e2e9e3] rounded-[24px] p-[34px] shadow-[0_20px_60px_rgba(47,69,55,0.10)]">
        {/* Brand Logo */}
        <img
          className="block w-[180px] max-h-[100px] object-contain mx-auto mb-6"
          src="/logo.png"
          alt="HomeeKost Logo"
        />

        <h1 className="text-[24px] font-bold text-center text-[#26372c] m-0 mb-2 leading-[1.2]">
          Masuk ke HomeeKost
        </h1>

        <p className="text-center text-[#7b897e] text-[13px] m-0 mb-[26px]">
          Kelola seluruh kosan dalam satu dashboard.
        </p>

        {/* Error Alert Box */}
        {authError && (
          <div
            className="bg-[#f7e9e8] border border-[#efd4d0] text-[#a65f5b] rounded-[10px] py-2.5 px-3.5 text-[11px] mb-4 text-center font-medium leading-relaxed"
            role="alert"
          >
            {authError}
          </div>
        )}

        <form
          id="loginForm"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          {/* Email / Username Field */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value || !value.trim()) return 'Email atau username wajib diisi'
                return undefined
              },
            }}
          >
            {(field) => {
              const hasError =
                field.state.meta.isTouched && field.state.meta.errors.length > 0
              return (
                <div className="mb-[15px]">
                  <label
                    htmlFor="loginUser"
                    className="block text-[11px] font-bold text-[#506257] mb-[7px]"
                  >
                    Email / Username
                  </label>
                  <input
                    id="loginUser"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="Masukkan username / email"
                    autoComplete="username"
                    className={`w-full h-[43px] border rounded-[11px] px-[13px] text-[12px] outline-none bg-[#fbfcfb] text-[#252925] box-border transition-all duration-150 ${hasError
                        ? 'border-[#b66b68] shadow-[0_0_0_3px_rgba(182,107,104,0.12)]'
                        : 'border-[#dfe7e0] focus:border-[#8fa594] focus:shadow-[0_0_0_3px_rgba(143,165,148,0.12)]'
                      }`}
                  />
                  {hasError && (
                    <div className="text-[#b66b68] text-[10px] mt-1 font-medium">
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              )
            }}
          </form.Field>

          {/* Password Field */}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'Password wajib diisi'
                if (value.length < 6) return 'Password minimal 6 karakter'
                return undefined
              },
            }}
          >
            {(field) => {
              const hasError =
                field.state.meta.isTouched && field.state.meta.errors.length > 0
              return (
                <div className="mb-[15px]">
                  <label
                    htmlFor="loginPass"
                    className="block text-[11px] font-bold text-[#506257] mb-[7px]"
                  >
                    Password
                  </label>
                  <input
                    id="loginPass"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="password"
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className={`w-full h-[43px] border rounded-[11px] px-[13px] text-[12px] outline-none bg-[#fbfcfb] text-[#252925] box-border transition-all duration-150 ${hasError
                        ? 'border-[#b66b68] shadow-[0_0_0_3px_rgba(182,107,104,0.12)]'
                        : 'border-[#dfe7e0] focus:border-[#8fa594] focus:shadow-[0_0_0_3px_rgba(143,165,148,0.12)]'
                      }`}
                  />
                  {hasError && (
                    <div className="text-[#b66b68] text-[10px] mt-1 font-medium">
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              )
            }}
          </form.Field>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] border-0 rounded-[11px] bg-[#6f8976] hover:bg-[#4f6958] text-white font-bold text-[13px] cursor-pointer mt-[5px] transition-colors duration-150 disabled:opacity-65 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Memproses Masuk...</span>
              </>
            ) : (
              <span>Masuk sebagai Admin</span>
            )}
          </button>
        </form>

        <div className="text-center text-[#9aa49c] text-[10px] mt-4">
          Demo prototype · data masih menggunakan data contoh
        </div>
      </div>
    </div>
  )
}
