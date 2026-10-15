'use client'

import * as Fathom from 'fathom-client'
import { usePathname, useSearchParams } from 'next/navigation'
import { ThemeProvider, useTheme } from 'next-themes'
import type PostHog from 'posthog-js-lite'
import * as React from 'react'

import { bootstrap } from '@/lib/bootstrap-client'
import {
  clarityId,
  fathomConfig,
  fathomId,
  googleAnalyticsId,
  isVercelAnalyticsEnabled,
  isVercelSpeedInsightsEnabled,
  posthogConfig,
  posthogId
} from '@/lib/config'

const themeClassNames = { dark: 'dark-mode', light: 'light-mode' }

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      disableTransitionOnChange
      enableSystem
      value={themeClassNames}
    >
      <ThemeColor />

      <React.Suspense fallback={null}>
        <Analytics />
      </React.Suspense>

      {children}
    </ThemeProvider>
  )
}

function ThemeColor() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (!resolvedTheme) {
      return
    }

    const themeColorMetas = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    )
    const originalContent = themeColorMetas.map((meta) => meta.content)
    const themeColor = resolvedTheme === 'dark' ? '#2d3439' : '#fefffe'

    for (const meta of themeColorMetas) {
      meta.content = themeColor
    }

    return () => {
      for (const [index, meta] of themeColorMetas.entries()) {
        meta.content = originalContent[index]!
      }
    }
  }, [resolvedTheme])

  return null
}

function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogRef = React.useRef<PostHog | undefined>(undefined)
  const previousUrlRef = React.useRef<string | undefined>(undefined)
  const url = [pathname, searchParams?.toString()].filter(Boolean).join('?')

  React.useEffect(() => {
    let isDisposed = false

    bootstrap()

    if (fathomId) {
      Fathom.load(fathomId, fathomConfig)
    }

    const posthogApiKey = posthogId

    if (posthogApiKey) {
      void import('posthog-js-lite').then(({ default: PostHogClient }) => {
        if (isDisposed) {
          return
        }

        const posthog = new PostHogClient(posthogApiKey, posthogConfig)
        posthog.capture('$pageview')
        posthogRef.current = posthog
      })
    }

    return () => {
      isDisposed = true
      void posthogRef.current?._shutdown()
      posthogRef.current = undefined
    }
  }, [])

  React.useEffect(() => {
    if (previousUrlRef.current === undefined) {
      previousUrlRef.current = url
      return
    }

    if (previousUrlRef.current === url) {
      return
    }

    previousUrlRef.current = url

    if (fathomId) {
      Fathom.trackPageview()
    }

    posthogRef.current?.capture('$pageview')
  }, [url])

  return (
    <>
      {isVercelAnalyticsEnabled && <DynamicVercelAnalytics />}
      {isVercelSpeedInsightsEnabled && <DynamicVercelSpeedInsights />}
      {clarityId && (
        <script
          id='microsoft-clarity'
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${clarityId}");`
          }}
        />
      )}
      {googleAnalyticsId && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}');
`
            }}
          />
        </>
      )}
    </>
  )
}

function DynamicVercelAnalytics() {
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null)

  React.useEffect(() => {
    import('@vercel/analytics/react').then((mod) => {
      setComp(() => mod.Analytics)
    })
  }, [])

  return Comp ? <Comp /> : null
}

function DynamicVercelSpeedInsights() {
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null)

  React.useEffect(() => {
    import('@vercel/speed-insights/react').then((mod) => {
      setComp(() => mod.SpeedInsights)
    })
  }, [])

  return Comp ? <Comp /> : null
}
