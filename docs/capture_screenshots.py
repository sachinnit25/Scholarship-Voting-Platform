from playwright.sync_api import sync_playwright
import os

os.makedirs('docs/screenshots', exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=r'C:\Users\yodha\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe',
        headless=True,
    )
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.goto('https://frontend-eta-seven-24.vercel.app', timeout=60000)
    page.screenshot(path='docs/screenshots/desktop-view.png', full_page=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path='docs/screenshots/mobile-view.png', full_page=True)
    browser.close()

print('Screenshots saved: docs/screenshots/desktop-view.png and docs/screenshots/mobile-view.png')
