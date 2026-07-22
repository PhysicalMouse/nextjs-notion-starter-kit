import Keyv from '@keyvhq/core'

// In-memory cache — no external Redis dependency required.
const db = new Keyv()

export { db }
