import type { ReactNode } from 'react'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { AuthPayload, ResponseTokens, Tokens } from './types'

const store = window.localStorage

const GlobalAPIContext = createContext<AuthPayload | null>(null)

interface GlobalAPIProviderProps {
  children: ReactNode
  baseUrl: string
  defaultParams?: object
  logoutCallback?: () => void | null
  errorHandler?: () => void | null
}

export const GlobalAPIProvider: React.FC<GlobalAPIProviderProps | null> = ({
  children,
  baseUrl,
  logoutCallback,
  errorHandler,
  defaultParams,
}) => {
  const [tokens, setTokens] = useState<Tokens | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const storageRefreshToken = store.getItem('refresh')
    if (storageRefreshToken) {
      setTokens({
        accessToken: store.getItem('token'),
        refreshToken: storageRefreshToken,
      })
    }
    setLoading(false)
  }, [])

  function authenticate(responseTokens: ResponseTokens) {
    // TODO: set it in local storage
    store.setItem('token', responseTokens.access_token)
    store.setItem('refresh', responseTokens.refresh_token)
    setTokens({
      accessToken: responseTokens.access_token,
      refreshToken: responseTokens.refresh_token,
    })
    setLoading(false)
  }

  function clearTokens() {
    setTokens({ accessToken: '', refreshToken: '' })
    store.removeItem('token')
    store.removeItem('refresh')
    if (logoutCallback) {
      logoutCallback()
    }
  }

  return (
    <GlobalAPIContext.Provider
      value={{
        isLoading,
        tokens,
        authenticate,
        clearTokens,
        baseUrl,
        errorHandler,
        defaultParams,
      }}
    >
      {children}
    </GlobalAPIContext.Provider>
  )
}

export const useGlobalAPI = () => useContext(GlobalAPIContext)
