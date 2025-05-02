const { firefox } = require("playwright");
const fs = require("fs").promises;
const path = require("path");

const urlsFileName = "url.txt";
const outputDir = "notion-docs";

(async () => {
  let browser;
  try {
    // Read URLs from the file
    const data = await fs.readFile(urlsFileName, "utf8");
    const urls = data
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      console.log("No URLs found in url.txt. Exiting.");
      return;
    }

    // Create the output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Ensured output directory "${outputDir}" exists.`);

    browser = await firefox.launch({
      headless: true, // Set to true for background execution
      // headless: false, // Set to false to watch
    });

    console.log(`Found ${urls.length} URLs to process.`);

    for (const url of urls) {
      let page;
      try {
        page = await browser.newPage();
        console.log(`Processing URL: ${url}`);

        await page.goto(url, { waitUntil: "networkidle" });

        const urlObject = new URL(url);
        const urlPath = urlObject.pathname;
        const isReferencePage = urlPath.startsWith("/reference/");

        let sectionText = "";
        let contentLocator;

        if (isReferencePage) {
          console.log(
            "  Detected as a reference page. Clicking response buttons..."
          );

          // Locate and click the response buttons (e.g., 200, 400)
          // We'll look for buttons or elements that seem interactive
          // within a section related to responses. This selector might need
          // adjustment based on the exact HTML structure.
          const responseButtons = await page
            .locator(
              'article#content .api-response-selector button, article#content .api-response-selector [role="button"]'
            )
            .all(); // Example selectors - inspect the page to find the exact ones

          if (responseButtons.length > 0) {
            for (const button of responseButtons) {
              try {
                // Use click({ force: true }) in case the button is occasionally obscured
                await button.click({ force: true, timeout: 5000 }); // Click each button with a timeout
                // Add a small pause to allow content to load after clicking
                await page.waitForTimeout(200);
              } catch (clickError) {
                console.warn(
                  `  Could not click a response button on ${url}: ${clickError.message}`
                );
              }
            }
            console.log(
              `  Clicked ${responseButtons.length} response buttons.`
            );
          } else {
            console.log("  No response buttons found to click.");
          }

          // After clicking, scrape the content from the #content element
          contentLocator = page.locator("article#content");
        } else {
          console.log(
            "  Detected as a non-reference page. Scraping first section in #content-container..."
          );
          // For non-reference pages, scrape the first section in #content-container
          contentLocator = page.locator(
            "#content-container section:first-of-type"
          );
        }

        // Check if the main content locator finds the element
        const count = await contentLocator.count();
        if (count === 0) {
          console.warn(
            `  Could not find the main content element for ${url}. Skipping.`
          );
          const filename =
            urlPath.replace(/^\/|\/$/g, "").replace(/\//g, "-") + ".error.txt";
          const filePath = path.join(outputDir, filename);
          await fs.writeFile(
            filePath,
            `Error: Main content element not found.\nURL: ${url}`,
            "utf8"
          );
          if (page) await page.close(); // Ensure page is closed
          continue; // Move to the next URL
        }

        // Get the text content
        sectionText = await contentLocator.innerText();

        // Basic cleaning: trim leading/trailing whitespace, normalize multiple newlines
        const cleanedText = sectionText.trim().replace(/\n{2,}/g, "\n\n");

        // Determine the output filename
        const filename =
          urlPath.replace(/^\/|\/$/g, "").replace(/\//g, "-") + ".txt";
        const filePath = path.join(outputDir, filename);

        // Save the cleaned text to the file
        await fs.writeFile(filePath, cleanedText, "utf8");

        console.log(`  Successfully saved text to ${filePath}`);
      } catch (pageError) {
        console.error(
          `  An error occurred while processing ${url}:`,
          pageError
        );
        // Save an error file if something goes wrong with this specific URL
        const urlObject = new URL(url);
        const urlPath = urlObject.pathname;
        const filename =
          urlPath.replace(/^\/|\/$/g, "").replace(/\//g, "-") + ".error.txt";
        const filePath = path.join(outputDir, filename);
        await fs.writeFile(
          filePath,
          `Error processing URL: ${url}\nError details: ${pageError.message}`,
          "utf8"
        );
      } finally {
        if (page) {
          await page.close(); // Close the page after processing
        }
      }
    }
  } catch (mainError) {
    console.error("A main error occurred:", mainError);
  } finally {
    if (browser) {
      await browser.close(); // Close the browser when all URLs are processed or on main error
    }
  }
})();
