const { test, expect } = require("@playwright/test");

const appliancesPayload = [
  {
    id: "ac1",
    type: "AC",
    nickname: "リビングエアコン",
    device: { name: "Living Remo" },
    signals: [{ id: "sig-ac", name: "AC_SIGNAL" }],
    light: null,
    tv: null,
    aircon: {
      settings: { mode: "cool", temp: "25", tempUnit: "c", vol: "auto", dir: "auto" },
      range: {
        modes: {
          cool: { temps: ["22", "23", "24", "25"], vols: ["auto", "2"], dirs: ["auto", "swing"] },
          warm: { temps: ["20", "21", "22"], vols: ["auto", "1"], dirs: ["auto"] },
        },
      },
    },
  },
  {
    id: "tv1",
    type: "TV",
    nickname: "テレビ",
    device: { name: "Living Remo" },
    signals: [{ id: "sig-tv", name: "TV_SIGNAL" }],
    tv: { buttons: [{ name: "power", label: "TV_POWER" }] },
    light: null,
    aircon: null,
  },
  {
    id: "light1",
    type: "LIGHT",
    nickname: "照明",
    device: { name: "Living Remo" },
    signals: [{ id: "sig-light", name: "LIGHT_SIGNAL" }],
    light: { buttons: [{ name: "on", label: "LIGHT_ON" }] },
    tv: null,
    aircon: null,
  },
];

test("all appliances can be exercised with mocked Nature API", async ({ page }) => {
  const apiCalls = [];

  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("api.nature.global/1/users/me") && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ nickname: "PlaywrightUser" }) });
      return;
    }

    if (url.includes("api.nature.global/1/appliances") && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(appliancesPayload) });
      return;
    }

    if (url.includes("api.nature.global/1/") && method === "POST") {
      apiCalls.push({ url, body: req.postData() || "" });
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }

    await route.continue();
  });

  await page.goto("/");
  await page.fill("#apiAccessToken", "dummy-token");
  await page.click("#scanBtn");

  await expect(page.getByText("PlaywrightUserさん")).toBeVisible();
  await expect(page.locator("#applianceNavList a", { hasText: "テレビ" })).toBeVisible();
  await expect(page.locator("#applianceNavList a", { hasText: "照明" })).toBeVisible();

  await page.getByRole("button", { name: "TV_SIGNAL" }).click();
  await page.getByRole("button", { name: "TV_POWER" }).click();
  await page.getByRole("button", { name: "LIGHT_SIGNAL" }).click();
  await page.getByRole("button", { name: "LIGHT_ON" }).click();
  await page.getByRole("button", { name: "電源ON" }).click();
  await page.getByRole("button", { name: "電源OFF" }).click();
  await page.getByRole("button", { name: "エアコン設定を送信" }).click();

  const calledUrls = apiCalls.map((c) => c.url).join("\n");

  expect(calledUrls).toContain("/1/signals/sig-tv/send");
  expect(calledUrls).toContain("/1/appliances/tv1/tv");
  expect(calledUrls).toContain("/1/signals/sig-light/send");
  expect(calledUrls).toContain("/1/appliances/light1/light");

  const airconCalls = apiCalls.filter((c) => c.url.includes("/1/appliances/ac1/aircon_settings"));
  expect(airconCalls.length).toBeGreaterThanOrEqual(3);
});
