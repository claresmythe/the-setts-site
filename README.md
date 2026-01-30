# The Setts

A single-page website for **The Setts**, featuring an interactive slot-machine style logo and links to social and location. 

## Overview

The site displays the “The Setts” custom SVG logo. On load, the letters briefly scramble like a slot machine, then settle into the final spelling. Hovering (or touching on mobile) over any letter makes that letter scramble through random glyphs until the pointer leaves or the touch ends.

## Hosting
The site is hosted using GitHub pages. The DNS is managed at GoDaddy and the site can be found at the following URLs.

- https://claresmythe.github.io/the-setts-site/
- https://thesetts.com.au/
- https://www.thesetts.com.au/ 

## Repository

The source code lives on GitHub: **[claresmythe/the-setts-site](https://github.com/claresmythe/the-setts-site)**. To clone a copy to your machine:

```bash
git clone https://github.com/claresmythe/the-setts-site.git
```

## Project structure

```
the-setts/
├── index.html          # Single page: markup, styles, SVG, and script
├── Knockout HTF49-Liteweight-Regular.otf
└── README.md
```


## Editing

You can change the site in two ways. **In GitHub:** open the repo on GitHub, go to the file you want to change (e.g. `index.html`), click the pencil icon to edit, make your changes, and commit. The update will go live after GitHub Pages rebuilds. **Locally:** clone the repo to your machine (`git clone` plus the repo URL), edit the files in your editor, then commit and push your changes. Once pushed, GitHub Pages will serve the new version.