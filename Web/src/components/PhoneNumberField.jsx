import PhoneInput, { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import './PhoneNumberField.css'

export { isValidPhoneNumber }

const VARIANT_UI = {
    default: {
        gap: 'gap-1.5',
        label: 'text-sm font-medium text-gray-700',
        control: 'rounded-lg',
        error: 'text-xs text-red-600 font-medium',
    },
    driver: {
        gap: 'gap-2',
        label: 'text-xs font-semibold text-gray-700',
        control: 'rounded-xl',
        error: 'text-xs text-red-600 font-medium',
    },
    passenger: {
        gap: 'gap-1.5',
        label: 'text-[12px] font-semibold text-gray-700',
        control: 'rounded-lg',
        error: 'text-[11px] font-semibold text-red-600',
    },
    register: {
        gap: 'gap-1.5',
        label: 'text-[14px] font-bold text-[#1e293b]',
        control: 'rounded-xl',
        error: 'text-[12px] text-red-500 font-bold',
    },
}

/**
 * Format/length/country-structure check only — does not send an OTP or prove ownership.
 */
export function getPhoneValidationError(value, { required = false, label = 'Phone number' } = {}) {
    const phone = String(value || '').trim()
    if (!phone) return required ? `${label} is required.` : ''
    if (!isValidPhoneNumber(phone)) {
        return `Enter a valid ${label.toLowerCase()} for the selected country.`
    }
    return ''
}

/** Best-effort convert stored numbers to E.164 for the input value. */
export function toE164Value(raw, defaultCountry = 'GB') {
    const value = String(raw || '').trim()
    if (!value) return ''
    if (isValidPhoneNumber(value)) return value
    try {
        const parsed = parsePhoneNumber(value, defaultCountry)
        if (parsed?.isValid?.()) return parsed.number
        if (parsed?.number) return parsed.number
    } catch {
        /* keep original so the user can correct it */
    }
    return value
}

export default function PhoneNumberField({
    label,
    required = false,
    value,
    onChange,
    onBlur,
    showError = false,
    errorText,
    className = '',
    placeholder = 'Enter phone number',
    defaultCountry = 'GB',
    variant = 'default',
    disabled = false,
}) {
    const ui = VARIANT_UI[variant] || VARIANT_UI.default
    const computedError = getPhoneValidationError(value, { required, label: label || 'Phone number' })
    const error = errorText || computedError
    const visibleError = showError && error

    return (
        <div className={`flex flex-col ${ui.gap} ${className}`}>
            {label && (
                <label className={ui.label}>
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div
                data-variant={variant}
                className={`rr-phone-field w-full border bg-white transition-colors ${ui.control} ${
                    disabled ? 'bg-gray-50 cursor-not-allowed' : ''
                } ${
                    visibleError
                        ? 'border-red-400 text-red-700 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500'
                        : 'border-gray-200 focus-within:border-[#005580] focus-within:ring-1 focus-within:ring-[#005580]'
                }`}
            >
                <PhoneInput
                    international
                    defaultCountry={defaultCountry}
                    countryCallingCodeEditable={false}
                    limitMaxLength
                    value={value || undefined}
                    onChange={(next) => onChange(next || '')}
                    disabled={disabled}
                    placeholder={placeholder}
                    numberInputProps={{
                        autoComplete: 'tel',
                        onBlur,
                    }}
                />
            </div>
            {visibleError && <p className={ui.error}>{error}</p>}
        </div>
    )
}
