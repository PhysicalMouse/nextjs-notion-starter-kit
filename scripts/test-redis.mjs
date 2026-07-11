/**
 * Redis connection and cache test script.
 * Run: node --env-file=.env.development.local scripts/test-redis.mjs
 */
import Keyv from '@keyvhq/core'
import KeyvRedis from '@keyvhq/redis'

const redisUrl = process.env.REDIS_URL
const redisEnabled = process.env.REDIS_ENABLED === 'true'

console.log('REDIS_ENABLED:', redisEnabled)
console.log('REDIS_URL set:', !!redisUrl, redisUrl ? `(protocol: ${redisUrl.split(':')[0]})` : '')

if (!redisUrl) {
  console.error('\n[FAIL] REDIS_URL is not set. Please add it in v0 Settings -> Vars.')
  process.exit(1)
}

if (!redisEnabled) {
  console.warn('\n[WARN] REDIS_ENABLED is not "true". Redis will not be used in the app.')
}

console.log('\nConnecting to Redis...')

const keyvRedis = new KeyvRedis(redisUrl)
const db = new Keyv({ store: keyvRedis, namespace: 'test' })

try {
  // write
  await db.set('ping', 'pong', 10_000)
  console.log('[OK] SET ping = pong (TTL 10s)')

  // read back
  const val = await db.get('ping')
  console.log('[OK] GET ping =', val)

  if (val !== 'pong') throw new Error(`Expected "pong", got "${val}"`)

  // delete
  await db.delete('ping')
  const afterDelete = await db.get('ping')
  console.log('[OK] DELETE ping, verify gone:', afterDelete === undefined)

  console.log('\n[SUCCESS] Redis is working correctly.')
} catch (err) {
  console.error('\n[FAIL] Redis test failed:', err.message)
  process.exit(1)
} finally {
  await db.disconnect?.()
  process.exit(0)
}
