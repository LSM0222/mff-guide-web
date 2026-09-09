import { defineField, defineType } from 'sanity'

export const repeatedItemGrid = defineType({
  name: 'repeatedItemGrid',
  title: 'Repeated item grid',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Examples: C.T.P., season uniforms, artifacts, damage buffs.',
    }),
    defineField({
      name: 'variant',
      title: 'Layout variant',
      type: 'string',
      initialValue: 'default',
      options: {
        list: [
          { title: 'Default', value: 'default' },
          { title: 'C.T.P.', value: 'ctp' },
          { title: 'Season uniform', value: 'seasonUniform' },
          { title: 'Artifact', value: 'artifact' },
          { title: 'Buff list', value: 'buffList' },
          { title: 'Hero / item list', value: 'heroItemList' },
        ],
      },
      description: 'Semantic rendering hint. The public renderer owns exact layout and sizing.',
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [{ type: 'repeatedItem' }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      variant: 'variant',
      items: 'items',
    },
    prepare({ title, variant, items }) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'Repeated item grid',
        subtitle: `${variant ?? 'default'} · ${count} item${count === 1 ? '' : 's'}`,
      }
    },
  },
})
