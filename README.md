# Brock Pettay - Engineering Site

Minimal personal website focused on practical engineering tools and a clean presentation.

## Overview

This site is intentionally simple.

It is built to be clean, fast, and useful without unnecessary effects or extra clutter.
The current layout includes a landing page and a tools section, with room to expand over time.

## Structure

```text
root/
|-- assets/
|   |-- css/
|   |   |-- home.css
|   |   |-- style.css
|   |   `-- tools.css
|   |-- img/
|   |   `-- bp-monogram.png
|   |-- js/
|   |   |-- app.js
|   |   |-- converter-data.js
|   |   |-- converter.js
|   |   `-- navigation.js
|   `-- pdf/
|       `-- brock-pettay-resume.pdf
|-- CNAME
|-- Favicon.png
|-- README.md
`-- index.html
```

## Current Pages

- `home`: landing page, overview, roadmap, and resume entry point
- `tools`: engineering utilities, currently centered on the unit converter

Navigation is hash-based so each page state can be linked directly with URLs like `#home` or `#tools`.

## JavaScript Responsibilities

- `assets/js/app.js`: site bootstrap and feature initialization
- `assets/js/navigation.js`: page switching and URL synchronization
- `assets/js/converter-data.js`: converter categories, aliases, and defaults
- `assets/js/converter.js`: converter rendering, parsing, and live preview behavior

## Styling Responsibilities

- `assets/css/style.css`: shared tokens, layout primitives, navigation, and global responsiveness
- `assets/css/home.css`: landing page sections and roadmap layout
- `assets/css/tools.css`: converter layout, result panels, and tool-specific responsiveness

## Features

- Clean landing page
- Tools section with direct URL state
- Live unit converter
- Responsive layout
- Pure HTML, CSS, and JavaScript
- No frameworks or build step

## Planned Additions

Possible future tools:

- Drill / tap helper
- Shop math calculator
- Torque / bolt helper
- Material reference lookup
- Density and mass calculator

## Deployment

This site is hosted with GitHub Pages.

To update the site:
1. Edit the files.
2. Push changes to the `main` branch.
3. GitHub Pages updates the site automatically.

## Author

Brock Pettay
Mechanical Engineering - University of Akron

## License

This project is for personal and portfolio use.

Site: https://brockpettay.com
