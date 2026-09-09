import { glossaryEntry } from './documents/glossaryEntry'
import { guide } from './documents/guide'
import { siteSettings } from './documents/siteSettings'
import { callout } from './objects/callout'
import { contentImage } from './objects/contentImage'
import { contentTable } from './objects/contentTable'
import { contentVideo } from './objects/contentVideo'
import { detailsBlock } from './objects/detailsBlock'
import { dividerBlock } from './objects/dividerBlock'
import { guideSection } from './objects/guideSection'
import { linkCard } from './objects/linkCard'
import { repeatedItem } from './objects/repeatedItem'
import { repeatedItemGrid } from './objects/repeatedItemGrid'
import { simpleRichText } from './objects/simpleRichText'
import { tableRow } from './objects/tableRow'

export const schemaTypes = [
  guide,
  glossaryEntry,
  siteSettings,
  simpleRichText,
  guideSection,
  contentImage,
  contentVideo,
  callout,
  contentTable,
  tableRow,
  detailsBlock,
  repeatedItemGrid,
  repeatedItem,
  dividerBlock,
  linkCard,
]
