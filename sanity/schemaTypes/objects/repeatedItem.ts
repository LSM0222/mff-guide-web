import { defineField, defineType } from 'sanity'

import { simpleRichTextMembers } from '../shared'

export const repeatedItem = defineType({
  name: 'repeatedItem',
  title: 'Repeated item',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title / name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'contentImage',
    }),
    defineField({
      name: 'content',
      title: 'Description / content',
      type: 'array',
      of: simpleRichTextMembers,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Optional manual sort value for migration and future rendering.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
      media: 'image.asset',
    },
    prepare({ title, order, media }) {
      return {
        title: title || 'Repeated item',
        subtitle: typeof order === 'number' ? `Order ${order}` : undefined,
        media,
      }
    },
  },
})
