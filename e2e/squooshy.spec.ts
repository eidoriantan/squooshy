import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { samplePdf, sampleJpeg } from './fixtures.ts'

const HERO = { name: 'Squoosh your images and PDFs.' }

test('downloads the engines, then compresses an image and a PDF, also offline', async ({ page, context }) => {
  await page.goto('/')

  // First visit: the loading screen shows, then the app.
  await expect(page.getByRole('heading', { name: 'Getting Squooshy ready' })).toBeVisible()
  await expect(page.getByRole('heading', HERO)).toBeVisible({ timeout: 120_000 })
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true)

  const jpeg = await sampleJpeg(page)
  const pdf = samplePdf()
  await page.setInputFiles('#file-input', [
    { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: jpeg },
    { name: 'scan.pdf', mimeType: 'application/pdf', buffer: pdf },
  ])
  await expect(page.getByText(/% smaller/)).toHaveCount(2, { timeout: 120_000 })

  const zip = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download all (ZIP)' }).click()
  const download = await zip
  expect(download.suggestedFilename()).toBe('squooshed.zip')
  const zipSize = readFileSync(await download.path()).byteLength
  expect(zipSize).toBeLessThan(jpeg.length + pdf.length)

  // Offline: the loader is skipped and compression still works.
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', HERO)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Getting Squooshy ready' })).toHaveCount(0)
  await page.setInputFiles('#file-input', [
    { name: 'again.jpg', mimeType: 'image/jpeg', buffer: jpeg },
    { name: 'again.pdf', mimeType: 'application/pdf', buffer: pdf },
  ])
  await expect(page.getByText(/% smaller/)).toHaveCount(2, { timeout: 120_000 })
})

test('converts formats and rejects unsupported files', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', HERO)).toBeVisible({ timeout: 120_000 })

  await page.getByRole('button', { name: 'Advanced settings' }).click()
  await page.getByText('WebP', { exact: true }).click()

  await page.setInputFiles('#file-input', [
    { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: await sampleJpeg(page) },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') },
  ])
  await expect(page.getByRole('alert')).toContainText("notes.txt can't be squooshed.")
  await expect(page.getByText('photo.webp')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('JPEG → WebP')).toBeVisible()
})
