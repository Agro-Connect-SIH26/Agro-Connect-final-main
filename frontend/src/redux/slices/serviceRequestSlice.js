import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'

// GET /api/service-requests
export const fetchServiceRequests = createAsyncThunk(
  'serviceRequests/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/service-requests', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to load service requests'
      )
    }
  }
)

// GET /api/service-requests/:publicId
export const fetchServiceRequestById = createAsyncThunk(
  'serviceRequests/fetchById',
  async (publicId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/service-requests/${publicId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to load service request'
      )
    }
  }
)

// POST /api/service-requests
export const createServiceRequest = createAsyncThunk(
  'serviceRequests/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/service-requests', payload)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to create service request'
      )
    }
  }
)

// PATCH /api/service-requests/:publicId/status
export const updateServiceRequestStatus = createAsyncThunk(
  'serviceRequests/updateStatus',
  async ({ publicId, status, provider_quote, notes }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/service-requests/${publicId}/status`, {
        status,
        provider_quote,
        notes,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to update service request status'
      )
    }
  }
)

const serviceRequestSlice = createSlice({
  name: 'serviceRequests',
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
  },
  reducers: {
    clearCurrentRequest: (state) => {
      state.current = null
      state.detailStatus = 'idle'
      state.detailError = null
    },
    resetActionStatus: (state) => {
      state.createStatus = 'idle'
      state.createError = null
      state.updateStatus = 'idle'
      state.updateError = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchServiceRequests.pending, (state) => {
        state.listStatus = 'loading'
        state.listError = null
      })
      .addCase(fetchServiceRequests.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.list = action.payload.results || []
      })
      .addCase(fetchServiceRequests.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.listError = action.payload || action.error.message
      })

      // Fetch Detail
      .addCase(fetchServiceRequestById.pending, (state) => {
        state.detailStatus = 'loading'
        state.detailError = null
      })
      .addCase(fetchServiceRequestById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.current = action.payload
      })
      .addCase(fetchServiceRequestById.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.detailError = action.payload || action.error.message
      })

      // Create
      .addCase(createServiceRequest.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
      })
      .addCase(createServiceRequest.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        if (action.payload) {
          state.list.unshift(action.payload)
          state.current = action.payload
        }
      })
      .addCase(createServiceRequest.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.createError = action.payload || action.error.message
      })

      // Update Status
      .addCase(updateServiceRequestStatus.pending, (state) => {
        state.updateStatus = 'loading'
        state.updateError = null
      })
      .addCase(updateServiceRequestStatus.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        const updated = action.payload
        if (updated) {
          state.current = updated
          const idx = state.list.findIndex((r) => r.public_id === updated.public_id)
          if (idx !== -1) {
            state.list[idx] = updated
          }
        }
      })
      .addCase(updateServiceRequestStatus.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.updateError = action.payload || action.error.message
      })
  },
})

export const { clearCurrentRequest, resetActionStatus } = serviceRequestSlice.actions
export default serviceRequestSlice.reducer
