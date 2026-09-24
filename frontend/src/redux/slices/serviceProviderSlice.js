import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'

// GET /api/service-providers
export const fetchServiceProviders = createAsyncThunk(
  'serviceProviders/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/service-providers', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to load service providers'
      )
    }
  }
)

// GET /api/service-providers/:publicId
export const fetchServiceProviderById = createAsyncThunk(
  'serviceProviders/fetchById',
  async (publicId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/service-providers/${publicId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to load service provider'
      )
    }
  }
)

// POST /api/service-providers
export const createServiceProvider = createAsyncThunk(
  'serviceProviders/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/service-providers', payload)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to create service provider'
      )
    }
  }
)

// POST /api/service-providers/seed-demo
export const seedDemoServiceProviders = createAsyncThunk(
  'serviceProviders/seedDemo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/service-providers/seed-demo')
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to seed demo service providers'
      )
    }
  }
)

// PATCH /api/service-providers/:publicId
export const updateServiceProvider = createAsyncThunk(
  'serviceProviders/update',
  async ({ publicId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/service-providers/${publicId}`, data)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to update service provider profile'
      )
    }
  }
)

const serviceProviderSlice = createSlice({
  name: 'serviceProviders',
  initialState: {
    list: [],
    listStatus: 'idle',
    listError: null,

    current: null,
    detailStatus: 'idle',
    detailError: null,

    createStatus: 'idle',
    createError: null,

    updateStatus: 'idle',
    updateError: null,

    seedStatus: 'idle',
    seedError: null,
  },
  reducers: {
    clearCurrentProvider: (state) => {
      state.current = null
      state.detailStatus = 'idle'
      state.detailError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceProviders.pending, (state) => {
        state.listStatus = 'loading'
        state.listError = null
      })
      .addCase(fetchServiceProviders.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.list = action.payload.results || []
      })
      .addCase(fetchServiceProviders.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.listError = action.payload || action.error.message
      })

      .addCase(fetchServiceProviderById.pending, (state) => {
        state.detailStatus = 'loading'
        state.detailError = null
      })
      .addCase(fetchServiceProviderById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.current = action.payload
      })
      .addCase(fetchServiceProviderById.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.detailError = action.payload || action.error.message
      })

      .addCase(createServiceProvider.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
      })
      .addCase(createServiceProvider.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        if (action.payload) {
          state.current = action.payload
          state.list.unshift(action.payload)
        }
      })
      .addCase(createServiceProvider.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.createError = action.payload || action.error.message
      })

      .addCase(updateServiceProvider.pending, (state) => {
        state.updateStatus = 'loading'
        state.updateError = null
      })
      .addCase(updateServiceProvider.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.current = action.payload
        const idx = state.list.findIndex(p => p.public_id === action.payload.public_id)
        if (idx !== -1) {
          state.list[idx] = action.payload
        }
      })
      .addCase(updateServiceProvider.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.updateError = action.payload || action.error.message
      })

      .addCase(seedDemoServiceProviders.pending, (state) => {
        state.seedStatus = 'loading'
        state.seedError = null
      })
      .addCase(seedDemoServiceProviders.fulfilled, (state) => {
        state.seedStatus = 'succeeded'
      })
      .addCase(seedDemoServiceProviders.rejected, (state, action) => {
        state.seedStatus = 'failed'
        state.seedError = action.payload || action.error.message
      })
  },
})

export const { clearCurrentProvider } = serviceProviderSlice.actions
export default serviceProviderSlice.reducer
