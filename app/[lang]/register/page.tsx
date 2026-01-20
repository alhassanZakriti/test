'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Er is een fout opgetreden')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Er is een fout opgetreden bij het aanmaken van je account')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img 
              src="/logo.svg" 
              alt="Modual Logo" 
              className="h-10 w-auto mx-auto"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Maak je account aan</h1>
          <p className="text-gray-600">Start vandaag nog met het bouwen van je website</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Volledige naam
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Jan Jansen"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="jouw@email.nl"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Minimaal 6 karakters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Account aanmaken...' : 'Account aanmaken'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Al een account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
            ← Terug naar home
          </Link>
        </div>
      </div>
    </div>
  )
}

