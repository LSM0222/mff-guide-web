import { defineField, defineType } from 'sanity'

import { richTextMembers, statusOptions } from '../shared'

export const guide = defineType({
  name: 'guide',
  title: 'Guide',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(220),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Growth / settings', value: 'growth' },
          { title: 'Content guide', value: 'content' },
          { title: 'Tips / information', value: 'tips' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'published',
      options: { list: statusOptions },
      description: 'Includes legacy coming status so the current site status can migrate safely later.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
    }),
    defineField({
      name: 'searchKeywords',
      title: 'Search keywords / aliases',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'displayUpdatedAt',
      title: 'Display update text',
      type: 'string',
      description: 'Optional human-readable update text, if different from the document timestamp.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [{ type: 'guideSection' }],
      description: 'Preferred long-term structure: editable guide sections with status and content blocks.',
    }),
    defineField({
      name: 'body',
      title: 'Body blocks',
      type: 'array',
      of: richTextMembers,
      description: 'Optional for short guides or migration cases that do not need sections yet.',
    }),
  ],
  validation: (Rule) =>
    Rule.custom((value) => {
      const sections = Array.isArray(value?.sections) ? value.sections : []
      const body = Array.isArray(value?.body) ? value.body : []

      if (!sections.length && !body.length) {
        return 'Add at least one section or body block.'
      }
      return true
    }),
  preview: {
    select: {
      title: 'title',
      category: 'category',
      status: 'status',
    },
    prepare({ title, category, status }) {
      return {
        title: title || 'Guide',
        subtitle: [category, status].filter(Boolean).join(' · '),
      }
    },
  },
})
