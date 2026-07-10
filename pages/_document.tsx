import Document, { Head, Html, Main, NextScript } from 'next/document'

import {
  bingSiteVerification,
  googleAnalyticsId,
  googleSiteVerification
} from '@/lib/config'

export default class MyDocument extends Document {
  override render() {
    return (
      <Html lang='en'>
        <Head>
          {bingSiteVerification && (
            <meta name='msvalidate.01' content={bingSiteVerification} />
          )}
          {googleSiteVerification && (
            <meta
              name='google-site-verification'
              content={googleSiteVerification}
            />
          )}
          <link rel='shortcut icon' href='/favicon-32x32.png' />
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/favicon-32x32.png'
          />

          <link rel='manifest' href='/manifest.json' />
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
        </Head>

        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
/** Inlined version of noflash.js from use-dark-mode */
;(function () {
  var storageKey = 'darkMode'
  var classNameDark = 'dark-mode'
  var classNameLight = 'light-mode'
  function setClassOnDocumentBody(darkMode) {
    document.body.classList.add(darkMode ? classNameDark : classNameLight)
    document.body.classList.remove(darkMode ? classNameLight : classNameDark)
  }
  var preferDarkQuery = '(prefers-color-scheme: dark)'
  var mql = window.matchMedia(preferDarkQuery)
  var supportsColorSchemeQuery = mql.media === preferDarkQuery
  var localStorageTheme = null
  try {
    localStorageTheme = localStorage.getItem(storageKey)
  } catch (err) {}
  var localStorageExists = localStorageTheme !== null
  if (localStorageExists) {
    localStorageTheme = JSON.parse(localStorageTheme)
  }
  // Determine the source of truth
  if (localStorageExists) {
    // source of truth from localStorage
    setClassOnDocumentBody(localStorageTheme)
  } else if (supportsColorSchemeQuery) {
    // source of truth from system
    setClassOnDocumentBody(mql.matches)
    localStorage.setItem(storageKey, mql.matches)
  } else {
    // source of truth from document.body
    var isDarkMode = document.body.classList.contains(classNameDark)
    localStorage.setItem(storageKey, JSON.stringify(isDarkMode))
  }
})();
`
            }}
          />
          <Main />

          <NextScript />
        </body>
      </Html>
    )
  }
}
