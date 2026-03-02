import { APIRequestContext, expect, test } from '@playwright/test';

const WEB_BASE_URL = 'http://localhost:5001';
const API_BASE_URL = 'http://localhost:5000/api/v1';

const registerUserAndSeedWorkdays = async (
  request: APIRequestContext,
) => {
  const email = `reports_export_${Date.now()}@example.com`;
  const password = '123456';

  const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, password },
  });
  expect(registerResponse.ok()).toBeTruthy();
  const registerBody = (await registerResponse.json()) as { token: string };
  const token = registerBody.token;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const toDate = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const seedRows = [
    { date: toDate(2), jobName: 'Hospital Central', worked: true },
    { date: toDate(6), jobName: 'Clinica Norte', worked: true },
    { date: toDate(10), jobName: 'Clinica Norte', worked: false },
  ];

  for (const row of seedRows) {
    const response = await request.post(`${API_BASE_URL}/workdays`, {
      data: row,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
  }

  return token;
};

test('reports export downloads PDF and spreadsheet', async ({ page, request }) => {
  const token = await registerUserAndSeedWorkdays(request);

  await page.goto(`${WEB_BASE_URL}/auth`);
  await page.evaluate((value) => {
    localStorage.setItem('auth_token', value);
  }, token);
  await page.goto(`${WEB_BASE_URL}/reports`);

  await page.getByRole('tab', { name: 'Trabalhos' }).click();
  await page.getByRole('button', { name: 'Exportar' }).click();

  const exportTypeSelect = page.locator('.reports-export-options select').nth(1);

  await exportTypeSelect.selectOption('pdf');
  const pdfDownloadPromise = page.waitForEvent('download');
  await page.locator('.modal-footer .btn-brand').click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename().toLowerCase()).toContain('.pdf');

  await exportTypeSelect.selectOption('spreadsheet');
  const sheetDownloadPromise = page.waitForEvent('download');
  await page.locator('.modal-footer .btn-brand').click();
  const sheetDownload = await sheetDownloadPromise;
  expect(sheetDownload.suggestedFilename().toLowerCase()).toContain('.xlsx');
});
