# Cakes by Katie

Code for website [cakesbykatie.co.uk](https://www.cakesbykatie.co.uk).

Built with [Eleventy](https://www.11ty.dev/) (Nunjucks templates + a JSON data cascade), Sass, PostCSS and esbuild, with a custom responsive-image pipeline (AVIF/WebP at multiple widths, via `sharp`). Deployed manually via FTP to the existing host.

## Development

```
npm install
npm run dev
```

This starts Eleventy's dev server with live reload at `http://localhost:8080`, alongside a Sass watcher and the responsive image generator (`scripts/generate-images.js --watch`).

## Building

```
npm run build
```

Builds the full production site into `dist/`: Eleventy renders the HTML, `scripts/generate-images.js` generates AVIF/WebP image variants into `.image-cache/` (cached across runs — only new/changed source images are reprocessed), Sass compiles to CSS, PostCSS (autoprefixer + cssnano) and PurgeCSS minify/trim the CSS, and esbuild minifies the JS.

## Deployment

```
npm run deploy
```

Uploads `dist/` via FTP to the existing host, using `config.js` (git-ignored — not included in this repo) for credentials: `host`, `FTP_USERNAME`, `FTP_PASSWORD`, `remoteFolder`.

# Notes for Mum

- Run `npm run dev` in terminal to show live version

## Work TODO

- Delivery page is at `src/pages/delivery/index.njk`
    - Paragraph at top of page
    - If you want to change intro text to wedding venues, that is at `src/_includes/wedding-venues.njk`
    - Intro text for Downe House section
        - Choose an image. You can change which cake is used by putting it at the start of the array in `src/content/venues.json` at `venues['downe-house-school'].featuredCakes`
- Update Wasing Park page text in `src/content/venues.json` at `venues['wasing-park']`
- Create page for each wedding venue we want
    1. Create a new entry in `venues` in `src/content/venues.json`. I suggest you copy the `wasing-park` entry and make relevant changes.
    2. Create a new entry in `pages` in `src/_data/pages.json` called `venueXXXX` (e.g. `venueWasingPark`). Again I suggest you copy the `venueWasingPark` entry and update accordingly. The `venue` property must match the key you created in the `venues` object.
    3. Create new `.njk` file in `src/pages/delivery` folder. The name of the file will be the pathname of the web page. Do this by copying `src/pages/delivery/wasing-park.njk` and updating the `page` key to whatever `venueXXXX` key name you added to the `pages` object in `src/_data/pages.json`
- Distinguish wedding anniversary portfolio cakes with occasion `anniversary` by changing occasion to `anniversary-wedding`
- Review all `description` wording in `pages` objects in `src/_data/pages.json`
- Use venue keys in porfolio cake `venue` rather than name, e.g. `post-barn` instead of `The Post Barn`


Page descripotions, anniversary c akes

# TODO

- New image for coloured cupcake cases
- Vegan toffee flavour image (and eventually redo all flavour images)
- Cupcake background image
- Celebration cakes background image
- Wedding background for CTA panel
- Wedding favour images (e.g. cake jars, biscuits, decorated biscuits, macarons)
- Deluxe cupcake flavours and images
- Gift images (e.g. cake jars, hot chocolate bombes, cupcakes (and bouquets))
- Image for money cakes

# Changes for Christmas

- Navbar link - styled Christmas link at top replaces normal link at bottom
- Mobile menu image
- Snow and Christmas hat in homepage hero
- Christmas section on homepage
- Prices on Christmas page - remove with CSS at bottom of christmas.scss
- Collection dates in Christmas page text and bottom panel CTA