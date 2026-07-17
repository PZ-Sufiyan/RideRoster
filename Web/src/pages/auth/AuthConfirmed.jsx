import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getPostConfirmDestination } from '../../utils/authRedirects'

/**
 * Landed here after Supabase verifies the email confirmation link.
 * Routes each role to the correct login/home page (never to Studio).
 */
const AuthConfirmed = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('Confirming your email…')

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      try {
        // Pick up tokens from the URL hash/query if present.
        const { data: sessionData } = await supabase.auth.getSession()
        let role =
          sessionData?.session?.user?.app_metadata?.role ||
          sessionData?.session?.user?.user_metadata?.role ||
          searchParams.get('role') ||
          ''

        // Email is confirmed; do not keep an accidental web session
        // (drivers/PAs use the mobile app; admins should log in explicitly).
        if (sessionData?.session) {
          await supabase.auth.signOut()
        }

        if (cancelled) return

        setMessage('Email confirmed. Redirecting…')
        const dest = getPostConfirmDestination(role)
        navigate(dest, { replace: true })
      } catch (err) {
        if (cancelled) return
        console.error('Auth confirm redirect failed:', err)
        setMessage('Email confirmed. You can close this tab and sign in.')
        navigate('/home?verified=1', { replace: true })
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10 text-center">
        <p className="text-lg font-semibold text-gray-900">{message}</p>
        <p className="mt-3 text-sm text-gray-500">
          If you are not redirected, open the correct login page for your account.
        </p>
      </div>
    </div>
  )
}

export default AuthConfirmed
