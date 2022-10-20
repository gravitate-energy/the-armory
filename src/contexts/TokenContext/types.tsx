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
  tokens: Tokens
  authenticate: Function
  clearTokens: Function
  isLoading: boolean
}
