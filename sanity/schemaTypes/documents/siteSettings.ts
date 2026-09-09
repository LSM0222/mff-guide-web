import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'updates',
      title: 'Home updates',
      type: 'array',
      description: 'Editorial update items from content/site.ts that are likely to change often.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'date', title: 'Date label', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'tag', title: 'Tag', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'route', title: 'Route', type: 'string', validation: (Rule) => Rule.required() }),
          ],
          preview: {
            select: { title: 'title', date: 'date', tag: 'tag' },
            prepare({ title, date, tag }) {
              return { title: title || 'Update', subtitle: [date, tag].filter(Boolean).join(' · ') }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'popularGuides',
      title: 'Popular guides',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'guide' }] }],
      description: 'Future CMS replacement for the popular guide slug list.',
    }),
    defineField({
      name: 'usefulLinks',
      title: 'Useful links',
      type: 'array',
      description: 'Operational links that may change without code edits.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.required() }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'url' },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site settings',
      }
    },
  },
})
