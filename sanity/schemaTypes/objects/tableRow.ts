import { defineField, defineType } from 'sanity'

export const tableRow = defineType({
  name: 'tableRow',
  title: 'Table row',
  type: 'object',
  fields: [
    defineField({
      name: 'cells',
      title: 'Cells',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      cells: 'cells',
    },
    prepare({ cells }) {
      return {
        title: Array.isArray(cells) ? cells.join(' | ') : 'Table row',
      }
    },
  },
})
