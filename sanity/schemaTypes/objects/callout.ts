import { defineField, defineType } from 'sanity'

import { simpleRichTextMembers } from '../shared'

export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'info',
      options: {
        list: [
          { title: 'Info', value: 'info' },
          { title: 'Warning', value: 'warn' },
          { title: 'Danger', value: 'danger' },
          { title: 'Neutral', value: 'neutral' },
        ],
      },
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
      variant: 'variant',
    },
    prepare({ variant }) {
      return {
        title: `Callout: ${variant ?? 'info'}`,
      }
    },
  },
})
