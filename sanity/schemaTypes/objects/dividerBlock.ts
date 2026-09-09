import { defineType } from 'sanity'

export const dividerBlock = defineType({
  name: 'dividerBlock',
  title: 'Divider',
  type: 'object',
  fields: [
    {
      name: 'label',
      title: 'Label',
      type: 'string',
      initialValue: 'Divider',
      hidden: true,
    },
  ],
  preview: {
    prepare() {
      return { title: 'Divider' }
    },
  },
})
