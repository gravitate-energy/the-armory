import { configureRefreshFetch } from 'refresh-fetch'

import { useGlobalAPI } from '../contexts/GlobalAPIContext'

const store = window.localStorage

interface IOptions {
  baseURLOverride?: string
}

type QueryParams = URLSearchParams | string
type InitWithQueryParams = RequestInit & {
  queryParams?: QueryParams
  ignoreDefaults?: boolean
  responseType?: string
}
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
  defaultParams = {},
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
    defaultHeaders,
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

        const contentType = resp.headers.get('Content-Type')

        if (contentType === 'application/json') {
          try {
            const json = await resp.json()
            return Promise.reject({ statusCode: resp.status, json })
          } catch (error) {
            return Promise.reject({ statusCode: resp.status, json: {} })
          }
        }

        if (contentType === 'text/plain') {
          const text = await resp.text()
          return Promise.reject({ statusCode: resp.status, text })
        }

        return Promise.reject({ statusCode: resp.status })
      }

      if (
        (init?.headers && init?.headers['Content-Type'] === 'blob') ||
        resp.headers.get('Content-Type') === 'blob'
      ) {
        return (await resp.blob()) as unknown as T
      }

      if (init?.responseType === 'blob') {
        return (await resp.blob()) as unknown as T
      }

      try {
        // The content type wasn't blob, so we're assuming json for the response type
        return (await resp.json()) as T
      } catch (_error) {
        // If we get a 200, but json parsing failed we still want to resolve the promise with an empty object
        return Promise.resolve({} as T)
      }
    } catch (e) {
      if (errorHandler) {
        errorHandler()
      }
      return Promise.reject(e)
    }
  }

  const shouldRefreshToken = (error) =>
    // new payload for errors is { statusCode: number, json?: object}, but we still need to support the old payload
    error?.statusCode === 401 || error === 401

  const refreshToken = () => {
    const data = { refresh_token: tokens.refreshToken }
    return fetchWrapper<TokenRefresh>('token/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
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
          ...defaultHeaders,
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
