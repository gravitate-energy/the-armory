import { useEffect, useState } from 'react'

const isDefinedAndNotNull = <T>(value: T): value is NonNullable<T> =>
  typeof value !== 'undefined' && value !== null

const getStoreValue = <T>(key: string) => {
  try {
    return JSON.parse(window?.localStorage.getItem(key)) as T
  } catch (error) {
    console.error(error)
    return null
  }
}

// The check for isDefinedAndNotNull is necessary because we don't want to stringify null or undefined into the key store.
const setStoreValue = <T>(key: string, value: T) =>
  isDefinedAndNotNull(value)
    ? window?.localStorage.setItem(key, JSON.stringify(value))
    : window?.localStorage.removeItem(key)

export const useLocalStorage = <T>(key: string, initialValue?: T) => {
  const [localValue, setLocalValue] = useState(() => {
    return getStoreValue<T>(key) ?? initialValue
  })

  useEffect(() => {
    setStoreValue<T>(key, localValue)
  }, [localValue])

  return {
    value: localValue,
    setValue: setLocalValue,
    clearFromStore: () => setLocalValue(null),
    resetValue: () => setLocalValue(initialValue), // Reset the state / store to its intial value. If an initial value was not provided, will have the same behavior as clearFromStore.
  }
}
