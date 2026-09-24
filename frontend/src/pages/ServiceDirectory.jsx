/**
 * ServiceDirectory.jsx — Directory for service providers (Transporters and Cold Storage).
 *
 * Farmers and buyers can browse providers and directly request logistics or cold storage services.
 */

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageHeader from '../components/PageHeader.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { fetchServiceProviders } from '../redux/slices/serviceProviderSlice.js'
import { createServiceRequest, fetchServiceRequests } from '../redux/slices/serviceRequestSlice.js'
import { selectRole, selectName, selectPhone, selectPublicId } from '../redux/slices/authSlice.js'
import Skeleton from '../components/Skeleton.jsx'
import { useLanguage } from '../hooks/LanguageContext.jsx'

export default function ServiceDirectory() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const { list: providers, listStatus } = useSelector(state => state.serviceProviders)
  const { list: requests, listStatus: requestsStatus } = useSelector(state => state.serviceRequests)
  const role = useSelector(selectRole)
  const userName = useSelector(selectName)
  const userPhone = useSelector(selectPhone)
  const userPublicId = useSelector(selectPublicId)

  const [activeTab, setActiveTab] = useState('All')
  const [modalProvider, setModalProvider] = useState(null)
  const [formData, setFormData] = useState({
    crop_name: '',
    crop_variety: '',
    quantity: '',
    quantity_unit: 'kg',
    pickup_location: '',
    destination: '',
    duration_days: '',
    preferred_date: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (listStatus === 'idle') {
      dispatch(fetchServiceProviders())
    }
    if (userPublicId) {
      dispatch(fetchServiceRequests({ farmer_user_public_id: userPublicId }))
    }
  }, [dispatch, listStatus, userPublicId])

  usePageMeta({
    title: t('Service Providers'),
    description: t('Find trusted logistics and storage facilities.'),
  })

  const filteredProviders = activeTab === 'All'
    ? providers
    : providers.filter(p => p.service_type === (activeTab === 'Logistics' ? 'TRANSPORT' : 'COLD_STORAGE'))

  const tabs = ['All', 'Logistics', 'Cold Storage', ...(userPublicId ? ['My Requests'] : [])]

  const handleOpenModal = (provider) => {
    setModalProvider(provider)
    setFormData({
      crop_name: '',
      crop_variety: '',
      quantity: '',
      quantity_unit: 'kg',
      pickup_location: '',
      destination: '',
      duration_days: '',
      preferred_date: '',
      notes: '',
    })
    setSuccessMessage('')
  }

  const handleCloseModal = () => {
    setModalProvider(null)
    setSubmitting(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!modalProvider) return

    setSubmitting(true)
    const payload = {
      farmer_user_public_id: userPublicId,
      farmer_name: userName || 'Farmer',
      farmer_contact: userPhone || '',
      provider_public_id: modalProvider.public_id,
      service_type: modalProvider.service_type,
      crop_name: formData.crop_name,
      crop_variety: formData.crop_variety,
      quantity: Number(formData.quantity),
      quantity_unit: formData.quantity_unit,
      pickup_location: formData.pickup_location,
      destination: formData.destination,
      duration_days: formData.duration_days ? Number(formData.duration_days) : null,
      preferred_date: formData.preferred_date,
      notes: formData.notes,
    }

    dispatch(createServiceRequest(payload))
      .unwrap()
      .then(() => {
        setSuccessMessage('Service request submitted successfully! The provider will review your request.')
        setTimeout(() => {
          handleCloseModal()
        }, 1800)
      })
      .catch((err) => {
        alert(err || 'Failed to submit service request')
        setSubmitting(false)
      })
  }

  return (
    <>
      <PageHeader
        eyebrow={t("Support")}
        title={t("Service Providers")}
        description={t("Local directory of logistics and storage facilities.")}
      />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`ac-chip ${activeTab === tab ? 'ac-chip-primary' : 'ac-chip-earth'}`}
            >
              {t(tab)}
            </button>
          ))}
        </div>


        {activeTab === 'My Requests' ? (
          requestsStatus === 'loading' ? (
            <div className="grid gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <div key={req.public_id} className="ac-card p-5 flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`ac-chip ${req.service_type === 'TRANSPORT' ? 'ac-chip-primary' : 'ac-chip-success'}`}>
                          {t(req.service_type === 'TRANSPORT' ? 'Transport' : 'Cold Storage')}
                        </span>
                        <span className={`ac-chip ${
                          req.status === 'COMPLETED' ? 'ac-chip-success' :
                          req.status === 'ACCEPTED' ? 'ac-chip-primary' :
                          req.status === 'REJECTED' || req.status === 'CANCELLED' ? 'ac-chip-rust' :
                          'ac-chip-honey'
                        }`}>
                          {t(req.status)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-ink-900">
                        {req.crop_name} {req.crop_variety ? `(${req.crop_variety})` : ''} — {req.quantity} {t(req.quantity_unit || 'kg')}
                      </h3>
                      {req.service_type === 'TRANSPORT' ? (
                        <p className="mt-1 text-xs text-ink-600">
                          {t("Route")}: <span className="font-medium text-ink-900">{req.pickup_location || t('Field')}</span> → <span className="font-medium text-ink-900">{req.destination || t('Destination')}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-ink-600">
                          {t("Storage Duration")}: <span className="font-medium text-ink-900">{req.duration_days || 1} {t("days")}</span>
                        </p>
                      )}
                      {req.preferred_date && (
                        <p className="mt-1 text-xs text-ink-500">{t("Scheduled")}: {req.preferred_date}</p>
                      )}
                      {req.notes && (
                        <p className="mt-1 text-xs text-ink-500 italic">{t("Notes")}: {req.notes}</p>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end min-w-[140px]">
                      {req.provider_quote != null ? (
                        <div className="mb-2">
                          <p className="text-xs text-ink-500">{t("Provider Quote")}</p>
                          <p className="text-lg font-bold text-primary-700">₹{req.provider_quote}</p>
                        </div>
                      ) : req.estimated_cost != null ? (
                        <div className="mb-2">
                          <p className="text-xs text-ink-500">{t("Estimated Cost")}</p>
                          <p className="text-sm font-semibold text-ink-800">₹{req.estimated_cost}</p>
                        </div>
                      ) : null}
                      <span className="text-[11px] text-ink-400">ID: {req.public_id}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="ac-card p-10 text-center text-ink-500">
                  {t("You haven't submitted any service requests yet.")}
                  <button onClick={() => setActiveTab('All')} className="block mt-2 text-primary-600">{t("Browse Providers")}</button>
                </div>
              )}
            </div>
          )
        ) : listStatus === 'loading' ? (
          <div className="grid gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <div key={provider.public_id} className="ac-card flex flex-col md:flex-row items-start justify-between p-6 gap-4">
                  <div className="flex-grow">
                    <span className={`ac-chip ${provider.service_type === 'TRANSPORT' ? 'ac-chip-primary' : 'ac-chip-success'} mb-2`}>
                      {t(provider.service_type === 'TRANSPORT' ? 'Transport' : 'Cold Storage')}
                    </span>
                    <h3 className="text-lg font-medium text-ink-900">{provider.name}</h3>
                    <p className="mt-1 text-sm text-ink-600">{provider.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {provider.vehicle_types && provider.vehicle_types.map((v) => (
                        <span key={v} className="ac-chip ac-chip-honey text-xs">{t(v)}</span>
                      ))}
                      {provider.tags && provider.tags.map((tag) => (
                        <span key={tag} className="ac-chip ac-chip-earth text-xs">{t(tag)}</span>
                      ))}
                    </div>

                    {provider.rate_description && (
                      <p className="mt-2 text-xs text-ink-500 font-semibold">{provider.rate_description}</p>
                    )}
                    {provider.capacity && (
                      <p className="mt-2 text-xs text-ink-500 font-semibold">{t("Capacity")}: {provider.capacity}</p>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end whitespace-nowrap min-w-[140px]">
                    <p className="text-xs text-ink-500">{t("Contact")}</p>
                    <p className="font-semibold text-ink-900">{provider.contact}</p>

                    <button
                      type="button"
                      onClick={() => handleOpenModal(provider)}
                      className="mt-3 ac-button ac-button-primary text-xs w-full justify-center"
                    >
                      {t(provider.service_type === 'TRANSPORT' ? 'Request Transport' : 'Request Storage')}
                    </button>


                    {provider.service_type === 'COLD_STORAGE' && provider.is_nhb && (
                      <a href="https://nhb.gov.in/" target="_blank" rel="noreferrer" className="mt-2 text-xs text-primary-600 hover:underline">
                        {t("View NHB Scheme")}
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="ac-card p-10 text-center text-ink-500">
                {t("No providers found in this category.")}
                <button onClick={() => setActiveTab('All')} className="block mt-2 text-primary-600">{t("Clear filters")}</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Request Service Modal */}
      {modalProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="ac-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-earth-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-ink-900">
                  {t(modalProvider.service_type === 'TRANSPORT' ? 'Request Transport' : 'Request Storage')}
                </h3>
                <p className="text-xs text-ink-500">{modalProvider.name}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-ink-400 hover:text-ink-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {successMessage ? (
              <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-medium text-center">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Crop Name")} *</label>
                    <input
                      type="text"
                      required
                      placeholder={t("e.g., Tomato")}
                      value={formData.crop_name}
                      onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                      className="ac-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Crop Variety")}</label>
                    <input
                      type="text"
                      placeholder={t("e.g., Hybrid")}
                      value={formData.crop_variety}
                      onChange={(e) => setFormData({ ...formData, crop_variety: e.target.value })}
                      className="ac-input w-full text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Quantity")} *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={t("e.g., 500")}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="ac-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Unit")}</label>
                    <select
                      value={formData.quantity_unit}
                      onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
                      className="ac-select w-full text-sm"
                    >
                      <option value="kg">{t("kg")}</option>
                      <option value="quintal">{t("quintal")}</option>
                      <option value="ton">{t("ton")}</option>
                    </select>
                  </div>
                </div>

                {modalProvider.service_type === 'TRANSPORT' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Pickup Location")}</label>
                      <input
                        type="text"
                        placeholder={t("Farm address / Mandi")}
                        value={formData.pickup_location}
                        onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                        className="ac-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Destination")}</label>
                      <input
                        type="text"
                        placeholder={t("Delivery Mandi / Warehouse")}
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className="ac-input w-full text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Duration (Days)")}</label>
                    <input
                      type="number"
                      min="1"
                      placeholder={t("e.g., 14")}
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                      className="ac-input w-full text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Preferred Date")}</label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="ac-input w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">{t("Notes / Instructions")}</label>
                  <textarea
                    rows="2"
                    placeholder={t("Specific handling instructions or timing details...")}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="ac-input w-full text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-earth-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="ac-button ac-button-outline text-xs"
                    disabled={submitting}
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="submit"
                    className="ac-button ac-button-primary text-xs"
                    disabled={submitting}
                  >
                    {submitting ? t('Submitting...') : t('Send Request')}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  )
}
