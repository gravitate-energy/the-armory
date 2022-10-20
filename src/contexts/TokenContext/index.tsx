import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

import { AuthPayload, ResponseTokens, Tokens } from './types'

const store = window.localStorage

const TokenContext = createContext<AuthPayload | null>(null)

export const TokenProvider: React.FC<{
  children: ReactNode
  baseUrl: string
}> = ({ children, baseUrl }) => {
  const [tokens, setTokens] = useState<Tokens | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const storageRefreshToken = store.getItem('refreshToken')
    if (storageRefreshToken) {
      setTokens({
        accessToken: store.getItem('accessToken'),
        refreshToken: storageRefreshToken,
      })
    }
    setLoading(false)
  }, [])

  function authenticate(responseTokens: ResponseTokens) {
    // TODO: set it in local storage
    store.setItem('accessToken', responseTokens.access_token)
    store.setItem('refreshToken', responseTokens.refresh_token)
    setTokens({
      accessToken: responseTokens.access_token,
      refreshToken: responseTokens.refresh_token,
    })
    setLoading(false)
  }

  function clearTokens() {
    setTokens({ accessToken: '', refreshToken: '' })
    store.removeItem('accessToken')
    store.removeItem('refreshToken')
  }

  return (
    <TokenContext.Provider
      value={{
        isLoading,
        tokens,
        authenticate,
        clearTokens,
        baseUrl,
      }}
    >
      {children}
    </TokenContext.Provider>
  )
}

export const useToken = () => useContext(TokenContext)
