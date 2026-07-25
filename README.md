# Academia

A typography-first [Zola](https://www.getzola.org/) theme for essays and notes.

Features include a scroll-aware outline, sidenotes, MathML, CSV line charts, syntax highlighting, dark mode, print styles, and local fonts.

## Build

Requires Zola 0.22+, Node.js 18+, and npm.

```sh
npm ci
npm run build
```

The build writes the site to `public/`, renders charts and math, and publishes raw Markdown beside each page.

Use `zola serve` for template and CSS work. Postprocessed features appear only after `npm run build`.

## Install as a theme

```sh
git submodule add https://github.com/ZachariahSWS/Academia-Theme.git themes/academia
npm ci --prefix themes/academia
```

```toml
# zola.toml
theme = "academia"
base_url = "https://www.example.com"
generate_feeds = true
feed_filenames = ["atom.xml"]

[extra]
academia_author = "Your name"
academia_outline_thread = true
academia_favicon = "favicon.ico"
academia_menu = [
    { name = "Home", url = "/" },
    { name = "Notes", url = "/notes/" },
]
```

Production build:

```sh
zola build
npm --prefix themes/academia run postprocess -- "$PWD/public"
```

Set `base_url` in the site's `zola.toml` to its final origin, including `https://`
and any path prefix. The theme uses that value for canonical URLs, feeds, assets,
raw Markdown links, and chart downloads. The theme repository's own `zola.toml`
only configures its example site.

For GitHub Pages, keep the
[deployment workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
in the site repository. It needs to check out submodules, install Zola and
Node.js, run the production build above, and deploy `public/` as the Pages
artifact. Configure a
[custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
in the site repository's Pages settings; a `CNAME` file in this theme is neither
needed nor used.

## Page options

```toml
+++
title = "An essay"
date = 2026-07-16

[extra]
subtitle = "Optional subtitle"
outline_thread = true
linechart = false
+++
```

## Writing

```text
Text with a numbered sidenote.[^13]
Text with a dagger sidenote.[^context]

[^13]: Displays as sidenote 13.
[^context]: Displays without a number.

{% math(display=false) %}e^{i\pi} + 1 = 0{% end %}

{% proof(title="Proof") %}
Proof body.
{% end %}

{{ linechart(src="/data/series.csv", title="A series", x_label="Date", y_label="Value") }}
```

Numeric footnote IDs display verbatim. Named IDs display a dagger.

Chart CSV files belong under `static/` and require a `date` column followed by one to three numeric series.

## License

[MIT](LICENSE)
