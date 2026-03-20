# Feature Prompt 004

## Feature Title
Create a unique search field for the application that allows users to quickly find foods

## Summary

As a user, I want to quickly find foods in the application so that I can easily access nutritional information and make informed dietary choices.

## Motivation
The current search field and functionality are not user-friendly and do not provide accurate results and a unique component that can be used for the whole application. By creating a unique search field, we can improve the user experience and help users find the information they need more efficiently

## Goals
- Unique search field component that can be used across the application
- Improved search functionality that provides accurate results
- Unique design that enhances the user experience and makes it easier to find foods
- Limited search results to 10 items to improve performance and user experience with load more button to load more results if needed
- Implement search suggestions as the user types to help them find what they are looking for more quickly
- Show latest's user search history to allow users to quickly access previously searched items
- Separate results into tabs for Common, Braded and Custom foods to help users find what they are looking for more easily
- Navigation with keyboard
- Loading and error states to provide feedback to users during the search process
- Custom actions when selecting the food item from the search depending on the context of the search (e.g., adding to diary, viewing details, etc.)

## Non-Goals
- 

## Scope
### In scope
- A new search field component that can be used across the application
- A contsained component that can be used in different contexts (e.g., diary, food details, etc.) with minimal configuration, properties and actions to be passed as props.
- Improved search functionality that provides accurate results
- Refactoring the existing search functionality to use the new search field component
- Showing latest's user search history
- Separating results into tabs for Common, Branded and Custom foods
- Navigation with keyboard
- Loading and error states
- Custom actions when selecting the food item from the search depending on the context of the search
- Add the search field to the landing page navigating to the food details page when selecting a food item from the search results
- Add a anonymous page detailed the search results when selecting a food from the landing page

### Out of scope
- 

## Functional Requirements
1. The search field should be a unique component that can be used across the application.
2. The search functionality should provide accurate results based on the user's input.
3. The search results should be limited to 10 items to improve performance and user experience, with a load more button to load more results if needed.
5. The search field should show the latest user search history to allow users to quickly access previously searched items. The latest user search history should be stored in the local storage and should be cleared after 30 days of inactivity. The limit of latest user search history should be 30 items, and the oldest item should be removed when the limit is exceeded.
6. The search field should implement search suggestions as the user types to help them find what they are looking for more quickly. The search suggestions should be based on the user's input and should be updated in real-time as the user types. The suggestions come from the search history as a paritial match of the user input and from the search results as a partial match of the user input.
7. Display the latest search user in a list under the search field, showing the most recent searches at the top. Each item in the search history should be clickable, allowing users to quickly access previously searched items without having to type them again.
8. Limit the number of search suggestions to 5 items to avoid overwhelming the user with too many options.
9. The search results should be separated into tabs for Common, Branded and Custom foods to help users find what they are looking for more easily.
10. The search field should support navigation with the keyboard to allow users to quickly navigate through the search results and select items without using a mouse. Arrow keys to move up and down through the search suggestions and results, and the Enter key to select an item and escape key to close the search results and clear the search field.
11. The search field should display loading and error states to provide feedback to users during the search process. The loading state should be displayed while the search is being performed, and the error state should be displayed if there is an issue with the search (e.g., network error). The load state only apears after a delay of 500ms to avoid showing the loading state for very fast searches.
12 An empty state should be displayed if there are no search results matching the user's input, providing feedback that the search was performed but no results were found. The empty state should include a message indicating that no results were found and may also include suggestions for refining the search query.
13. The search needs a minimum of 3 characters to start searching to avoid unnecessary searches and improve performance.
14. The search field should have custom actions when selecting the food item from the search depending on the context of the search (e.g., adding to diary, viewing details, etc.). The actions should be configurable and passed as props to the search field component as an enum.
15. The seaarch field should be added to food log page, allowing users to quickly find foods and add them to their diary when selecting a food item from the search results. When selecting a food item from the search results, the user should be able to add it to their diary with a single click, without having to navigate to the food details page. The user should also have the option to view the food details page if they want more information about the food item before adding it to their diary via a link in the food title or a button in the search result item.
16. In the food log page when selecting a food from the search results, a modal should appear allowing users to select the meal and the serving size before adding the food to their diary.
17. Keep the food log functionaly the wau it is now, it will be improoved in the future.
18. The search field should be added to the landing page, allowing *anonymous* users to quickly find foods and navigate to the food details page when selecting a food item from the search results.
19. When selecting a food item from the search results on the landing page, an anonymous page should be displayed detailing the search results, providing information about the food item and allowing users to navigate to the food details page if they want more information about the food item before adding it to their diary. Show the food title, its images and the nutritional information similar to this page: https://foods.fatsecret.com/calories-nutrition/usda/apples?portionid=58449&portionamount=100.000
20. The food details page must be a server side rendered page to allow search engines to index the content and improve SEO. The argument is the foodid ot the fatsecretid depending if the food exists or not in the database.
21. Keep the apis and database schemas the way they are now.
22. Use shadcn UI components for the search field and its related UI elements to maintain consistency with the rest of the application and to leverage the benefits of using a well-designed component library.
23. Use the html in the Technical details section for the search field and its related UI elements to ensure that the implementation is consistent with the design and to provide a clear reference for developers. However spllit it in to smaller components if needed to improve maintainability and reusability. Keep the design and functionality the same as the provided html. Replace what is possible with shadcn UI components. Replace the moock data with real data from the database and APIs.


## Technical details
```html
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <title>Search Component Demo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- Tailwind CDN for styling -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-xl">
    <div id="search-root" class="relative"></div>
  </div>

  <script>
    // ----- Demo Data -----
    const demoResults = [
      // Common foods
      {
        id: "1",
        type: "common",
        title: "Avocado Toast",
        description: "Toasted sourdough topped with smashed avocado, chili flakes, and lemon.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "2",
        type: "common",
        title: "Berry Smoothie",
        description: "Mixed berry smoothie with Greek yogurt and honey.",
        image: "https://images.unsplash.com/photo-1523365280197-f21d6e9de5dc?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "7",
        type: "common",
        title: "Greek Yogurt Parfait",
        description: "Layered yogurt with granola and fresh berries.",
        image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "8",
        type: "common",
        title: "Veggie Omelette",
        description: "Three-egg omelette with spinach, tomato, and cheese.",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "13",
        type: "common",
        title: "Chicken Caesar Salad",
        description: "Romaine lettuce with grilled chicken, croutons, and parmesan.",
        image: "https://images.unsplash.com/photo-1569058242567-93de6f6a9575?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "14",
        type: "common",
        title: "Tomato Basil Soup",
        description: "Creamy tomato soup with fresh basil and olive oil.",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "15",
        type: "common",
        title: "Grilled Veggie Sandwich",
        description: "Grilled zucchini, peppers, and eggplant on ciabatta.",
        image: "https://images.unsplash.com/photo-1568051243853-50b4ecaad86e?auto=format&fit=crop&w=200&q=80"
      },
      // Branded foods
      {
        id: "3",
        type: "branded",
        title: "StarBrew Iced Latte",
        description: "Ready-to-drink vanilla iced latte, 250 ml bottle.",
        image: "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "4",
        type: "branded",
        title: "FitFuel Protein Bar - Chocolate",
        description: "12g protein, 5g fiber, 180 calories per bar.",
        image: "https://images.unsplash.com/photo-1580915411954-282cb1c9c450?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "9",
        type: "branded",
        title: "FreshFizz Sparkling Water - Lime",
        description: "Unsweetened sparkling water with natural lime flavor.",
        image: "https://images.unsplash.com/photo-1544124499-58912cbddade?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "10",
        type: "branded",
        title: "NutriBite Granola Clusters",
        description: "Crunchy oat clusters with almonds and honey.",
        image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=200&q=80"
      },
      // Custom foods
      {
        id: "5",
        type: "custom",
        title: "My Lunch Bowl",
        description: "Brown rice with grilled chicken, avocado, and mixed veggies.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "6",
        type: "custom",
        title: "Post-Workout Shake",
        description: "Banana, whey protein, peanut butter, and oat milk.",
        image: "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "11",
        type: "custom",
        title: "Sunday Pancake Stack",
        description: "Homemade pancakes with maple syrup and blueberries.",
        image: "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "12",
        type: "custom",
        title: "Office Snack Box",
        description: "Mixed nuts, dark chocolate, and dried fruit.",
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=200&q=80"
      }
    ];

    // Simulate async search with simple multi-word relevance scoring
    function fakeSearchApi(query) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const trimmed = query.trim().toLowerCase();
          if (!trimmed) {
            resolve([]);
            return;
          }

          const words = trimmed.split(/\s+/).filter(Boolean);

          const scored = demoResults
            .map((item) => {
              const title = item.title.toLowerCase();
              const desc = (item.description || "").toLowerCase();

              // Require every word to appear in either title or description
              const allWordsMatch = words.every(
                (w) => title.includes(w) || desc.includes(w)
              );
              if (!allWordsMatch) return null;

              // Score: title matches weighted higher than description
              let score = 0;
              words.forEach((w) => {
                if (title.includes(w)) score += 2;
                if (desc.includes(w)) score += 1;
              });

              return { item, score };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .map((entry) => entry.item);

          resolve(scored);
        }, 250); // small delay to feel async
      });
    }

    // ----- HTML "Search" Component -----
    (function initSearch() {
      const root = document.getElementById("search-root");

      root.innerHTML = `
        <div class="relative" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-owns="results-list">
          <div class="bg-white border shadow-sm rounded-3xl">
            <div class="flex items-center gap-3 px-5 py-3">
              <span id="badge" class="inline-flex items-center rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0">
                Search Foods
              </span>
              <input
                id="search-input"
                type="text"
                placeholder="Search for your favorite food or meal"
                class="flex h-12 w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                autocomplete="off"
                aria-autocomplete="list"
                aria-controls="results-list"
              />
              <button
                id="clear-search"
                type="button"
                class="hidden text-xs text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            id="dropdown"
            class="absolute top-full left-0 right-0 mt-2 bg-white border shadow-lg rounded-3xl overflow-hidden z-50 hidden"
          >
            <div id="empty-content" class="hidden">
              <div class="p-4 text-sm text-slate-500">
                Type at least 3 characters to search.
              </div>
              <div class="px-4 pb-3 flex flex-wrap gap-2 text-xs">
                <span class="text-slate-400 mr-1">Try:</span>
                <button type="button" class="popular-search px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700" data-query="avocado toast">
                  Avocado toast
                </button>
                <button type="button" class="popular-search px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700" data-query="protein bar">
                  Protein bar
                </button>
                <button type="button" class="popular-search px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700" data-query="salad">
                  Salad
                </button>
              </div>
            </div>

            <div id="results-container" class="hidden">
              <!-- Tabs -->
              <div class="border-b px-4 pt-3 pb-2 flex gap-2 text-xs font-medium text-slate-500">
                <button id="tab-common" type="button" class="px-3 py-1 rounded-full bg-green-600 text-white">
                  Common (0)
                </button>
                <button id="tab-branded" type="button" class="px-3 py-1 rounded-full hover:bg-slate-100">
                  Branded (0)
                </button>
                <button id="tab-custom" type="button" class="px-3 py-1 rounded-full hover:bg-slate-100">
                  Custom (0)
                </button>
              </div>

              <div id="results-list" class="max-h-[320px] overflow-y-auto p-2" role="listbox"></div>

              <!-- Load more (outside of tabs, below results) -->
              <div class="px-4 pb-2 pt-1 flex justify-center">
                <button
                  id="load-more"
                  type="button"
                  class="hidden text-xs font-medium text-green-700 hover:text-green-800"
                >
                  Load more results
                </button>
              </div>

              <div class="px-4 pb-2 text-right">
                <button
                  id="view-all"
                  type="button"
                  class="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  View all results
                </button>
              </div>

              <div class="border-t px-4 py-3 bg-slate-50">
                <div class="flex items-center justify-center gap-6 text-xs text-slate-500">
                  <div class="flex items-center gap-1.5">
                    <kbd class="inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono font-medium text-[10px]">
                      ↑
                    </kbd>
                    <kbd class="inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono font-medium text-[10px]">
                      ↓
                    </kbd>
                    <span>to navigate</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <kbd class="inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono font-medium text-[10px]">
                      ↵
                    </kbd>
                    <span>to select</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <kbd class="inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono font-medium text-[10px]">
                      ESC
                    </kbd>
                    <span>to clear</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Live region for screen readers -->
            <div id="results-live" class="sr-only" aria-live="polite"></div>
          </div>
        </div>
      `;

      const input = document.getElementById("search-input");
      const clearSearchButton = document.getElementById("clear-search");
      const dropdown = document.getElementById("dropdown");
      const emptyContent = document.getElementById("empty-content");
      const resultsContainer = document.getElementById("results-container");
      const resultsList = document.getElementById("results-list");

      const tabCommon = document.getElementById("tab-common");
      const tabBranded = document.getElementById("tab-branded");
      const tabCustom = document.getElementById("tab-custom");
      const loadMoreButton = document.getElementById("load-more");
      const viewAllButton = document.getElementById("view-all");
      const liveRegion = document.getElementById("results-live");
      const popularSearchButtons = document.querySelectorAll(".popular-search");
      const comboboxRoot = document.querySelector('[role="combobox"]');

      let allResults = [];
      let results = [];
      let selectedIndex = -1;
      let activeTab = "common";
      const PAGE_SIZE = 4;
      let loadedCount = 0;
      let currentQuery = "";
      let searchTimeout = null;

      function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      function highlightText(text, query) {
        if (!query.trim()) return text;
        const words = query
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .map(escapeRegExp);
        if (!words.length) return text;
        const pattern = new RegExp("(" + words.join("|") + ")", "gi");
        return text.replace(
          pattern,
          '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">$1</mark>'
        );
      }

      function showDropdown(show) {
        dropdown.classList.toggle("hidden", !show);
        if (comboboxRoot) {
          comboboxRoot.setAttribute("aria-expanded", show ? "true" : "false");
        }
      }

      function renderEmpty() {
        emptyContent.classList.remove("hidden");
        resultsContainer.classList.add("hidden");
      }

      function renderResults() {
        emptyContent.classList.add("hidden");
        resultsContainer.classList.remove("hidden");

        resultsList.innerHTML = "";

        if (!results.length) {
          resultsList.innerHTML = '<div class="p-4 text-sm text-slate-500">No items in this tab.</div>';

          if (loadedCount < allResults.length) {
            loadMoreButton.classList.remove("hidden");
          } else {
            loadMoreButton.classList.add("hidden");
          }

          if (liveRegion) {
            liveRegion.textContent = `No results in ${activeTab} tab.`;
          }
          return;
        }

        results.forEach((result, index) => {
          const isSelected = index === selectedIndex;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.setAttribute("role", "option");
          btn.id = `result-${result.id}`;
          btn.setAttribute("aria-selected", isSelected ? "true" : "false");
          btn.className = [
            "w-full flex items-start gap-3 px-2 py-3 rounded-sm text-left transition-colors",
            isSelected
              ? "bg-slate-100"
              : "hover:bg-slate-50"
          ].join(" ");

          btn.innerHTML = `
            ${result.image
              ? `<img src="${result.image}" alt="${result.title}" class="mt-0.5 h-10 w-10 shrink-0 rounded object-cover" />`
              : `<div class="mt-0.5 h-10 w-10 shrink-0 rounded bg-slate-200"></div>`
            }
            <div class="flex flex-col gap-1 min-w-0">
              <span class="font-medium text-sm">${highlightText(result.title, currentQuery)}</span>
              ${result.description
              ? `<span class="text-xs text-slate-500 line-clamp-2">${highlightText(result.description, currentQuery)}</span>`
              : ""
            }
              <span class="inline-flex w-fit mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                ${result.type}
              </span>
            </div>
          `;

          btn.addEventListener("mouseenter", () => {
            selectedIndex = index;
            renderResults();
          });

          btn.addEventListener("click", () => {
            handleSelect(result);
          });

          resultsList.appendChild(btn);
        });

        // Show or hide "Load more" based on whether more global results exist
        if (loadedCount < allResults.length) {
          loadMoreButton.classList.remove("hidden");
        } else {
          loadMoreButton.classList.add("hidden");
        }

        // Auto-scroll selected item into view
        if (selectedIndex >= 0 && resultsList.children[selectedIndex]) {
          resultsList.children[selectedIndex].scrollIntoView({
            block: "nearest"
          });
        }

        // Update active descendant for accessibility
        if (selectedIndex >= 0 && results[selectedIndex]) {
          input.setAttribute("aria-activedescendant", `result-${results[selectedIndex].id}`);
        } else {
          input.removeAttribute("aria-activedescendant");
        }

        // Announce result count
        if (liveRegion) {
          const commonCount = allResults.filter((i) => i.type === "common").length;
          const brandedCount = allResults.filter((i) => i.type === "branded").length;
          const customCount = allResults.filter((i) => i.type === "custom").length;
          liveRegion.textContent = `${allResults.length} results total. Common ${commonCount}, Branded ${brandedCount}, Custom ${customCount}.`;
        }
      }

      function updateVisibleResults() {
        // Take the first N loaded items globally, then filter by tab.
        // If there are items for this tab later in the list, automatically
        // increase the loaded window so the first items for the tab are visible
        // without requiring a manual "Load more" click.
        let visiblePool = allResults.slice(0, loadedCount);
        let tabHasAnyGlobally = allResults.some((item) => item.type === activeTab);

        while (tabHasAnyGlobally) {
          const currentForTab = visiblePool.filter((item) => item.type === activeTab);
          if (currentForTab.length > 0) {
            break;
          }

          if (loadedCount >= allResults.length) {
            break;
          }

          loadedCount = Math.min(loadedCount + PAGE_SIZE, allResults.length);
          visiblePool = allResults.slice(0, loadedCount);
        }

        results = visiblePool.filter((item) => item.type === activeTab);
        selectedIndex = results.length ? 0 : -1;
        renderResults();
      }

      function updateTabCounts() {
        const commonCount = allResults.filter((i) => i.type === "common").length;
        const brandedCount = allResults.filter((i) => i.type === "branded").length;
        const customCount = allResults.filter((i) => i.type === "custom").length;

        tabCommon.textContent = `Common (${commonCount})`;
        tabBranded.textContent = `Branded (${brandedCount})`;
        tabCustom.textContent = `Custom (${customCount})`;
      }

      function setActiveTab(tab) {
        activeTab = tab;

        const activeClasses = "px-3 py-1 rounded-full bg-green-600 text-white";
        const inactiveClasses = "px-3 py-1 rounded-full hover:bg-slate-100";

        tabCommon.className = tab === "common" ? activeClasses : inactiveClasses;
        tabBranded.className = tab === "branded" ? activeClasses : inactiveClasses;
        tabCustom.className = tab === "custom" ? activeClasses : inactiveClasses;

        updateVisibleResults();
      }

      function handleSelect(result) {
        alert("Selected: " + result.title);
        input.value = result.title;
        results = [];
        selectedIndex = -1;
        showDropdown(false);
      }

      async function handleSearch(query) {
        currentQuery = query;
        const trimmed = query.trim();

        // Require at least 3 characters to search
        if (trimmed.length < 3) {
          allResults = [];
          results = [];
          selectedIndex = -1;
          loadedCount = 0;
          showDropdown(!!trimmed.length);
          emptyContent.classList.remove("hidden");
          emptyContent.innerHTML = '<div class="p-4 text-sm text-slate-500">Type at least 3 characters to search.</div>';
          resultsContainer.classList.add("hidden");
          return;
        }

        showDropdown(true);
        // Show "loading" as empty state
        emptyContent.classList.remove("hidden");
        emptyContent.innerHTML = `
          <div class="p-4 text-sm text-slate-500 flex items-center gap-2">
            <span class="inline-block h-3 w-3 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin"></span>
            <span>Searching...</span>
          </div>
          <div class="px-4 pb-3 space-y-2">
            <div class="h-4 rounded bg-slate-100 animate-pulse"></div>
            <div class="h-4 rounded bg-slate-100 animate-pulse"></div>
            <div class="h-4 rounded bg-slate-100 animate-pulse w-2/3"></div>
          </div>
        `;
        resultsContainer.classList.add("hidden");

        try {
          const data = await fakeSearchApi(query);
          allResults = data;
          selectedIndex = -1;
          loadedCount = Math.min(PAGE_SIZE, allResults.length);

          if (!allResults.length) {
            emptyContent.classList.remove("hidden");
            emptyContent.innerHTML = '<div class="p-4 text-sm text-slate-500">No results found.</div>';
            resultsContainer.classList.add("hidden");
          } else {
            // Reset to common tab on each new search
            updateTabCounts();
            setActiveTab("common");
          }
        } catch (error) {
          console.error("Search error:", error);
          emptyContent.classList.remove("hidden");
          emptyContent.innerHTML = `
            <div class="p-4 text-sm text-red-500 flex items-center justify-between gap-3">
              <span>Error performing search.</span>
              <button id="retry-search" type="button" class="text-xs font-medium underline">
                Try again
              </button>
            </div>
          `;
          resultsContainer.classList.add("hidden");

          const retryButton = document.getElementById("retry-search");
          if (retryButton) {
            retryButton.addEventListener("click", () => {
              handleSearch(currentQuery);
            });
          }
        }
      }

      input.addEventListener("input", (e) => {
        const value = e.target.value;
        selectedIndex = -1;
        if (value) {
          clearSearchButton.classList.remove("hidden");
        } else {
          clearSearchButton.classList.add("hidden");
        }

        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
          handleSearch(value);
        }, 300);
      });

      clearSearchButton.addEventListener("click", () => {
        input.value = "";
        clearSearchButton.classList.add("hidden");
        allResults = [];
        results = [];
        selectedIndex = -1;
        loadedCount = 0;
        showDropdown(false);
      });

      // Tab click handlers
      tabCommon.addEventListener("click", () => setActiveTab("common"));
      tabBranded.addEventListener("click", () => setActiveTab("branded"));
      tabCustom.addEventListener("click", () => setActiveTab("custom"));

      // Load more handler (loads more globally, regardless of active tab)
      loadMoreButton.addEventListener("click", () => {
        if (!allResults.length) return;
        loadedCount = Math.min(loadedCount + PAGE_SIZE, allResults.length);
        updateVisibleResults();
      });

      // Popular search chips
      popularSearchButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const q = btn.getAttribute("data-query") || "";
          input.value = q;
          clearSearchButton.classList.remove("hidden");
          handleSearch(q);
          input.focus();
        });
      });

      // View all results (demo only)
      viewAllButton.addEventListener("click", () => {
        if (!allResults.length) return;
        alert(`Viewing all ${allResults.length} results (demo only).`);
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          input.value = "";
          results = [];
          selectedIndex = -1;
          showDropdown(false);
          input.blur();
          return;
        }

        if (!results.length) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (selectedIndex < results.length - 1) {
            selectedIndex++;
            renderResults();
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (selectedIndex > -1) {
            selectedIndex--;
            renderResults();
          }
        } else if (e.key === "Enter" && selectedIndex >= 0) {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      });

      // Click outside to close
      document.addEventListener("click", (e) => {
        if (!root.contains(e.target)) {
          showDropdown(false);
        }
      });
    })();
  </script>
</body>

</html>
```


