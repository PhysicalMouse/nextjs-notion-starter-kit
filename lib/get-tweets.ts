import { type ExtendedRecordMap } from 'notion-types'
import { getPageTweetIds } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'
import { getTweet as getTweetData, type Tweet } from 'react-tweet/api'

import type { ExtendedTweetRecordMap } from './types'
import { db } from './db'

export async function getTweetsMap(
  recordMap: ExtendedRecordMap
): Promise<void> {
  let tweetIds: string[]

  try {
    tweetIds = getPageTweetIds(recordMap)
  } catch (err: any) {
    console.warn('[tweets] getPageTweetIds failed (non-fatal):', err?.message)
    return
  }

  if (!tweetIds?.length) return

  const pairs = await pMap(
    tweetIds,
    async (tweetId: string) => {
      try {
        return [tweetId, await getTweet(tweetId)] as const
      } catch (err: any) {
        console.warn('[tweets] failed to fetch tweet', tweetId, err?.message)
        return [tweetId, null] as const
      }
    },
    { concurrency: 4 }
  )

  ;(recordMap as ExtendedTweetRecordMap).tweets = Object.fromEntries(pairs)
}

async function getTweetImpl(tweetId: string): Promise<Tweet | null> {
  if (!tweetId) return null

  const cacheKey = `tweet:${tweetId}`

  try {
    try {
      const cachedTweet = await db.get(cacheKey)
      if (cachedTweet || cachedTweet === null) {
        return cachedTweet
      }
    } catch (err: any) {
      // ignore redis errors
      console.warn(`redis error get "${cacheKey}"`, err.message)
    }

    // getTweetData throws on non-2xx — may throw a Response object rather than
    // an Error when X's syndication API rate-limits or blocks the request.
    let tweetData: Tweet | null = null
    try {
      tweetData = (await getTweetData(tweetId)) || null
    } catch {
      // X API is unreliable — treat as a cache miss so the oEmbed widget is used
      return null
    }

    try {
      await db.set(cacheKey, tweetData)
    } catch (err: any) {
      // ignore redis errors
      console.warn(`redis error set "${cacheKey}"`, err.message)
    }

    return tweetData
  } catch (err: any) {
    console.warn('failed to get tweet', tweetId, err.message)
    return null
  }
}

export const getTweet = pMemoize(getTweetImpl)
