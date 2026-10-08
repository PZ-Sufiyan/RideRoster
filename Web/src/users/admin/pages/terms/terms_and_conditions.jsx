import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MdAdd, MdChevronLeft } from 'react-icons/md'
import { ToastStack } from '../../../../utils/Toast'
import { ShimmerBlock } from '../../../../utils/Shimmer'
import {
  formatTermsAudienceLabel,
  TERMS_AUDIENCE_LIST,
} from '../../../../utils/termsAudiences'
import {
  getTermsSummaryByAudience,
  listTermsVersionsForAudience,
  publishTermsVersion,
} from '../../../../services/termsService'
import { supabase } from '../../../../lib/supabaseClient'
import { formatLocalDate } from '../../../../utils/dateTime'

const TERMS_TITLE = 'Terms & Conditions'

const TermsAndConditionsAdmin = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState([])
  const [selectedAudience, setSelectedAudience] = useState(null)
  const [versions, setVersions] = useState([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [version, setVersion] = useState('')
  const [content, setContent] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [toasts, setToasts] = useState([])

  const pushToast = (type, message) => {
    setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, message }])
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getTermsSummaryByAudience()
      setSummary(rows)
    } catch (err) {
      console.error(err)
      pushToast('error', err?.message || 'Failed to load Terms & Conditions.')
      setSummary(
        TERMS_AUDIENCE_LIST.map((audience) => ({ audience, latest: null })),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const loadVersions = useCallback(async (audience) => {
    setVersionsLoading(true)
    try {
      const rows = await listTermsVersionsForAudience(audience)
      setVersions(rows)
    } catch (err) {
      console.error(err)
      pushToast('error', err?.message || 'Failed to load versions.')
      setVersions([])
    } finally {
      setVersionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    if (!selectedAudience) return
    loadVersions(selectedAudience)
  }, [selectedAudience, loadVersions])

  const existingVersionLabels = useMemo(
    () => new Set(versions.map((row) => String(row.version).trim())),
    [versions],
  )

  const openPublish = () => {
    setVersion('')
    setContent('')
    setPublishOpen(true)
  }

  const handlePublish = async () => {
    if (!selectedAudience) return
    const trimmedVersion = version.trim()
    if (!trimmedVersion) {
      pushToast('error', 'Please enter a version (e.g. 1.1.0).')
      return
    }
    if (existingVersionLabels.has(trimmedVersion)) {
      pushToast(
        'error',
        `Version "${trimmedVersion}" already exists for this user type. Choose a different version.`,
      )
      return
    }

    const trimmed = content.trim()
    if (!trimmed) {
      pushToast('error', 'Please enter the Terms & Conditions text.')
      return
    }

    setPublishing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      await publishTermsVersion({
        audience: selectedAudience,
        version: trimmedVersion,
        content: trimmed,
        createdByUserId: user?.id,
      })
      pushToast('success', 'New version published successfully.')
      setPublishOpen(false)
      await loadVersions(selectedAudience)
      await loadSummary()
    } catch (err) {
      console.error(err)
      pushToast('error', err?.message || 'Could not publish Terms & Conditions.')
    } finally {
      setPublishing(false)
    }
  }

  if (selectedAudience) {
    const audienceLabel = formatTermsAudienceLabel(selectedAudience)
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ToastStack toasts={toasts} onDismiss={removeToast} />

        <button
          type="button"
          onClick={() => {
            setSelectedAudience(null)
            setVersions([])
            setPublishOpen(false)
          }}
          className="inline-flex items-center gap-1 text-sm text-[#3B8097] hover:underline mb-4"
        >
          <MdChevronLeft size={20} />
          Back to overview
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{audienceLabel}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Terms apply only to your {audienceLabel.toLowerCase()} staff.
            </p>
          </div>
          <button
            type="button"
            onClick={openPublish}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3B8097] text-white text-sm font-medium hover:bg-[#326d82] transition-colors"
          >
            <MdAdd size={20} />
            Publish new version
          </button>
        </div>

        {versionsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Version
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Published
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {versions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      No Terms & Conditions published yet for this user type.
                    </td>
                  </tr>
                ) : (
                  versions.map((row, index) => {
                    const isLatest = index === 0 && row.published_at
                    return (
                      <tr key={row.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          v{row.version}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {row.published_at ? (
                            <span
                              className={
                                isLatest
                                  ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                                  : 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700'
                              }
                            >
                              {isLatest ? 'Active (latest)' : 'Previous'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Draft</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {row.published_at
                            ? formatLocalDate(row.published_at)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.title}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {publishOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Publish new version — {audienceLabel}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Your company&apos;s drivers/PAs of this type who have not accepted this
                  version will be prompted on next login.
                </p>
              </div>
              <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={TERMS_TITLE}
                    readOnly
                    aria-readonly="true"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 1.0.0 or 1.1.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3B8097] focus:border-[#3B8097]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be unique for this user type (not used before).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions text
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3B8097] focus:border-[#3B8097]"
                    placeholder="Enter the full terms text…"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => setPublishOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={publishing}
                  onClick={handlePublish}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#3B8097] rounded-lg hover:bg-[#326d82] disabled:opacity-60"
                >
                  {publishing ? 'Publishing…' : 'Publish version'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Terms & Conditions</h1>
      <p className="text-sm text-gray-500 mb-6">
        Publish versioned Terms & Conditions for your company&apos;s mobile staff (private
        and company drivers and PAs). Each user type is managed separately. Only the latest
        published version for that type is required at login.
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Latest version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.map(({ audience, latest }) => (
                <tr key={audience} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatTermsAudienceLabel(audience)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {latest ? `v${latest.version}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {latest ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Not configured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedAudience(audience)}
                      className="text-[#3B8097] font-medium hover:underline"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TermsAndConditionsAdmin
