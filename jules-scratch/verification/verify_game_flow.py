import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath("index.html")

    # Navigate to the local HTML file
    page.goto(f"file://{file_path}")

    # 1. Click the "Start Game" button
    start_button = page.get_by_role("button", name="Start Game")
    expect(start_button).to_be_visible()
    start_button.click()

    # 2. Wait for the map to load by checking for the legend
    legend = page.locator(".info.legend")
    expect(legend).to_be_visible(timeout=10000)

    # 3. Click on a city marker (e.g., Cairo)
    cairo_marker = page.locator("#marker-Cairo")
    expect(cairo_marker).to_be_visible()
    cairo_marker.click()

    # 4. Wait for the popup to appear and verify its content
    popup = page.locator(".city-popup")
    expect(popup).to_be_visible()
    expect(popup.get_by_role("heading", name="Cairo")).to_be_visible()

    # 5. Take a screenshot of the game with the popup open
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script executed successfully.")