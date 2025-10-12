from playwright.sync_api import Page, expect

def test_unified_controls(page: Page):
    """
    This test verifies that the new unified control bar is working correctly.
    """
    try:
        # 1. Arrange: Go to the application homepage.
        page.goto("http://localhost:8000/?skipIntro=true")

        # 2. Act: Click on each of the control toggles to open the panels.
        page.get_by_role("button", name="Search").click()
        page.get_by_role("button", name="Stats").click()
        page.get_by_role("button", name="City").click()
        page.get_by_role("button", name="Actions").click()
        page.get_by_role("button", name="Log").click()

        # 3. Assert: Confirm that the panels are open and contain the correct content.
        expect(page.locator("#city-search-panel")).to_be_visible()
        expect(page.locator("#legend-panel")).to_be_visible()
        expect(page.locator("#selected-city-panel")).to_be_visible()
        expect(page.locator("#do-your-part-panel")).to_be_visible()
        expect(page.locator("#log-panel")).to_be_visible()

        # 4. Screenshot: Capture the final result for visual verification.
        page.screenshot(path="jules-scratch/verification/unified_controls.png")

        # 5. Assert: Verify the content of the panels.
        expect(page.locator("#legend-panel .global-metrics")).to_contain_text("IPI")
        expect(page.locator("#log-panel #progress-trackers")).to_contain_text("Global Solidarity")

        # 6. Assert: Verify the live search functionality.
        page.get_by_placeholder("Search for a city...").type("London")
        expect(page.locator("#city-search-results")).to_contain_text("London")

        print("Verification script ran successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")