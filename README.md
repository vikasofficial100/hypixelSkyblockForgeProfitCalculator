# Skyblock Forge Profit Calculator

A web application that helps Hypixel SkyBlock players identify profitable Forge crafts using live market data, recipe analysis, and profitability metrics.

**Live Application:** https://skyblockforge.games

---

## Overview

The Forge is one of the most popular passive money-making systems in Hypixel SkyBlock. However, determining which item to craft requires comparing recipe costs, forge durations, Bazaar prices, and Auction House values.

This project automates the entire process by collecting market data, processing Forge recipes, calculating profitability metrics, and presenting the results through searchable tables and visual analytics.

---

## Key Highlights

* Processes live Bazaar and Auction House market data for Forge profitability calculations
* Uses background data refresh and cache replacement to keep data updated while maintaining fast response times
* Provides profitability comparisons through interactive charts and visual analytics
* Includes search, filtering, and sorting across all Forge crafts
* Deployed and publicly accessible at skyblockforge.games

---

## Features

* Search and filtering across Forge crafts
* Interactive profitability charts and visualizations
* Profit, ROI, and profit-per-hour calculations
* Live Bazaar and Auction House data integration
* Automated Forge recipe processing
* Fast cached responses with background data refresh
* Sorting by profit, ROI, profit per hour, and other metrics

---

## Technical Highlights

### Data Refresh Pipeline

The backend periodically fetches market data from external sources and generates a processed Forge dataset.

During each refresh cycle, the application:

1. Fetches Bazaar and Auction House prices
2. Retrieves Forge recipes
3. Calculates crafting costs and profitability metrics
4. Generates a processed Forge dataset
5. Updates the cache with the newly processed results
6. Serves the updated data to clients

Users can also manually trigger a refresh from the frontend using the **Refresh Prices** option.

### Caching Strategy

Fetching and processing market data from external sources can take several minutes.

To avoid making users wait, the application always serves the most recently processed dataset from cache. While users continue receiving cached results, the backend fetches fresh market data and recalculates all Forge metrics in the background.

Once processing is complete:

* The old cache is replaced
* New profitability calculations are generated
* The latest dataset becomes immediately available

This approach reduces response times from minutes to milliseconds while ensuring users always have access to recent market data.

### Analytics & Visualization

The application includes interactive charts that allow users to quickly compare:

* Most profitable Forge crafts
* Highest profit-per-hour opportunities
* ROI rankings
* Relative profitability across Forge items

### Search & Sorting

Forge crafts can be searched, filtered, and sorted by multiple profitability metrics, allowing users to quickly identify profitable opportunities without additional server requests.

---

## Tech Stack

### Frontend

* React.js
* JavaScript
* CSS

### Backend

* Node.js
* Express.js

### Data Sources

* Coflnet API
* Official Hypixel SkyBlock Wiki

---

## Project Structure

```text
skyblock-forge-profit-calculator/
│
├── Backend/
│   ├── data/
│   │   ├── cache.json
│   │   └── recipe.json
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── constants.js
│   │   │
│   │   ├── routes/
│   │   │   └── forgeRoutes.js
│   │   │
│   │   ├── services/
│   │   │   ├── cacheService.js
│   │   │   └── forgeService.js
│   │   │
│   │   ├── utils/
│   │   │   ├── priceFetcher.js
│   │   │   ├── profitCalculator.js
│   │   │   └── recipeLoader.js
│   │   │
│   │   └── app.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── index.html
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorDisplay.js
│   │   │   ├── Header.js
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── Sidebar.js
│   │   │   └── SkeletonRow.js
│   │   │
│   │   ├── pages/
│   │   │   ├── ForgeDetail.js
│   │   │   └── ForgeList.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── tailwind.config.js
│
├── README.md
└── .gitignore
```

---

## How It Works

The backend periodically fetches market data from external sources and generates a processed Forge dataset.

The processing pipeline:

1. Fetches Bazaar and Auction House prices
2. Retrieves Forge recipes
3. Calculates ingredient costs for every craft
4. Calculates profit, ROI, and profit-per-hour metrics
5. Sorts and structures the data
6. Stores the processed results in cache
7. Serves the cached dataset to the frontend

When new market data is available, the cache is replaced with freshly processed results.

The frontend consumes the processed dataset and provides search, filtering, sorting, and visualization tools for users.

### Profit Formula

```text
Profit = Sell Price - Craft Cost

Profit Per Hour = Profit / Forge Duration
```

---

## Local Development

### Clone the Repository

```bash
git clone <repository-url>
cd skyblock-forge-profit-calculator
```

### Install Dependencies

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
npm install
```

### Run the Application

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm start
```

---

## Contributing

Contributions are welcome.

### Development Workflow

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Make your changes
4. Commit your work

```bash
git commit -m "Add new feature"
```

5. Push your changes

```bash
git push origin feature/new-feature
```

6. Open a Pull Request

### Contribution Guidelines

* Follow the existing project structure
* Keep pull requests focused and easy to review
* Write clear and meaningful commit messages
* Test changes before submitting
* Update documentation when necessary

### Areas for Contribution

* Historical profitability tracking
* Historical Bazaar and Auction House price analytics
* Advanced filtering and sorting options
* Additional profitability visualizations
* UI/UX improvements
* Performance optimizations
* Discord bot integration for Forge profitability alerts and commands

---

## Future Improvements

* Historical profitability tracking
* Historical Bazaar and Auction House price analytics
* Advanced filtering and sorting options
* Additional profitability visualizations
* UI/UX improvements
* Performance optimizations
* Discord bot integration for Forge profitability alerts and commands

---

## Disclaimer

This project is an independent community tool and is not affiliated with Hypixel, Mojang Studios, or Microsoft.

Market prices fluctuate frequently, and profitability estimates may change over time.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
