import { type NextRequest, NextResponse } from 'next/server'

export async function POST (req: NextRequest) {
  try {
    const metric = await req.json()

    // In development, log metrics to the server console so you can
    // see them in `next dev` output or local logs.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Web Vitals API]', metric)
    }

    // TODO: Forward `metric` to your analytics system of choice here.
    // Examples:
    // - Send to a logging/observability SaaS
    // - Store in a database / data warehouse
    // - Forward to Vercel Analytics events endpoint

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[Web Vitals API] Error handling metric', error)
    }
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

