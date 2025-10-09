from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 414, "height": 896}) # Common mobile viewport
    page = context.new_page()

    try:
        # Navigate to the local server
        page.goto("http://localhost:8000")

        # Bypass the tutorial by setting a value in localStorage
        page.evaluate("localStorage.setItem('tutorialCompleted', 'true')")

        # Reload the page for the localStorage change to take effect
        page.reload()

        # Add a small delay to allow the map to initialize fully
        page.wait_for_timeout(2000)

        # Wait for the map container to be stable, then wait for the first marker
        expect(page.locator("#map")).to_be_visible()
        expect(page.locator(".leaflet-marker-icon").first).to_be_visible(timeout=20000)

        # Select a city to ensure its marker is interactable
        page.locator("#citySearch").fill("Tijuana")
        page.locator("#cityDropdown").select_option(label="Tijuana, MX")

        # Find and click the marker for Tijuana to open the popup
        # This requires finding the marker by its associated city data in the game's JS
        # A simpler approach is to find a visible marker near the expected coordinates
        # For this test, we'll just click a marker that should be visible.
        # Let's click the first visible marker, assuming it's a valid city.
        marker = page.locator(".leaflet-marker-icon").first
        marker.click()

        # Wait for the popup to appear
        popup = page.locator(".leaflet-popup")
        expect(popup).to_be_visible()

        # Click the 'Sabotage' button inside the popup to trigger a potential retaliation
        sabotage_button = popup.get_by_role("button", name="Sabotage")
        sabotage_button.click()

        # Wait for the retaliation alert to become visible
        retaliation_alert = page.locator("#retaliation-feedback")
        expect(retaliation_alert).to_be_visible(timeout=5000)

        # Take a screenshot to verify the layering
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)