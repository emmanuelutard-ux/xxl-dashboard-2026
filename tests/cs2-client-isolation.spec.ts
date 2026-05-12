import { test, expect, type Page } from '@playwright/test'

const CLIENT_EMAIL    = 'client@xxl.com'
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD ?? ''

const PROGRAM_ASSIGNED     = 'b7b49362-9899-4bec-a553-0a2f90ad8ea0' // Résidence Galliéni
const PROGRAM_NOT_ASSIGNED = '2322d048-a898-4f36-b95f-57eef1cbbc9b' // Bricklane

async function loginAsClient(page: Page) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(CLIENT_EMAIL)
  await page.locator('input[type="password"]').fill(CLIENT_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/client/, { timeout: 10_000 })
}

// ── A — Accès au programme assigné ───────────────────────────────────────────

test('A — accès au programme assigné (Résidence Galliéni)', async ({ page }) => {
  await loginAsClient(page)
  await page.goto(`/client/${PROGRAM_ASSIGNED}`)
  await expect(page.getByText('Résidence Galliéni')).toBeVisible({ timeout: 8_000 })
})

// ── B — Isolation RLS (programme non assigné) ─────────────────────────────────

test('B — isolation RLS : programme non assigné inaccessible', async ({ page }) => {
  await loginAsClient(page)
  await page.goto(`/client/${PROGRAM_NOT_ASSIGNED}`)

  await page.waitForLoadState('networkidle')
  const currentUrl = page.url()
  const is404 = (await page.locator('text=404').count()) > 0
                || (await page.locator('text=Not Found').count()) > 0
  const isRedirectedAway = !currentUrl.includes(PROGRAM_NOT_ASSIGNED)

  expect(is404 || isRedirectedAway).toBeTruthy()
})

// ── C — Accès sans session ────────────────────────────────────────────────────

test('C — accès sans session redirige vers /client/login', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto(`/client/${PROGRAM_ASSIGNED}`)
  await page.waitForURL(/\/client\/login/, { timeout: 8_000 })
  expect(page.url()).toContain('/client/login')
})
