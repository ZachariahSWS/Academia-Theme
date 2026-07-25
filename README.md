# Academia

A typography-first [Zola](https://www.getzola.org/) theme for essays and notes,
with sidenotes, MathML, charts, syntax highlighting, and dark mode.

Requires Zola 0.22+, Node.js 18+, and npm.

## Install

```sh
git submodule add https://github.com/ZachariahSWS/Academia-Theme.git themes/academia
npm ci --prefix themes/academia
```

```toml
# zola.toml
theme = "academia"
base_url = "https://www.example.com"

[extra]
academia_author = "Your name"
academia_outline_thread = true
```

Build the site and run Academia's postprocessor:

```sh
zola build
npm --prefix themes/academia run postprocess -- "$PWD/public"
```

Set `base_url` to the site's final URL so links and assets are generated
correctly.

## GitHub Actions

The included workflow can be called from a site repository. It builds and
postprocesses the site but does not deploy it.

```yaml
jobs:
  build:
    uses: ZachariahSWS/Academia-Theme/.github/workflows/build.yml@main
    with:
      theme-directory: themes/academia
```

## Content

```yaml
---
title: "An essay"
extra:
  subtitle: "Optional subtitle"
  outline_thread: true
---
```

The theme provides `math`, `proof`, and `linechart` shortcodes. Standard
Markdown footnotes are rendered as sidenotes.

## Development

```sh
npm ci
npm run build
```

## License

[MIT](LICENSE)
