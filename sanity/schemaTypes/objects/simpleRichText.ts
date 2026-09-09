import { defineType } from 'sanity'

import { simpleRichTextMembers } from '../shared'

export const simpleRichText = defineType({
  name: 'simpleRichText',
  title: 'Rich text',
  type: 'array',
  of: simpleRichTextMembers,
})
