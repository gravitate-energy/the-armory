import { useEffect, useState } from 'react'
import moment from 'moment'
/**
 *
 * @param {string} key
 * @param {*} initialValue
 * @returns {{
 *  value: *,
 *  setValue: React.Dispatch<SetStateAction<*>>,
 *  resetValue: () => void
 * }}
 */
export const useLocalStorage = (key, initialValue) => {
  const [localValue, setLocalValue] = useState(() => {
    if (!inBrowser()) return initialValue
    return getStoreValue(key) ?? initialValue
  })

  useEffect(() => {
    setStoreValue(key, localValue)
  }, [localValue])

  return {
    value: localValue,
    setValue: setLocalValue,
    resetValue: () =>
      typeof initialValue !== 'undefined' && initialValue !== null
        ? setLocalValue(initialValue)
        : clearStoreValue(key),
  }
}
/**
 * Converts an API date string into an elapsed time string. If date differs from the current date
 * by more than the relativeTimeCutoff then display a date string in the nonRelativeDateFormat
 * @param {string} dateString
 * @param {number} relativeTimeCutoff
 * @param {moment.unitOfTime.Diff} relativeTimeUnits
 * @param {string} nonRelativeDateFormat
 */
export const getElapsedTime = (
  dateString,
  relativeTimeCutoff,
  relativeTimeUnits,
  nonRelativeDateFormat
) => {
  moment.locale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 's',
      m: '1 min',
      mm: '%d min',
      h: '1 h',
      hh: '%d h',
      d: '1 d',
      dd: '%d d',
      M: '1 mth',
      MM: '%d mth',
      y: '1 y',
      yy: '%d y',
    },
  })
  const date = moment(dateString)
  const elapsedSeconds = moment(dateString).diff(moment(), relativeTimeUnits)
  if (Math.abs(elapsedSeconds) <= relativeTimeCutoff) {
    return date.fromNow()
  } else {
    return date.format(nonRelativeDateFormat)
  }
}

/**
 *
 * @returns true if the current execution scope is in the browser
 */
const inBrowser = () => typeof window !== 'undefined'

/**
 *
 * @param {string} key
 * @returns {* | null} a JSON deserialized value from local storage
 */
const getStoreValue = (key) => {
  try {
    return JSON.parse(window?.localStorage.getItem(key))
  } catch (error) {
    return null
  }
}

/**
 *
 * @param {string} key
 * @param {*} value
 * @description stores a JSON serialized value into local storage
 */
const setStoreValue = (key, value) =>
  window?.localStorage.setItem(key, JSON.stringify(value))

export const clearStoreValue = (key) => window?.localStorage.removeItem(key)
