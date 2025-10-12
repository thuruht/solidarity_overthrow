from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local index.html file, skipping the intro
        import os
        page.goto(f"file://{os.getcwd()}/index.html?skipIntro=true")

        # Wait for the map to load
        expect(page.locator("#map")).to_be_visible()

        # Click a city to open its popup
        page.locator('.leaflet-marker-icon').first.click()

        # Trigger a protest action to generate a notification
        page.click('.action-btn[data-action="protest"]')

        # Click the map to close the popup
        page.locator("#map").click()
        page.wait_for_timeout(500) # Wait for popup to close and notification to be logged

        # Click the "Log & Progress" button and verify the panel opens
        page.click('button[data-target="log-panel"]')
        expect(page.locator("#log-panel")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()