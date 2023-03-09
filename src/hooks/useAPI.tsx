import { configureRefreshFetch } from 'refresh-fetch'

import { useGlobalAPI } from '../contexts/GlobalAPIContext'

const store = window.localStorage

interface IOptions {
  baseURLOverride?: string
}

type QueryParams = URLSearchParams | string
type InitWithQueryParams = RequestInit & { queryParams?: QueryParams }
interface TokenRefresh {
  token_type: string
  access_token: string
  expires_in: number
  access_token_expiration: number
  state: string
}

function appendURLQueryParams(
  url: string,
  queryParams: QueryParams,
  defaultParams?: object,
  ignoreDefaults
) {
  let formattedUrl = url
  if (!queryParams && (!defaultParams || ignoreDefaults)) return url
  if (queryParams) {
    formattedUrl += `?${
      typeof queryParams === 'string'
        ? queryParams
        : queryParams?.toString() || ''
    }`
  }
  if (defaultParams && !ignoreDefaults) {
    formattedUrl += `${queryParams ? '&' : '?'}${new URLSearchParams(
      defaultParams
    )}`
  }

  return formattedUrl
}

export function useApi(options?: IOptions) {
  const {
    tokens,
    authenticate,
    clearTokens,
    baseUrl,
    errorHandler,
    defaultParams,
  } = useGlobalAPI()

  async function fetchWrapper<T>(
    path: string,
    init?: InitWithQueryParams
  ): Promise<T> {
    const url = appendURLQueryParams(
      `${options?.baseURLOverride || baseUrl}${path}`,
      init?.queryParams,
      defaultParams,
      init?.ignoreDefaults
    )

    try {
      const resp = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization:
            store.getItem('token') && `Bearer ${store.getItem('token')}`,
        },
      })

      if (!resp.ok) {
        if (errorHandler) {
          errorHandler(resp)
        }
        return Promise.reject(resp.status)
      }

      if (init?.headers && init?.headers['Content-Type'] === 'blob') {
        return (await resp.blob()) as unknown as T
      }

      return (await resp.json()) as T
    } catch (e) {
      if (errorHandler) {
        errorHandler()
      }
      return Promise.reject(e)
    }
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
          access_token: resp.access_token ?? tokens.accessToken,
          refresh_token: tokens.refreshToken,
        })
      })
      .catch((error) => {
        console.log('refresh failed')
        clearTokens()
        throw error
      })
  }

  const fetchWithRefresh = configureRefreshFetch({
    fetch: fetchWrapper,
    shouldRefreshToken,
    refreshToken,
  })

  const addDefaultParams = (body, ignoreDefaults) => {
    if (defaultParams && !Array.isArray(body) && !ignoreDefaults) {
      return JSON.stringify({ ...defaultParams, ...body })
    }
    return JSON.stringify(body)
  }

  return {
    fetch: fetchWithRefresh,
    post: <T,>(path: string, body?: object, init?: InitWithQueryParams) =>
      fetchWithRefresh<T>(path, {
        method: 'POST',
        body: addDefaultParams(body, init?.ignoreDefaults),
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
        ...init,
      }),
    postFormData: <T,>(
      path: string,
      body?: object,
      init?: InitWithQueryParams
    ) =>
      fetchWithRefresh<T>(path, {
        method: 'POST',
        body,
        ...init,
      }),
    postBlob: <Blob,>(
      path: string,
      body?: object,
      init?: InitWithQueryParams
    ) =>
      fetchWithRefresh<Blob>(path, {
        method: 'GET',
        body: JSON.stringify(body),
        headers: {
          ...init?.headers,
          'Content-Type': 'blob',
        },
        ...init,
      }),
    uploadFile: <T,>(path: string, body?: object, init?: RequestInit) =>
      fetchWithRefresh<T>(path, {
        method: 'POST',
        body,
        headers: {
          ...init?.headers,
        },
        ...init,
      }),
  }
}
