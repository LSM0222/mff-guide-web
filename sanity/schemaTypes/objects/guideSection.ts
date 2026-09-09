import { defineField, defineType } from 'sanity'

import { richTextMembers, statusOptions } from '../shared'

export const guideSection = defineType({
  name: 'guideSection',
  title: 'Guide section',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'anchor',
      title: 'Anchor / section id',
      type: 'slug',
      description: 'Optional stable anchor for deep links after migration.',
      options: { source: 'title' },
    }),
    defineField({
      name: 'status',
      title: 'Section status',
      type: 'string',
      initialValue: 'published',
      options: { list: statusOptions },
      description: 'Prepared for partial draft / coming-soon sections. Not used by the current site yet.',
    }),
    defineField({
      name: 'level',
      title: 'Heading level',
      type: 'number',
      initialValue: 2,
      options: {
        list: [
          { title: 'Heading 2', value: 2 },
          { title: 'Heading 3', value: 3 },
          { title: 'Heading 4', value: 4 },
        ],
      },
      description: 'Semantic heading depth preserved from the legacy guide HTML.',
    }),
    defineField({
      name: 'blocks',
      title: 'Blocks',
      type: 'array',
      of: richTextMembers,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      order: 'order',
    },
    prepare({ title, status, order }) {
      return {
        title: title || 'Guide section',
        subtitle: [status, typeof order === 'number' ? `Order ${order}` : undefined].filter(Boolean).join(' · '),
      }
    },
  },
})
