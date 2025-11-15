# Cakes by Katie

Code for website [cakesbykatie.co.uk](https://www.cakesbykatie.co.uk).

# Notes for Mum

- Run `gulp` in terminal to show live version

## Work TODO

- Delivery page is at `src/pages/delivery/index.njk`
    - Paragraph at top of page
    - If you want to change intro text to wedding venues, that is at `src/partials/wedding-venus.njk`
    - Intro text for Downe House section
        - Choose an image. You can change which cake is used by putting it at the start of the array in `data.json` at `venues['downe-house-school'].featuredCakes`
- Update Wasing Park page text in `data.json` at `venues['wasing-park']`
- Create page for each wedding venue we want
    1. Create a new entry in `venues` in `data.json`. I suggest you copy the `wasing-park` entry and make relevant changes.
    2. Create a new entry in `pages` in `data.json` called `venueXXXX` (e.g. `venueWasingPark`). Again I suggest you copy the `venueWasingPark` entry and update accordingly. The `venue` property must match the key you created in the `venues` object.
    3. Create new `.njk` file in `src/pages/delivery` folder. The name of the file will be the pathname of the web page. Do this by copying `src/pages/delivery/wasing-park.njk` and updating the `page` key to whatever `venueXXXX` key name you added to the `pages` object in `data.json`
- Distinguish wedding anniversary portfolio cakes with occasion `anniversary` by changing occasion to `anniversary-wedding`
- Review all `description` wording in `pages` objects in `data.json`


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