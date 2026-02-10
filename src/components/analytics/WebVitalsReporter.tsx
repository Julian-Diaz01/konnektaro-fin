 'use client'

import { useEffect } from 'react'
import type {
  CLSMetric,
  FCPMetric,
  INPMetric,
  LCPMetric,
  TTFBMetric
} from 'web-vitals'
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB
} from 'web-vitals'

type WebVitalMetric =
  | CLSMetric
  | FCPMetric
  | INPMetric
  | LCPMetric
  | TTFBMetric

const WEB_VITALS_ENDPOINT = '/api/web-vitals'

function sendToServer (metric: WebVitalMetric) {
  try {
    const body = JSON.stringify(metric)

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(WEB_VITALS_ENDPOINT, blob)
      return
    }

    void fetch(WEB_VITALS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
      keepalive: true
    })
  } catch {
    // Swallow errors – vitals reporting should never break the app
  }
}

function reportMetric (metric: WebVitalMetric) {
  // Local visibility in dev
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Web Vitals]', metric.name, {
      id: metric.id,
      value: metric.value,
      rating: metric.rating
    })
  }

  // Always send to the server (no-op if request fails)
  sendToServer(metric)
}

export function WebVitalsReporter () {
  useEffect(() => {
    onCLS(reportMetric)
    onFCP(reportMetric)
    onINP(reportMetric)
    onLCP(reportMetric)
    onTTFB(reportMetric)
  }, [])

  return null
}

