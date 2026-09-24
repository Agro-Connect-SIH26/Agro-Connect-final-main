import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageHeader from '../components/PageHeader.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { fetchServiceRequests, updateServiceRequestStatus } from '../redux/slices/serviceRequestSlice.js'
import { updateServiceProvider } from '../redux/slices/serviceProviderSlice.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'
import { fmtInr } from '../utils/format.js'

export default function ServiceProviderDashboard() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const { list: requests, listStatus } = useSelector(state => state.serviceRequests)
  const { current: user } = useSelector(state => state.auth)
  const { list: providers } = useSelector(state => state.serviceProviders)

  const provider = providers.find(p => p.public_id === user?.activeServiceProviderId)

  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'table'
  const [activeTab, setActiveTab] = useState('Incoming')

  useEffect(() => {
    if (user?.activeServiceProviderId) {
      dispatch(fetchServiceRequests({ provider_public_id: user.activeServiceProviderId }))
    }
  }, [dispatch, user])

  usePageMeta({
    title: t('Provider Dashboard'),
    description: t('Manage service requests and profile.'),
  })

  const handleUpdateStatus = (publicId, status, provider_quote, notes) => {
    dispatch(updateServiceRequestStatus({ publicId, status, provider_quote, notes }))
      .unwrap()
      .then(() => dispatch(fetchServiceRequests({ provider_public_id: user.activeServiceProviderId })))
  }

  const handleUpdateCapacity = (e) => {
    e.preventDefault()
    const capacity = e.target.capacity.value
    dispatch(updateServiceProvider({
        publicId: provider.public_id,
        data: { capacity }
    }))
  }

  const incoming = requests.filter(r => r.status === 'REQUESTED')
  const active = requests.filter(r => ['ACCEPTED', 'IN_PROGRESS'].includes(r.status))
  const history = requests.filter(r => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(r.status))

  const tabs = {
    Incoming: incoming,
    Active: active,
    History: history
  }

  const kanbanColumns = [
    { key: 'REQUESTED', label: t('Requested'), items: incoming, border: 'border-primary-300', bg: 'bg-primary-50/50' },
    { key: 'ACCEPTED', label: t('Accepted / In Progress'), items: active, border: 'border-earth-300', bg: 'bg-earth-50/50' },
    { key: 'COMPLETED', label: t('Completed & Settled'), items: history, border: 'border-success-300', bg: 'bg-success-50/50' },
  ]

  return (
    <>
      <PageHeader
        title={t("Provider Dashboard")}
        description={t("Manage your requests, quotes, and active logistical capacity.")}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                viewMode === 'kanban' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
              }`}
            >
              {t("Kanban Board")}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                viewMode === 'table' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
              }`}
            >
              {t("Table View")}
            </button>
          </div>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="ac-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Incoming Requests")}</h3>
            <p className="mt-2 text-3xl font-display text-primary-600">{incoming.length}</p>
          </div>
          <div className="ac-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Active Jobs")}</h3>
            <p className="mt-2 text-3xl font-display text-earth-700">{active.length}</p>
          </div>
          <div className="ac-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">{t("Completed")}</h3>
            <p className="mt-2 text-3xl font-display text-success-700">{history.filter(r => r.status === 'COMPLETED').length}</p>
          </div>
        </div>

        {/* Capacity Settings */}
        {provider && (
          <div className="ac-card p-6 mb-8">
            <h2 className="text-base font-bold text-ink-900 mb-2">{t("Capacity Settings")}</h2>
            <p className="text-xs text-ink-500 mb-4">{t("Update your available fleet tonnage or cold warehouse volume.")}</p>
            <form onSubmit={handleUpdateCapacity} className="flex gap-4 items-end">
              <div className="flex-grow max-w-sm">
                <label className="block text-xs font-medium text-ink-700 mb-1">{t("Capacity")}</label>
                <input
                  name="capacity"
                  defaultValue={provider.capacity}
                  placeholder={t("e.g. 50 MT, 3 Mini-Trucks")}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <button type="submit" className="ac-btn-primary">
                {t("Update")}
              </button>
            </form>
          </div>
        )}

        {listStatus === 'loading' ? (
          <div className="ac-card p-12 text-center text-sm text-ink-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mb-3" />
            <p>{t("Loading requests…")}</p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kanbanColumns.map((col) => (
              <div key={col.key} className={`rounded-card border-2 ${col.border} ${col.bg} p-4 flex flex-col`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-ink-200">
                  <h3 className="font-bold text-sm text-ink-900">{col.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink-600 shadow-sm border border-ink-100">
                    {col.items.length}
                  </span>
                </div>

                <div className="space-y-3 flex-grow">
                  {col.items.length > 0 ? (
                    col.items.map((req) => (
                      <div key={req.public_id} className="ac-card p-4 bg-white shadow-sm border border-ink-200 hover:border-primary-400 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="ac-chip ac-chip-primary text-[10px]">
                            {t(req.service_type === 'TRANSPORT' ? 'Transport' : 'Cold Storage')}
                          </span>
                          <span className="text-[10px] font-mono text-ink-400">
                            {req.public_id}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-ink-900">
                          {req.crop_name} ({req.quantity} {t(req.quantity_unit || 'kg')})
                        </h4>
                        <p className="text-xs text-ink-600 mt-1">
                          👤 {req.farmer_name}
                        </p>
                        {req.farmer_contact && (
                          <p className="text-[11px] text-ink-500">
                            📞 {req.farmer_contact}
                          </p>
                        )}
                        {req.pickup_location && (
                          <p className="text-[11px] text-ink-500 mt-1">
                            📍 {t("Pickup")}: {req.pickup_location}
                          </p>
                        )}
                        {req.drop_location && (
                          <p className="text-[11px] text-ink-500">
                            🏁 {t("Drop")}: {req.drop_location}
                          </p>
                        )}

                        <div className="mt-4 pt-3 border-t border-ink-100 flex justify-end gap-2">
                          {req.status === 'REQUESTED' && (
                            <button
                              onClick={() => handleUpdateStatus(req.public_id, 'ACCEPTED', null, 'Accepted')}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
                            >
                              {t("Accept Job")}
                            </button>
                          )}
                          {['ACCEPTED', 'IN_PROGRESS'].includes(req.status) && (
                            <button
                              onClick={() => handleUpdateStatus(req.public_id, 'COMPLETED', null, 'Completed')}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-success-600 hover:bg-success-700 rounded-lg transition"
                            >
                              ✓ {t("Mark Completed")}
                            </button>
                          )}
                          {req.status === 'COMPLETED' && (
                            <span className="text-xs font-semibold text-success-700">
                              ✓ {t("Completed")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-32 flex items-center justify-center text-xs text-ink-400 italic">
                      {t("No jobs in this stage")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div>
            <div className="mb-4 flex gap-2">
              {Object.keys(tabs).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === tab ? 'bg-primary-600 text-white' : 'bg-earth-100 text-ink-700 hover:bg-earth-200'
                  }`}
                >
                  {t(tab)} ({tabs[tab].length})
                </button>
              ))}
            </div>

            <div className="ac-card overflow-hidden">
              <table className="min-w-full divide-y divide-ink-200">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">{t("Farmer")}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">{t("Request")}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">{t("Status")}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-ink-500 uppercase">{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {tabs[activeTab].length > 0 ? (
                    tabs[activeTab].map(req => (
                      <tr key={req.public_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                          {req.farmer_name}<br /><span className="text-xs text-ink-500">{req.farmer_contact}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-900">
                          {t(req.service_type === 'TRANSPORT' ? 'Transport' : 'Cold Storage')}: {req.crop_name} ({req.quantity} {t(req.quantity_unit || 'kg')})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="ac-chip ac-chip-earth">{t(req.status)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'REQUESTED' && (
                            <button
                              onClick={() => handleUpdateStatus(req.public_id, 'ACCEPTED', null, 'Accepted')}
                              className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                            >
                              {t("Accept")}
                            </button>
                          )}
                          {['ACCEPTED', 'IN_PROGRESS'].includes(req.status) && (
                            <button
                              onClick={() => handleUpdateStatus(req.public_id, 'COMPLETED', null, 'Completed')}
                              className="px-3 py-1 text-xs font-medium text-white bg-success-600 rounded-lg hover:bg-success-700"
                            >
                              {t("Complete")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-ink-500">
                        {activeTab === 'Incoming' && t("No incoming requests.")}
                        {activeTab === 'Active' && t("No active requests.")}
                        {activeTab === 'History' && t("No history requests.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
