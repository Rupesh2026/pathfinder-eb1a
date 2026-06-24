'use client'

import { useState } from 'react'
import { saveOnboarding } from '@/app/actions/onboarding'
import ErrorMessage from '@/components/ErrorMessage'
import {
  CRITERION_LABELS,
  SALARY_BAND_LABELS,
  ALL_CRITERIA,
  type CriterionType,
  type SalaryBand,
} from '@/lib/types'

type EvidenceItem = {
  criterion: CriterionType | ''
  title: string
  description: string
  url: string
}

const SALARY_BANDS = Object.keys(SALARY_BAND_LABELS) as SalaryBand[]

function emptyEvidence(): EvidenceItem {
  return { criterion: '', title: '', description: '', url: '' }
}

type ProfileFields = {
  name: string
  domain: string
  role: string
  salary_band: string
  country_of_origin: string
  target_field: string
}

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([emptyEvidence()])
  const [profile, setProfile] = useState<ProfileFields>({
    name: '',
    domain: '',
    role: '',
    salary_band: '',
    country_of_origin: '',
    target_field: '',
  })

  function updateProfile(field: keyof ProfileFields, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  function updateEvidence(index: number, field: keyof EvidenceItem, value: string) {
    setEvidenceItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function addEvidence() {
    setEvidenceItems((prev) => [...prev, emptyEvidence()])
  }

  function removeEvidence(index: number) {
    setEvidenceItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    // Re-inject Step 1 values — they're unmounted from the DOM when Step 2 is shown
    formData.set('name', profile.name)
    formData.set('domain', profile.domain)
    formData.set('role', profile.role)
    formData.set('salary_band', profile.salary_band)
    formData.set('country_of_origin', profile.country_of_origin)
    formData.set('target_field', profile.target_field)
    formData.set('evidence', JSON.stringify(evidenceItems))
    const result = await saveOnboarding(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set up your profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Step {step} of 2 — {step === 1 ? 'Your background' : 'Your existing evidence'}
        </p>
        <div className="mt-3 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
        </div>
      </div>

      <ErrorMessage message={error} />

      <form action={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                placeholder="e.g. Jane Doe"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                Domain / Field
              </label>
              <input
                id="domain"
                name="domain"
                type="text"
                required
                value={profile.domain}
                onChange={(e) => updateProfile('domain', e.target.value)}
                placeholder="e.g. AI/ML, Biotech, Computer Vision"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Current Role / Title
              </label>
              <input
                id="role"
                name="role"
                type="text"
                required
                value={profile.role}
                onChange={(e) => updateProfile('role', e.target.value)}
                placeholder="e.g. Senior ML Engineer, Research Scientist"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="salary_band" className="block text-sm font-medium text-gray-700">
                Annual Compensation Band
              </label>
              <select
                id="salary_band"
                name="salary_band"
                required
                value={profile.salary_band}
                onChange={(e) => updateProfile('salary_band', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a range</option>
                {SALARY_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {SALARY_BAND_LABELS[band]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="country_of_origin" className="block text-sm font-medium text-gray-700">
                Country of Origin / Birth
              </label>
              <input
                id="country_of_origin"
                name="country_of_origin"
                type="text"
                required
                value={profile.country_of_origin}
                onChange={(e) => updateProfile('country_of_origin', e.target.value)}
                placeholder="e.g. India, China, Brazil"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="target_field" className="block text-sm font-medium text-gray-700">
                Target Field for EB-1A Petition
              </label>
              <input
                id="target_field"
                name="target_field"
                type="text"
                required
                value={profile.target_field}
                onChange={(e) => updateProfile('target_field', e.target.value)}
                placeholder="e.g. Machine Learning, Natural Language Processing"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Next: Add evidence
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Add at least one piece of existing evidence. You can add more later — agents will help score and strengthen your case.
            </div>

            {evidenceItems.map((item, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Evidence #{index + 1}</span>
                  {evidenceItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEvidence(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    EB-1A Criterion
                  </label>
                  <select
                    value={item.criterion}
                    onChange={(e) => updateEvidence(index, 'criterion', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Select a criterion</option>
                    {ALL_CRITERIA.map((c) => (
                      <option key={c} value={c}>{CRITERION_LABELS[c]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title / Name of Evidence
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateEvidence(index, 'title', e.target.value)}
                    required
                    placeholder="e.g. NeurIPS 2024 paper, Forbes 30 Under 30 nomination"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateEvidence(index, 'description', e.target.value)}
                    rows={3}
                    placeholder="Brief description of this evidence and its significance"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={item.url}
                    onChange={(e) => updateEvidence(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addEvidence}
              className="w-full rounded-md border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
            >
              + Add another evidence item
            </button>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Save and go to dashboard
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
