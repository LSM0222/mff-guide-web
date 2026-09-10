'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

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
  schema: {
    types: schemaTypes,
  },
})
