import { defineArrayMember } from 'sanity'

export const statusOptions = [
  { title: 'Published', value: 'published' },
  { title: 'Draft', value: 'draft' },
  { title: 'Coming soon', value: 'coming-soon' },
  { title: 'Legacy coming', value: 'coming' },
]

export const layoutVariantOptions = [
  { title: 'Default', value: 'default' },
  { title: 'Repeated item', value: 'repeatedItem' },
  { title: 'Season uniform', value: 'seasonUniform' },
  { title: 'Portrait ranking', value: 'portraitRanking' },
  { title: 'Wide', value: 'wide' },
]

export const portableTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Heading 2', value: 'h2' },
    { title: 'Heading 3', value: 'h3' },
    { title: 'Heading 4', value: 'h4' },
  ],
  lists: [
    { title: 'Bullet', value: 'bullet' },
    { title: 'Numbered', value: 'number' },
  ],
  marks: {
    decorators: [
      { title: 'Strong', value: 'strong' },
      { title: 'Emphasis', value: 'em' },
      { title: 'Highlight', value: 'highlight' },
      { title: 'Strike-through', value: 'strike-through' },
    ],
    annotations: [
      {
        name: 'link',
        title: 'Link',
        type: 'object',
        fields: [
          {
            name: 'href',
            title: 'URL or site path',
            type: 'string',
            validation: (Rule) => Rule.required(),
          },
        ],
      },
      {
        name: 'footnote',
        title: '각주 (Footnote)',
        type: 'object',
        description: '선택한 본문 옆에 작은 위첨자 번호로 표시됩니다.',
        fields: [
          {
            name: 'content',
            title: '각주 내용',
            type: 'text',
            rows: 4,
            description: '선택한 본문 옆에 작은 위첨자 번호로 표시됩니다.',
            validation: (Rule) => Rule.required(),
          },
        ],
      },
    ],
  },
})

export const richTextMembers = [
  portableTextBlock,
  defineArrayMember({ type: 'contentImage' }),
  defineArrayMember({ type: 'contentVideo' }),
  defineArrayMember({ type: 'callout' }),
  defineArrayMember({ type: 'contentTable' }),
  defineArrayMember({ type: 'detailsBlock' }),
  defineArrayMember({ type: 'repeatedItemGrid' }),
  defineArrayMember({ type: 'dividerBlock' }),
  defineArrayMember({ type: 'linkCard' }),
]

export const simpleRichTextMembers = [
  portableTextBlock,
  defineArrayMember({ type: 'contentImage' }),
  defineArrayMember({ type: 'callout' }),
  defineArrayMember({ type: 'contentTable' }),
  defineArrayMember({ type: 'dividerBlock' }),
  defineArrayMember({ type: 'linkCard' }),
]
