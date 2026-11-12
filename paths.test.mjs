import { test } from 'node:test'
import assert from 'node:assert/strict'
import { candidate } from './paths.mjs'

test('accepts local media and documents', () => {
  for (const p of ['D:/x/test.MP4', 'folder/image.png', 'file:///D:/x/a%20b.pdf', 'C:\\x\\file.docx']) assert.ok(candidate(p), p)
})
test('rejects URLs, network paths, executable and ambiguous paths', () => {
  for (const p of ['https://example.org/a.png', 'file://server/share/a.pdf', '\\\\server\\a.png', 'x.exe', 'x.png.exe', 'C:/a.png:run', 'x.png\0.exe']) assert.equal(candidate(p), undefined, p)
})
