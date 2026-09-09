import { defineField, defineType } from 'sanity'

import { layoutVariantOptions } from '../shared'

export const contentImage = defineType({
  name: 'contentImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      title: 'Sanity image',
      type: 'image',
      options: { hotspot: true },
      description: 'New CMS images should usually be uploaded here.',
    }),
    defineField({
      name: 'legacySrc',
      title: 'Legacy /media path',
      type: 'string',
      description: 'Keep existing local media paths such as /media/image 100.png during migration.',
    }),
    defineField({
      name: 'externalSrc',
      title: 'External image URL',
      type: 'url',
      description: 'Use for existing external images that should not be uploaded yet.',
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'layoutVariant',
      title: 'Layout variant',
      type: 'string',
      initialValue: 'default',
      options: { list: layoutVariantOptions },
      description: 'Semantic rendering hint. Pixel sizing stays in React/CSS.',
    }),
  ],
  validation: (Rule) =>
    Rule.custom((value) => {
      if (!value?.asset && !value?.legacySrc && !value?.externalSrc) {
        return 'Add a Sanity image, legacy /media path, or external URL.'
      }
      return true
    }),
  preview: {
    select: {
      title: 'caption',
      subtitle: 'alt',
      media: 'asset',
      legacySrc: 'legacySrc',
      externalSrc: 'externalSrc',
    },
    prepare({ title, subtitle, legacySrc, externalSrc, media }) {
      return {
        title: title || subtitle || 'Image',
        subtitle: legacySrc || externalSrc || subtitle,
        media,
      }
    },
  },
})
