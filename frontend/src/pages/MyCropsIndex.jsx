/**
 * pages/MyCropsIndex.jsx — Farmer's Crop Portfolio Workspace.
 *
 * Restructured into a workspace rather than a generic list.
 * Each crop lot card in the portfolio is interactive, highlighting
 * status, buyer/market signals, and direct call-to-actions.
 */
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchMyCropLots } from '../redux/slices/cropLotSlice.js'
import { selectPublicId, selectIsSeller } from '../redux/slices/authSlice.js'
import { fmtKg } from '../utils/format.js'
import PageHeader from '../components/PageHeader.jsx'
import CropImage from '../components/CropImage.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'

function MyCropsIndex() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const isSeller = useSelector(selectIsSeller)
  const { list, listStatus } = useSelector((s) => s.cropLots)

  usePageMeta({
    title: t('My Crop Portfolio'),
    description: t('Manage your crop inventory, analyze market value, and initiate sales.'),
  })

  useEffect(() => {
    if (isSeller) dispatch(fetchMyCropLots())
  }, [dispatch, isSeller])

  const sortedLots = useMemo(() => {
    const rows = Array.isArray(list) ? [...list] : []
    return rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  }, [list])

  return (
    <div className="bg-earth-50 min-h-screen">
      <PageHeader
        title={t("My Crop Portfolio")}
        description={t("Track your harvest inventory, review market signals, and analyze selling channels for each lot.")}
        actions={
          <Link to="/seller/crop-lots/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2 font-semibold text-white hover:bg-primary-800">
            + {t("Add New Lot")}
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {listStatus === 'succeeded' && sortedLots.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-earth-200">
            <h3 className="text-lg font-bold text-ink-900">{t("No crops in portfolio")}</h3>
            <p className="mt-2 text-ink-600">{t("Start your first harvest entry to begin tracking real-time market value.")}</p>
            <Link to="/seller/crop-lots/new" className="mt-6 inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-medium">{t("Create first lot")}</Link>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedLots.map((lot) => (
            <div key={lot.public_id} className="bg-white rounded-2xl border border-earth-200 shadow-sm p-5 flex flex-col hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <CropImage crop={lot.crop_name} className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-ink-900 truncate">{lot.crop_name}</h3>
                  <p className="text-sm text-ink-500 truncate">{lot.crop_variety}</p>
                  <span className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    lot.status === 'ACTIVE' ? 'bg-success-100 text-success-800' : 'bg-earth-100 text-ink-600'
                  }`}>
                    {t(lot.status)}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm border-t border-earth-100 pt-4">
                <div>
                  <p className="text-xs text-ink-500">{t("Quantity")}</p>
                  <p className="font-semibold text-ink-900">{fmtKg(lot.quantity, lot.quantity_unit)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">{t("Location")}</p>
                  <p className="font-semibold text-ink-900 truncate">{lot.location}</p>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <Link to={`/seller/crop-lots/${lot.public_id}`} className="block w-full py-2.5 text-center text-sm font-semibold text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition">
                  {t("View selling options")} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default MyCropsIndex
