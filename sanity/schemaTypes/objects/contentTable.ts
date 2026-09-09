import { defineField, defineType } from 'sanity'

export const contentTable = defineType({
  name: 'contentTable',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      description: 'Used in Studio previews. It does not have to render on the public site.',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'headers',
      title: 'Headers',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [{ type: 'tableRow' }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      caption: 'caption',
      rows: 'rows',
    },
    prepare({ title, caption, rows }) {
      const rowCount = Array.isArray(rows) ? rows.length : 0
      return {
        title: title || caption || 'Table',
        subtitle: `${rowCount} row${rowCount === 1 ? '' : 's'}`,
      }
    },
  },
})
