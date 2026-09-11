'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { PortableTextAlignmentBlock, PortableTextAlignmentPlugins } from './sanity/components/PortableTextAlignment'
import { schemaTypes } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

const projectId = 'ox24he5w'
const dataset = 'production'

export default defineConfig({
  name: 'default',
  title: '겁쟁이들의쉼터',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  form: {
    components: {
      block: PortableTextAlignmentBlock,
      portableText: {
        plugins: PortableTextAlignmentPlugins,
      },
    },
  },
  schema: {
    types: schemaTypes,
  },
})
