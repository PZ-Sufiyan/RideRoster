import React, { useState } from 'react'
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi'
import {
  resetPasswordWithCode,
  sendPasswordResetCode,
} from '../services/forgotPasswordService'
import { PASSWORD_RULES_HINT } from '../utils/passwordRules'

/**
 * Inline forgot-password flow: email → OTP code + new password.
 * @param {'admin' | 'superadmin'} variant - visual style to match login pages
 */
const ForgotPasswordPanel = ({ variant = 'admin', onBack }) => {
  const isSuper = variant === 'superadmin'

  const [step, setStep] = useState('request') // request | reset | done
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const accent = isSuper ? '#40829B' : '#005C7A'
  const accentHover = isSuper ? '#356b80' : '#004a63'

  const inputClass = isSuper
    ? 'w-full px-4 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#1F2937] placeholder:text-[#9CA3AF]'
    : 'w-full h-[48px] pl-12 pr-4 border border-gray-200 rounded-[10px] outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] text-gray-700 placeholder:text-gray-400'

  const inputWithToggleClass = isSuper
    ? 'w-full px-4 py-3.5 pr-12 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#1F2937] placeholder:text-[#9CA3AF]'
    : 'w-full h-[48px] pl-12 pr-12 border border-gray-200 rounded-[10px] outline-none focus:border-[#005C7A] focus:ring-1 focus:ring-[#005C7A] text-gray-700 placeholder:text-gray-400'

  const labelClass = isSuper
    ? 'block text-sm font-semibold text-[#374151] mb-2'
    : 'block text-[15px] font-semibold text-gray-800 mb-2'

  const primaryBtnClass = isSuper
    ? 'w-full py-4 px-6 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
    : 'w-full h-[48px] rounded-[10px] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setIsLoading(true)
    try {
      const normalized = await sendPasswordResetCode(email)
      setEmail(normalized)
      setStep('reset')
      setInfo('A verification code has been sent to your email.')
    } catch (err) {
      setError(err?.message || 'Unable to send reset code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setIsLoading(true)
    try {
      await sendPasswordResetCode(email)
      setInfo('A new verification code has been sent to your email.')
    } catch (err) {
      setError(err?.message || 'Unable to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setIsLoading(true)
    try {
      await resetPasswordWithCode({
        email,
        code,
        password,
        confirmPassword,
      })
      setStep('done')
    } catch (err) {
      setError(err?.message || 'Unable to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const title =
    step === 'done'
      ? 'Password Updated'
      : step === 'reset'
        ? 'Enter Code & New Password'
        : 'Forgot Password'

  const subtitle =
    step === 'done'
      ? 'Your password has been reset. You can sign in with your new password.'
      : step === 'reset'
        ? `Enter the code sent to ${email}, then choose a new password.`
        : 'Enter your email and we will send you a verification code.'

  return (
    <div className="w-full">
      <div className={isSuper ? 'text-center mb-8' : 'mb-6'}>
        <h2
          className={
            isSuper
              ? 'text-[28px] font-bold text-[#1F2937] mb-2'
              : 'text-[24px] md:text-[26px] font-semibold text-gray-900 mb-3 text-center md:text-left'
          }
        >
          {title}
        </h2>
        <p
          className={
            isSuper
              ? 'text-[#6B7280] text-[15px]'
              : 'text-[15px] text-gray-500 leading-7 text-center md:text-left'
          }
        >
          {subtitle}
        </p>
      </div>

      {error && (
        <div
          className={
            isSuper
              ? 'mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'
              : 'mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium'
          }
        >
          <p
            className={
              isSuper
                ? 'text-sm text-red-600 text-center font-medium'
                : undefined
            }
          >
            {error}
          </p>
        </div>
      )}

      {info && !error && step !== 'done' && (
        <div
          className={
            isSuper
              ? 'mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg'
              : 'mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium'
          }
        >
          <p
            className={
              isSuper
                ? 'text-sm text-emerald-700 text-center font-medium'
                : undefined
            }
          >
            {info}
          </p>
        </div>
      )}

      {step === 'request' && (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div>
            <label className={labelClass}>Email Address *</label>
            {isSuper ? (
              <input
                type="email"
                placeholder="admin@rideroster.com"
                className={inputClass}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.toLowerCase())
                  if (error) setError('')
                }}
                required
                autoFocus
              />
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiOutlineMail size={20} />
                </span>
                <input
                  type="email"
                  placeholder="admin@rideroster.com"
                  className={inputClass}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  required
                  autoFocus
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={primaryBtnClass}
            style={{ backgroundColor: accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accentHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = accent
            }}
          >
            {isLoading ? 'Sending code...' : 'Send Code'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm font-semibold hover:underline"
            style={{ color: accent }}
          >
            Back to Login
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className={labelClass}>Verification Code *</label>
            {isSuper ? (
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                className={inputClass}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\s/g, ''))
                  if (error) setError('')
                }}
                required
                autoFocus
              />
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiOutlineKey size={20} />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit code"
                  className={inputClass}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\s/g, ''))
                    if (error) setError('')
                  }}
                  required
                  autoFocus
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>New Password *</label>
            {isSuper ? (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="************"
                  className={inputWithToggleClass}
                  value={password}
                  maxLength={12}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showPassword ? (
                    <HiOutlineEyeOff size={20} />
                  ) : (
                    <HiOutlineEye size={20} />
                  )}
                </button>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiOutlineLockClosed size={20} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="************"
                  className={inputWithToggleClass}
                  value={password}
                  maxLength={12}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <HiOutlineEye size={20} />
                  ) : (
                    <HiOutlineEyeOff size={20} />
                  )}
                </button>
              </div>
            )}
            <p
              className={
                isSuper
                  ? 'mt-2 text-xs text-[#6B7280]'
                  : 'mt-2 text-xs text-gray-500'
              }
            >
              {PASSWORD_RULES_HINT}
            </p>
          </div>

          <div>
            <label className={labelClass}>Confirm Password *</label>
            {isSuper ? (
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="************"
                  className={inputWithToggleClass}
                  value={confirmPassword}
                  maxLength={12}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError('')
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showConfirm ? (
                    <HiOutlineEyeOff size={20} />
                  ) : (
                    <HiOutlineEye size={20} />
                  )}
                </button>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiOutlineLockClosed size={20} />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="************"
                  className={inputWithToggleClass}
                  value={confirmPassword}
                  maxLength={12}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError('')
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <HiOutlineEye size={20} />
                  ) : (
                    <HiOutlineEyeOff size={20} />
                  )}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={primaryBtnClass}
            style={{ backgroundColor: accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accentHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = accent
            }}
          >
            {isLoading ? 'Updating password...' : 'Reset Password'}
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="text-sm font-semibold hover:underline disabled:opacity-60"
              style={{ color: accent }}
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-semibold text-gray-500 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-5">
          <div
            className={
              isSuper
                ? 'p-3 bg-emerald-50 border border-emerald-200 rounded-lg'
                : 'px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium'
            }
          >
            <p
              className={
                isSuper
                  ? 'text-sm text-emerald-700 text-center font-medium'
                  : undefined
              }
            >
              Password updated successfully.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className={primaryBtnClass}
            style={{ backgroundColor: accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accentHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = accent
            }}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  )
}

export default ForgotPasswordPanel
