+++
title = "Academia"
description = "A typography-first Zola theme for essays, research notes, and long-form writing."
sort_by = "date"

[extra]
subtitle = "A clean Zola theme for careful, long-form writing"
linechart = true
+++

Academia pairs book-like typography with a visual outline that follows the reader through an essay. Resize the page to see the layout collapse cleanly for smaller screens.

## Built for long-form work

The theme includes responsive sidenotes,[^13] margin notes, syntax highlighting, copy buttons for code, build-time MathML, and CSV-driven line charts.

Headings are automatically collected into the threaded outline on the left. The highlighted segment follows the portion of the article currently visible in the viewport.

## Markdown stays central

Most writing remains ordinary Markdown. Theme-specific features are exposed as small Zola shortcodes, so the source remains readable and portable.

```rust
fn main() {
    println!("Welcome to Academia on Zola");
}
```

### A smaller heading

Use page front matter to enable optional features only where they are needed.

## Mathematics and proofs

Equations are converted to native MathML after Zola builds the site.[^sidenote] Inline expressions such as {% math(display=false) %}e^{i\pi} + 1 = 0{% end %} remain TeX in the Markdown source.

{% math(display=true) %}
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
{% end %}

{% proof(title="Proof sketch") %}
For every real number {% math(display=false) %}x{% end %}, its square is nonnegative. Therefore:

{% math(display=true) %}
0 < e^{-x^2} \le 1.
{% end %}
{% end %}

## A year of reading

The chart below is rendered from CSV at build time and enhanced with pointer, touch, and keyboard interactions in the browser.

{{ linechart(src="/data/sample-reading-hours.csv", title="Monthly reading time by format", subtitle="August 2025 through July 2026", x_label="Month", y_label="Hours", date_format="month_year", source="Illustrative sample data") }}

[^13]: Numbered sidenotes display the number written in Markdown.
[^sidenote]: Named sidenotes are marked with a dagger instead of a number.
