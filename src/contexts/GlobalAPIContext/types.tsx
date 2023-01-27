export type Tokens = {
  accessToken: string
  refreshToken: string
}
export type ResponseTokens = {
  access_token: string
  refresh_token: string
  token_type: string
}
export type User = {
  name: string
  isAdmin: boolean
}

export type AuthPayload = {
  defaultParams: object
  tokens: Tokens
  authenticate: Function
  clearTokens: Function
  isLoading: boolean
  baseUrl: string
  errorHandler: Function
}
