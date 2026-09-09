import { defineField, defineType } from 'sanity'

import { layoutVariantOptions } from '../shared'

export const contentVideo = defineType({
  name: 'contentVideo',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'Sanity video file',
      type: 'file',
      options: { accept: 'video/*' },
      description: 'Optional for newly uploaded CMS videos.',
    }),
    defineField({
      name: 'legacySrc',
      title: 'Legacy /media path',
      type: 'string',
      description: 'Keep existing local video paths such as /media/video1.mp4 during migration.',
    }),
    defineField({
      name: 'externalSrc',
      title: 'External video URL',
      type: 'url',
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
      if (!value?.file && !value?.legacySrc && !value?.externalSrc) {
        return 'Add a Sanity file, legacy /media path, or external URL.'
      }
      return true
    }),
  preview: {
    select: {
      title: 'caption',
      legacySrc: 'legacySrc',
      externalSrc: 'externalSrc',
    },
    prepare({ title, legacySrc, externalSrc }) {
      return {
        title: title || 'Video',
        subtitle: legacySrc || externalSrc,
      }
    },
  },
})
