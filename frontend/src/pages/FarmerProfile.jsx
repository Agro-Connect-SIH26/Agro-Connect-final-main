import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectRole,
  selectName,
  selectEmail,
  selectPhone,
  selectPublicId,
  selectIsDemo,
  selectActiveFpo,
  selectVerificationStatus,
  selectVerificationDetails,
  updateProfile,
  submitVerification,
} from '../redux/slices/authSlice.js'
import useCredibility from '../hooks/useCredibility.js'
import PageHeader from '../components/PageHeader.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import CredibilityBadge from '../components/CredibilityBadge.jsx'
import { useLanguage } from '../hooks/LanguageContext.jsx'

export default function FarmerProfile() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const role = useSelector(selectRole)
  const name = useSelector(selectName)
  const email = useSelector(selectEmail)
  const phone = useSelector(selectPhone)
  const publicId = useSelector(selectPublicId)
  const isDemo = useSelector(selectIsDemo)
  const activeFpo = useSelector(selectActiveFpo)
  const verificationStatus = useSelector(selectVerificationStatus)
  const verificationDetails = useSelector(selectVerificationDetails)

  const { credibility } = useCredibility(publicId, role)

  usePageMeta({
    title: t('Farmer Profile'),
  })

  // Edit Profile state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError] = useState(null)

  // Verification Modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [verifyDocType, setVerifyDocType] = useState('AADHAAR')
  const [verifyDocNumber, setVerifyDocNumber] = useState('')
  const [verifySubmitting, setVerifySubmitting] = useState(false)
  const [verifyError, setVerifyError] = useState(null)
  const [verifyFeedback, setVerifyFeedback] = useState(null)

  useEffect(() => {
    setEditName(name || '')
    setEditPhone(phone || '')
  }, [name, phone])

  const handleStartEdit = () => {
    setEditName(name || '')
    setEditPhone(phone || '')
    setSaveError(null)
    setSaveStatus('idle')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditName(name || '')
    setEditPhone(phone || '')
    setSaveError(null)
    setSaveStatus('idle')
    setIsEditing(false)
  }

  const handleSaveProfile = async (e) => {
    e?.preventDefault()
    if (!editName.trim()) {
      setSaveError('Name cannot be empty')
      return
    }
    setSaveStatus('saving')
    setSaveError(null)
    try {
      await dispatch(
        updateProfile({
          name: editName.trim(),
          phone: editPhone.trim(),
        })
      ).unwrap()
      setSaveStatus('saved')
      setIsEditing(false)
      setTimeout(() => setSaveStatus('idle'), 3500)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(typeof err === 'string' ? err : 'Failed to update profile')
    }
  }

  const handleOpenVerifyModal = () => {
    setVerifyDocType('AADHAAR')
    setVerifyDocNumber('')
    setVerifyError(null)
    setVerifyFeedback(null)
    setIsVerifyModalOpen(true)
  }

  const handleCloseVerifyModal = () => {
    setIsVerifyModalOpen(false)
    setVerifyError(null)
  }

  const handleSubmitVerify = async (e) => {
    e?.preventDefault()
    if (!verifyDocNumber.trim()) {
      setVerifyError('Please enter document identification number')
      return
    }
    setVerifySubmitting(true)
    setVerifyError(null)
    try {
      const res = await dispatch(
        submitVerification({
          documentType: verifyDocType,
          documentNumber: verifyDocNumber.trim(),
        })
      ).unwrap()
      setVerifyFeedback(res.message || 'Verification submitted for review')
      setTimeout(() => {
        setIsVerifyModalOpen(false)
        setVerifySubmitting(false)
      }, 1200)
    } catch (err) {
      setVerifySubmitting(false)
      setVerifyError(typeof err === 'string' ? err : 'Verification submission failed')
    }
  }

  const renderVerificationBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {t("Verified")}
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-honey-100 px-2.5 py-1 text-xs font-semibold text-honey-800">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {t("Verification Pending")}
          </span>
        )
      case 'NOT_VERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {t("Not Verified")}
          </span>
        )
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={t("Account")}
        title={t("My Profile")}
        description={t("Your contact information, account verification status, and platform credibility score.")}
        actions={
          !isEditing ? (
            <button
              onClick={handleStartEdit}
              className="ac-btn-secondary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("Edit Profile")}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saveStatus === 'saving'}
                className="ac-btn-secondary"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saveStatus === 'saving'}
                className="ac-btn-primary"
              >
                {saveStatus === 'saving' ? t('Saving...') : t('Save Changes')}
              </button>
            </div>
          )
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {saveStatus === 'saved' && (
          <div className="mb-6 rounded-lg border border-success-200 bg-success-50 p-4 text-sm text-success-800">
            {t("Profile updated successfully.")}
          </div>
        )}
        {saveError && (
          <div className="mb-6 rounded-lg border border-rust-200 bg-rust-50 p-4 text-sm text-rust-700">
            {t(saveError)}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: Identity & Credibility Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="ac-card flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-3xl font-semibold text-primary-800">
                {(name || email || 'A').trim().slice(0, 1).toUpperCase()}
              </div>
              <h2 className="mt-4 text-xl font-medium text-ink-900">
                {name || t('Farmer')}
              </h2>
              <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                <span className="ac-chip ac-chip-primary">{t("Farmer / Seller")}</span>
                {isDemo && (
                  <span className="ac-chip ac-chip-earth">
                    {t("Demo Account")}
                  </span>
                )}
              </div>

              <div className="mt-6 w-full text-left">
                <p className="ac-section-label mb-2 text-center text-xs">
                  {t("Credibility Rating")}
                </p>
                <div className="flex justify-center">
                  {credibility ? (
                    <CredibilityBadge credibility={credibility} />
                  ) : (
                    <span className="ac-chip ac-chip-ink text-xs">
                      {t("Not yet rated")}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-center text-xs text-ink-400">
                  {t("Platform trust score based on order fulfillment and trading history.")}
                </p>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="ac-card p-5">
              <h4 className="text-sm font-semibold text-ink-800">{t("Account Summary")}</h4>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-earth-100">
                  <dt className="text-ink-500">{t("Account ID")}</dt>
                  <dd className="font-mono text-ink-800">{publicId || '—'}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-earth-100">
                  <dt className="text-ink-500">{t("Verification")}</dt>
                  <dd>{renderVerificationBadge(verificationStatus)}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-ink-500">{t("FPO Affiliated")}</dt>
                  <dd className="text-ink-800">{activeFpo?.name ? t('Yes') : t('No')}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right: Info Sections */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Verification Section */}
            <div className="ac-card">
              <div className="border-b border-earth-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-ink-900">
                    {t("Account Verification")}
                  </h3>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {t("Identity validation status for farmer-buyer safety")}
                  </p>
                </div>
                <div>{renderVerificationBadge(verificationStatus)}</div>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    {verificationStatus === 'NOT_VERIFIED' && (
                      <>
                        <p className="text-sm font-medium text-ink-900">
                          {t("Your account is not verified yet")}
                        </p>
                        <p className="text-xs text-ink-500 max-w-md">
                          {t("Account verification helps build trust between farmers and buyers. Complete verification to get higher priority in market inquiries.")}
                        </p>
                      </>
                    )}
                    {verificationStatus === 'PENDING' && (
                      <>
                        <p className="text-sm font-medium text-honey-900">
                          {t("Verification request submitted")}
                        </p>
                        <p className="text-xs text-ink-500 max-w-md">
                          {t("Your KYC details")} {verificationDetails?.documentType ? `(${verificationDetails.documentType} ${t("ending in")} ${verificationDetails.documentNumber})` : ''} {t("are currently under review.")}
                        </p>
                      </>
                    )}
                    {verificationStatus === 'VERIFIED' && (
                      <>
                        <p className="text-sm font-medium text-success-900">
                          {t("Account is verified")}
                        </p>
                        <p className="text-xs text-ink-500 max-w-md">
                          {t("Your identity has been verified through AgroConnect.")}
                        </p>
                      </>
                    )}
                  </div>

                  <div>
                    {verificationStatus === 'NOT_VERIFIED' && (
                      <button
                        onClick={handleOpenVerifyModal}
                        className="ac-btn-primary text-xs"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {t("Verify Account")}
                      </button>
                    )}
                    {verificationStatus === 'PENDING' && (
                      <button
                        onClick={handleOpenVerifyModal}
                        className="ac-btn-secondary text-xs"
                      >
                        {t("View Submission")}
                      </button>
                    )}
                    {verificationStatus === 'VERIFIED' && (
                      <span className="inline-flex items-center text-xs text-success-700 font-medium gap-1">
                        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {t("KYC Completed")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-earth-100 flex items-center justify-between text-xs text-ink-400">
                  <span>{t("Note: Verification status is separate from your credibility rating.")}</span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="ac-card">
              <div className="border-b border-earth-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-ink-900">
                  {t("Personal Information")}
                </h3>
                {isEditing && (
                  <span className="text-xs text-ink-500">{t("Editing mode")}</span>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1.5">
                      {t("Full Name *")}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t("Enter full name")}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1.5">
                      {t("Email Address")}
                    </label>
                    <input
                      type="email"
                      value={email || ''}
                      disabled
                      className="w-full rounded-lg border border-ink-100 bg-earth-50 px-3 py-2 text-sm text-ink-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-ink-400">
                      {t("Login email address cannot be changed.")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1.5">
                      {t("Phone Number")}
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder={t("e.g. +91 98765 43210")}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-earth-100">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saveStatus === 'saving'}
                      className="ac-btn-secondary"
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={saveStatus === 'saving'}
                      className="ac-btn-primary"
                    >
                      {saveStatus === 'saving' ? t('Saving...') : t('Save Changes')}
                    </button>
                  </div>
                </form>
              ) : (
                <ul className="divide-y divide-earth-100">
                  <li className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-500">
                        {t("Full Name")}
                      </span>
                      <span className="text-sm text-ink-900 font-medium">
                        {name || t('Not provided')}
                      </span>
                    </div>
                  </li>
                  <li className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-500">
                        {t("Email address")}
                      </span>
                      <span className="text-sm text-ink-900">
                        {email || t('Not provided')}
                      </span>
                    </div>
                  </li>
                  <li className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-500">
                        {t("Phone number")}
                      </span>
                      <span className="text-sm text-ink-900">
                        {phone || t('Not provided')}
                      </span>
                    </div>
                  </li>
                  <li className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-500">
                        {t("Account ID")}
                      </span>
                      <span className="text-sm text-ink-900 font-mono">
                        {publicId || t('Not provided')}
                      </span>
                    </div>
                  </li>
                  <li className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-500">
                        {t("Verification Status")}
                      </span>
                      <div>{renderVerificationBadge(verificationStatus)}</div>
                    </div>
                  </li>
                </ul>
              )}
            </div>

            {/* Farm & Location Details */}
            <div className="ac-card">
              <div className="border-b border-earth-100 px-6 py-4">
                <h3 className="text-lg font-medium text-ink-900">
                  {t("Farm Location & Output")}
                </h3>
              </div>
              <ul className="divide-y border-earth-100">
                {[
                  { label: t('State'), value: t('Not provided') },
                  { label: t('District'), value: t('Not provided') },
                  { label: t('PIN Code'), value: t('Not provided') },
                  { label: t('Farm / Location'), value: t('Not provided') },
                  { label: t('Main crop / Output'), value: t('Not provided') },
                  { label: t('FPO Affiliation'), value: activeFpo?.name || t('Not affiliated') },
                ].map((item) => (
                  <li key={item.label} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-500">
                        {item.label}
                      </span>
                      <span className="text-sm text-ink-900">
                        {item.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Verification Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
          <div className="ac-card w-full max-w-lg p-6 shadow-xl animate-fade-in relative bg-white">
            <div className="flex items-center justify-between border-b border-earth-100 pb-3">
              <div>
                <h3 className="text-lg font-medium text-ink-900">
                  {t("Verify Account")}
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  {t("Account verification helps build trust between farmers and buyers.")}
                </p>
              </div>
              <button
                onClick={handleCloseVerifyModal}
                className="text-ink-400 hover:text-ink-700 p-1 rounded-md"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Prototype / Demo Notice */}
            <div className="my-4 rounded-lg border border-honey-300 bg-honey-50 p-3 text-xs text-honey-900">
              <p className="font-semibold mb-1">
                {t("Demo Verification Workflow")}
              </p>
              <p>
                {t("Production will use DigiLocker/API Setu or an equivalent verified KYC provider. Submitting this demo verification will move your status to")} <strong className="font-semibold">{t("Verification Pending")}</strong>.
              </p>
            </div>

            {verifyFeedback && (
              <div className="mb-4 rounded-lg border border-success-200 bg-success-50 p-3 text-xs text-success-800">
                {t(verifyFeedback)}
              </div>
            )}
            {verifyError && (
              <div className="mb-4 rounded-lg border border-rust-200 bg-rust-50 p-3 text-xs text-rust-700">
                {t(verifyError)}
              </div>
            )}

            <form onSubmit={handleSubmitVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">
                  {t("Farmer Name (Confirmed)")}
                </label>
                <input
                  type="text"
                  value={name || t('Farmer')}
                  disabled
                  className="w-full rounded-lg border border-ink-100 bg-earth-50 px-3 py-2 text-sm text-ink-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">
                  {t("Registered Phone")}
                </label>
                <input
                  type="text"
                  value={phone || t('Not provided')}
                  disabled
                  className="w-full rounded-lg border border-ink-100 bg-earth-50 px-3 py-2 text-sm text-ink-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">
                  {t("KYC Document Type *")}
                </label>
                <select
                  value={verifyDocType}
                  onChange={(e) => setVerifyDocType(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="AADHAAR">{t("Aadhaar Card (UIDAI)")}</option>
                  <option value="PAN">{t("PAN Card (Income Tax Dept)")}</option>
                  <option value="KISAN_CARD">{t("Kisan Credit Card (KCC)")}</option>
                  <option value="VOTER_ID">{t("Voter ID (Election Commission)")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">
                  {t("Document Identification Number *")}
                </label>
                <input
                  type="text"
                  value={verifyDocNumber}
                  onChange={(e) => setVerifyDocNumber(e.target.value)}
                  placeholder={t("e.g. 5432-8765-9876 or ABCDE1234F")}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  required
                />
                <p className="mt-1 text-[11px] text-ink-400">
                  {t("For security, only the document type and last 4 digits are stored in the demo audit record.")}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-earth-100">
                <button
                  type="button"
                  onClick={handleCloseVerifyModal}
                  disabled={verifySubmitting}
                  className="ac-btn-secondary text-xs"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={verifySubmitting || verificationStatus === 'VERIFIED'}
                  className="ac-btn-primary text-xs"
                >
                  {verifySubmitting ? t('Submitting...') : t('Submit Verification')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
