import { defineField, defineType } from 'sanity'

import { simpleRichTextMembers } from '../shared'

export const detailsBlock = defineType({
  name: 'detailsBlock',
  title: 'Details / toggle',
  type: 'object',
  fields: [
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: simpleRichTextMembers,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'summary',
    },
    prepare({ title }) {
      return {
        title: title || 'Details',
      }
    },
  },
})
