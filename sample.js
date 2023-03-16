const { appendFile, readFileSync } = require("fs");
const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto("https://datafit.ai/");
  const categoryList = [];
  const categoryHandler = await page.$$(
    "body > main > section.question-area.pt-80px.pb-30px > div > div > div.col-lg-2.pr-0 > div > ul > li"
  );
  for (const categoryHandle of categoryHandler) {
    const category = await page.evaluate(
      (el) => el.textContent,
      categoryHandle
    );
    categoryList.push(category);
  }

  console.log(categoryList);
  for (let category of categoryList) {
    if (category === "Home") {
      // For "Home" category
      while (false) {
        const cardHandler = await page.$$(
          "div.questions-snippet.border-top.border-top-gray > *"
        );

        for (const cardHandle of cardHandler) {
          const title = await page.evaluate(
            (el) =>
              el
                .querySelector("div.media-body > h5 > a")
                .textContent.replace(/\+/g, "")
                .replace(/\n/g, ""),
            cardHandle
          );
          const desc = await page.evaluate(
            (el) =>
              el
                .querySelector("div.media-body > p")
                .textContent.replace(/\+/g, "")
                .replace(/\n/g, ""),
            cardHandle
          );
          const tags = await page.evaluate(
            (el) =>
              el
                .querySelector("div.media-body > div.tags")
                .textContent.replace(/\+/g, "")
                .replace(/\n/g, ""),
            cardHandle
          );
          const upVotes = await page.evaluate(
            (el) =>
              el
                .querySelector(
                  "div.votes.text-center.votes-2 > div.vote-block > span.vote-counts"
                )
                .textContent.replace(/\+/g, "")
                .replace(/\n/g, ""),
            cardHandle
          );
          fs.appendFile(
            "results.csv",
            `Home,${title.replace(/,/g, ".")},${desc.replace(
              /,/g,
              "."
            )},${tags.replace(/,/g, ".")},${upVotes}\n`,
            function (err) {
              if (err) throw err;
            }
          );
        }
        // Check if "Load More" button is present
        const loadMoreBtn = await page.$(
          "section.question-area.pt-80px.pb-30px > div > div > div.col-lg-7.px-0 > div > div.text-center.mt-4.cursor > span"
        );
        if (loadMoreBtn) {
          // Click the "Load More" button
          await loadMoreBtn.click();
          // Wait for the page to load new cards
          await page.waitForSelector(
            "div.questions-snippet.border-top.border-top-gray>*"
          );
        } else {
          // Exit the loop if "Load More" button is not found
          break;
        }
      }
    } else {
      // For categories other than "Home"
      await page.goto(
        `https://datafit.ai/cat/${
          category === "Social Media"
            ? (category = "social-media")
            : category.toLowerCase()
        }`
      );
      let pageNum = 1;
      while (true) {
        const cardHandler = await page.$$("#ajaxMyTabContent > div>*");
        for (const cardHandle of cardHandler) {
          const title = await page.evaluate(
            (el) =>
              el
                .querySelector("div.media-body > h5 > a")
                .textContent.replace(/\+/g, "")
                .replace(/\n/g, ""),
            cardHandle
          );
          const tags = await page.evaluate(
            (el) =>
              el
                .querySelector("div.media-body > div.tags")
                .textContent.replace(/\+/g, "")
                .replace(/\n/g, ""),
            cardHandle
          );
          const upVotes = await page.evaluate(
            (el) =>
              el
                .querySelector(
                  "div.votes > div.vote-block.d-flex.align-items-center.justify-content-between > span.vote-counts"
                )
                .textContent.replace(/\+/g, "")
                .replace(/\n/g, ""),
            cardHandle
          );
          fs.appendFile(
            "results.csv",
            `${category},${title.replace(/,/g, ".")},${""},${tags.replace(
              /,/g,
              "."
            )},${upVotes}\n`,
            function (err) {
              if (err) throw err;
            }
          );
        }

        const nextPageBtn = await page.$(
          "body > main > section.question-area.pt-60px > div > div > div.col-lg-7 > div > div.pager.pt-30px > nav > ul > li:last-child > a"
        );
        if (nextPageBtn) {
          // Click the next page button
          await nextPageBtn.click();
          // Wait for the page to load new cards
          await page.waitForSelector("#ajaxMyTabContent > div>*");
          pageNum++;
          // If the URL has a hashtag, remove it to avoid duplicate entries in the CSV file
          if (
            page.url().includes("marketing?page=29") ||
            page.url().includes("#")
          ) {
            break;
          }
        } else {
          // Exit the loop if there is no next page button
          break;
        }
      }
    }
  }
  await browser.close();
})();
