import { defineField, defineType } from 'sanity'

import { simpleRichTextMembers } from '../shared'

export const glossaryEntry = defineType({
  name: 'glossaryEntry',
  title: 'Glossary entry',
  type: 'document',
  fields: [
    defineField({
      name: 'term',
      title: 'Term',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy anchor id',
      type: 'string',
      description: 'Preserves the old glossary URL anchor used by /glossary?term=...',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases / search keywords',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'definition',
      title: 'Definition',
      type: 'array',
      of: simpleRichTextMembers,
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
      title: 'term',
      category: 'category',
      aliases: 'aliases',
    },
    prepare({ title, category, aliases }) {
      const aliasText = Array.isArray(aliases) && aliases.length ? ` · ${aliases.join(', ')}` : ''
      return {
        title: title || 'Glossary entry',
        subtitle: `${category ?? 'Uncategorized'}${aliasText}`,
      }
    },
  },
})
