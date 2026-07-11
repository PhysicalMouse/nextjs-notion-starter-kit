import { type Block, type ExtendedRecordMap } from 'notion-types'

export function PageAside({
  block,
  recordMap: _recordMap,
  isBlogPost: _isBlogPost
}: {
  block: Block
  recordMap: ExtendedRecordMap
  isBlogPost: boolean
}) {
  if (!block) {
    return null
  }

  return null
}
