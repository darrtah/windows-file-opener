import { Schema } from 'effect'
import { Ipc, LinkHandler, Plugin } from '@opencode/plugin/gui'
import { dialog, shell } from 'electron'
import { realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { candidate } from './paths.mjs'

const Files = Ipc.define({
  id: 'windows-file-opener.files',
  methods: {
    exists: { input: Schema.String, output: Schema.Boolean },
    open: { input: Schema.String, output: Schema.String },
  },
})

async function safeFile(input: string) {
  const initial = candidate(input)
  if (!initial || !path.win32.isAbsolute(initial) || !/^[a-z]:[\\/]/i.test(initial)) return undefined
  try {
    const actual = await realpath(initial)
    if (!candidate(actual) || !/^[a-z]:[\\/]/i.test(actual)) return undefined
    return (await stat(actual)).isFile() ? actual : undefined
  } catch { return undefined }
}

export default Plugin.define({
  os: ['windows'],
  setup(ctx) {
    const files = ctx.main(Files)
    const absolute = (link: any) => {
      const value = candidate(link.href)
      // Relative links require an explicit session directory. Never guess using the app's working directory.
      if (!value) return undefined
      if (/^[a-z]:[\\/]/i.test(value)) return value
      const root = link.session?.directory
      if (typeof root !== 'string' || !/^[a-z]:[\\/]/i.test(root)) return undefined
      return `${root.replace(/[\\/]+$/, '')}\\${link.base ? `${link.base}\\` : ''}${value}`
    }
    ctx.add(LinkHandler, {
      priority: 100,
      match: (link) => !!absolute(link),
      exists: (link) => { const value = absolute(link); return value ? files.exists(value) : false },
      open: (link) => {
        const value = absolute(link)
        if (value) void files.open(value).then((error) => { if (error) alert(`Windows could not open this file: ${error}`) }).catch(() => alert('Could not open the file in Windows.'))
      },
    })
  },
  main(ctx) {
    ctx.provide(Files, {
      exists: async (value) => !!(await safeFile(value)),
      open: async (value) => {
        const file = await safeFile(value)
        if (!file) return 'File not found or file type is not supported.'
        const choice = await dialog.showMessageBox({
          type: 'question',
          title: 'Открыть файл',
          message: path.win32.basename(file),
          detail: 'Выберите, как открыть файл.',
          buttons: ['Открыть в программе', 'Показать в папке', 'Отмена'],
          defaultId: 0,
          cancelId: 2,
          noLink: true,
        })
        if (choice.response === 0) return shell.openPath(file)
        if (choice.response === 1) shell.showItemInFolder(file)
        return ''
      },
    })
  },
})
