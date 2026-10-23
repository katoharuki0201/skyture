import ky from 'ky'

export const apiClient = ky.create({
  headers: {
    accept: 'application/json',
  },
  // TanStack Query owns retry behavior to avoid multiplied retries.
  retry: 0,
})
