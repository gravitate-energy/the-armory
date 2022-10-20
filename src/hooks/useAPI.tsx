import { configureRefreshFetch } from 'refresh-fetch'

import { useToken } from '../contexts/TokenContext'

const store = window.localStorage

interface IOptions {
  baseURLOverride?: string
}

interface TokenRefresh {
  token_type: string
  access_token: string
  expires_in: number
  access_token_expiration: number
  state: string
}

export function useApi(options?: IOptions) {
  const { tokens, authenticate, clearTokens } = useToken()

  async function fetchWrapper<T>(path: string, init?: RequestInit): Promise<T> {
    const resp = await fetch(
      `${options?.baseURLOverride || import.meta.env.VITE_API_URL}${path}`,
      {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
          Authorization:
            store.getItem('accessToken') &&
            `Bearer ${store.getItem('accessToken')}`,
        },
      }
    )
    if (!resp.ok) {
      return Promise.reject(resp.status)
    }
    return (await resp.json()) as T
  }

  const shouldRefreshToken = (error) => error === 401

  const refreshToken = () => {
    const data = { refresh_token: tokens.refreshToken }
    return fetchWrapper<TokenRefresh>('/token/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then((resp) => {
        authenticate({
          access_token: resp.access_token,
          refresh_token: tokens.refreshToken,
        })
      })
      .catch((error) => {
        clearTokens()
        throw error
      })
  }
  const fetchWithRefresh = configureRefreshFetch({
    fetch: fetchWrapper,
    shouldRefreshToken,
    refreshToken,
  })

  return {
    fetch: fetchWithRefresh,
    post: <T,>(path: string, body?: object, init?: RequestInit) =>
      fetchWithRefresh<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
        ...init,
      }),
  }
}
