'use client'

import {useEditor, useEditorSelector} from '@portabletext/editor'
import * as selectors from '@portabletext/editor/selectors'
import type {Path, PortableTextTextBlock} from '@portabletext/editor'
import type {BlockProps, PortableTextPluginsProps} from 'sanity'

type AlignableTextBlock = PortableTextTextBlock & {
  textAlign?: unknown
  listItem?: unknown
}

type SelectedTextBlock = {
  node: AlignableTextBlock
  path: Path
}

const supportedStyles = new Set(['normal', 'h2', 'h3', 'h4'])

export function PortableTextAlignmentPlugins(props: PortableTextPluginsProps) {
  return (
    <>
      <PortableTextAlignmentToolbar />
      {props.renderDefault(props)}
    </>
  )
}

export function PortableTextAlignmentBlock(props: BlockProps) {
  const value = props.value as AlignableTextBlock
  const isCenteredTextBlock =
    value?._type === 'block' && supportedStyles.has(String(value.style || 'normal')) && value.textAlign === 'center'

  return (
    <div className={isCenteredTextBlock ? 'sanity-text-align-center' : undefined} style={isCenteredTextBlock ? {textAlign: 'center'} : undefined}>
      {props.renderDefault(props)}
    </div>
  )
}

function PortableTextAlignmentToolbar() {
  const editor = useEditor()
  const selectedTextBlocks = useEditorSelector(editor, selectors.getSelectedTextBlocks) as SelectedTextBlock[]
  const alignableBlocks = selectedTextBlocks.filter(({node}) => isAlignableTextBlock(node))
  const isEnabled = alignableBlocks.length > 0
  const isCentered = isEnabled && alignableBlocks.every(({node}) => node.textAlign === 'center')

  function toggleCenterAlignment() {
    if (!isEnabled) return

    for (const block of alignableBlocks) {
      editor.send(
        isCentered
          ? {type: 'block.unset', at: block.path, props: ['textAlign']}
          : {type: 'block.set', at: block.path, props: {textAlign: 'center'}},
      )
    }
    editor.send({type: 'focus'})
  }

  return (
    <div
      contentEditable={false}
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: 6,
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        aria-pressed={isCentered}
        disabled={!isEnabled}
        title={isCentered ? '가운데 정렬 해제' : '가운데 정렬'}
        onMouseDown={(event) => {
          event.preventDefault()
          toggleCenterAlignment()
        }}
        style={{
          minHeight: 28,
          padding: '0 9px',
          border: '1px solid var(--card-border-color)',
          borderRadius: 4,
          background: isCentered ? 'var(--card-selected-color)' : 'var(--card-bg-color)',
          color: isEnabled ? 'var(--card-fg-color)' : 'var(--card-muted-fg-color)',
          cursor: isEnabled ? 'pointer' : 'not-allowed',
          font: 'inherit',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        가운데 정렬
      </button>
    </div>
  )
}

function isAlignableTextBlock(block: AlignableTextBlock): boolean {
  return block._type === 'block' && !block.listItem && supportedStyles.has(String(block.style || 'normal'))
}
