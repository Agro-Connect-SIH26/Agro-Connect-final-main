/**
 * pages/CreateCropLot.jsx — The Smart Sell Wizard.
 *
 * Re-architected as a 5-step guided wizard:
 * 1. Crop Selection (Crop + Variety)
 * 2. Quantity & Unit
 * 3. Harvest Timing
 * 4. Farm Location
 * 5. Quality, Price & Storage
 *
 * Submits to POST /api/crop-lots. Upon success, navigates to the lot's
 * detail page, where the farmer can then run Decision Support analysis.
 */
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { createCropLot, clearCreateState } from '../redux/slices/cropLotSlice.js'
import PageHeader from '../components/PageHeader.jsx'
import CropImage from '../components/CropImage.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import { useLanguage } from '../hooks/LanguageContext.jsx'

const FIELD =
  'mt-1 block w-full rounded-xl border border-earth-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500'

function WizardStep({ title, subtitle, children }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-600">{subtitle}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  )
}

function CreateCropLot() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { createStatus, createError, createdLot } = useSelector((state) => state.cropLots)
  const [step, setStep] = useState(1)

  usePageMeta({
    title: t('Smart Sell Wizard'),
    description: t('List your crop in 5 simple steps.'),
  })

  const [formData, setFormData] = useState({
    crop_name: '',
    crop_variety: '',
    quantity: '',
    quantity_unit: 'quintal',
    harvest_date: '',
    location: '',
    preferred_selling_radius_km: '',
    farmer_quality_notes: '',
    minimum_acceptable_price: '',
    price_currency: 'INR',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    const payload = {
      crop_name: formData.crop_name.trim(),
      crop_variety: formData.crop_variety.trim(),
      quantity: parseFloat(formData.quantity),
      quantity_unit: formData.quantity_unit,
      harvest_date: formData.harvest_date,
      location: formData.location.trim(),
      price_currency: formData.price_currency,
      ...(formData.preferred_selling_radius_km && { preferred_selling_radius_km: parseFloat(formData.preferred_selling_radius_km) }),
      ...(formData.farmer_quality_notes.trim() && { farmer_quality_notes: formData.farmer_quality_notes.trim() }),
      ...(formData.minimum_acceptable_price && { minimum_acceptable_price: parseFloat(formData.minimum_acceptable_price) }),
    }

    const result = await dispatch(createCropLot(payload))
    if (createCropLot.fulfilled.match(result)) {
      dispatch(clearCreateState())
      navigate(`/seller/crop-lots/${result.payload.public_id}`)
    }
  }

  const progress = (step / 5) * 100

  return (
    <div className="min-h-screen bg-earth-50 pb-20">
      <PageHeader
        eyebrow={t("Selling Workspace")}
        title={t("Smart Sell Wizard")}
        back={{ to: '/seller', label: t('Dashboard') }}
      />

      <div className="mx-auto max-w-xl mt-6 px-4">
        {/* Progress Bar */}
        <div className="mb-8 h-2 w-full rounded-full bg-earth-200">
          <div className="h-full rounded-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-earth-200">
          {step === 1 && (
            <WizardStep title={t("Step 1: What are you selling?")} subtitle={t("Define the crop and its variety.")}>
              <input name="crop_name" value={formData.crop_name} onChange={handleChange} placeholder={t("Crop name (e.g. Tomato)")} className={FIELD} />
              <input name="crop_variety" value={formData.crop_variety} onChange={handleChange} placeholder={t("Variety (e.g. Roma)")} className={FIELD} />
            </WizardStep>
          )}

          {step === 2 && (
            <WizardStep title={t("Step 2: How much?")} subtitle={t("Specify total quantity.")}>
              <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder={t("Quantity")} className={FIELD} />
              <select name="quantity_unit" value={formData.quantity_unit} onChange={handleChange} className={FIELD}>
                <option value="kg">{t("Kilogram (kg)")}</option>
                <option value="quintal">{t("Quintal")}</option>
                <option value="ton">{t("Ton")}</option>
              </select>
            </WizardStep>
          )}

          {step === 3 && (
            <WizardStep title={t("Step 3: When?")} subtitle={t("Specify harvest timing.")}>
              <input name="harvest_date" type="date" value={formData.harvest_date} onChange={handleChange} className={FIELD} />
            </WizardStep>
          )}

          {step === 4 && (
            <WizardStep title={t("Step 4: Where?")} subtitle={t("Specify produce location.")}>
              <input name="location" value={formData.location} onChange={handleChange} placeholder={t("Village, District")} className={FIELD} />
            </WizardStep>
          )}

          {step === 5 && (
            <WizardStep title={t("Step 5: Quality & Price")} subtitle={t("Add details to help buyers decide.")}>
              <input name="minimum_acceptable_price" type="number" value={formData.minimum_acceptable_price} onChange={handleChange} placeholder={t("Min price (Optional)")} className={FIELD} />
              <textarea name="farmer_quality_notes" value={formData.farmer_quality_notes} onChange={handleChange} placeholder={t("Quality notes (Grade A, etc.)")} className={FIELD} rows={3} />
            </WizardStep>
          )}

          <div className="mt-8 flex justify-between">
            <button
              disabled={step === 1}
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 text-sm font-medium text-ink-600 disabled:opacity-50"
            >
              {t("Back")}
            </button>
            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                {t("Next")}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createStatus === 'loading'}
                className="px-6 py-2 bg-primary-700 text-white rounded-lg text-sm font-bold hover:bg-primary-800"
              >
                {createStatus === 'loading' ? t("Creating...") : t("Analyze Selling Options")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCropLot
