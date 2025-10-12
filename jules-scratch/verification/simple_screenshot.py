from playwright.sync_api import Page

def test_simple_screenshot(page: Page):
    """
    This test simply navigates to the page and takes a screenshot.
    """
    try:
        page.goto("http://localhost:8000/?skipIntro=true")
        page.screenshot(path="jules-scratch/verification/simple_screenshot.png")
        print("Screenshot taken successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")