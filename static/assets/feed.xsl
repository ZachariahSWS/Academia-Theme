<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="atom xhtml">
  <xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="{atom:feed/@xml:lang}">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="atom:feed/atom:title"/> · Atom feed</title>
        <style>
          :root {
            color-scheme: light dark;
            --text: #111;
            --muted: #555;
            --background: #fff;
            --rule: #ddd;
            --link: #8f302a;
            --series-1: #ac3931;
            --series-2: #4f86b3;
            --series-3: #66802f;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --text: #eee;
              --muted: #bbb;
              --background: #111;
              --rule: #444;
              --link: #dc7770;
            }
          }
          * { box-sizing: border-box; }
          body {
            max-width: 52rem;
            margin: 0 auto;
            padding: 1.5rem;
            color: var(--text);
            background: var(--background);
            font: 18px/1.6 Georgia, "Times New Roman", serif;
            text-wrap: pretty;
          }
          a { color: inherit; text-decoration-color: var(--link); text-underline-offset: 0.12em; }
          h1, h2, h3 { line-height: 1.25; text-wrap: balance; }
          h1 { margin: 2rem 0 0; font-size: clamp(2.2rem, 7vw, 3.1rem); }
          h2 { margin: 2rem 0 0.35rem; font-size: 1.55rem; }
          h3 { margin: 1.5rem 0 0.35rem; font-size: 1.25rem; }
          img, svg { max-width: 100%; height: auto; }
          pre { overflow-x: auto; padding: 1rem; border: 1px solid var(--rule); }
          code { font: 0.9em/1.4 ui-monospace, "SFMono-Regular", Consolas, monospace; }
          blockquote { margin-left: 0; padding-left: 1rem; border-left: 2px solid var(--link); }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 0.35rem 0.55rem; text-align: left; }
          thead { border-bottom: 1px solid var(--text); }
          caption { padding: 0.35rem 0; color: var(--muted); text-align: left; }
          .feed_header {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid var(--rule);
          }
          .feed_header a { text-decoration: none; }
          .feed_subtitle { margin: 0.25rem 0 0; color: var(--muted); font-size: 1.15rem; }
          .feed_introduction {
            margin: 2rem 0;
            padding-left: 1rem;
            border-left: 3px solid var(--link);
          }
          .feed_introduction p { margin: 0; }
          .feed_introduction p + p { margin-top: 0.5rem; }
          .feed_url {
            overflow-wrap: anywhere;
            font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
            font-size: 0.85rem;
          }
          .feed_list { margin: 2rem 0 0; padding: 0; list-style: none; }
          .feed_list > li {
            padding: 0 0 2rem;
            border-top: 1px solid var(--rule);
          }
          .feed_byline {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem 0.6rem;
            margin: 0;
            color: var(--muted);
            font: 0.8rem/1.5 ui-monospace, "SFMono-Regular", Consolas, monospace;
          }
          .feed_byline time { display: inline; }
          .feed_author::before { content: "· "; }
          .feed_entry_content { margin-top: 1.25rem; }
          .feed_entry_content > :first-child { margin-top: 0; }
          .feed_entry_content > :last-child { margin-bottom: 0; }
          input.note_toggle_input, label.note_toggle_label { display: none; }
          .side_note, .margin_note {
            display: block;
            margin: 0.75rem 0;
            padding-left: 1rem;
            border-left: 1px solid var(--rule);
            color: var(--muted);
            font-size: 0.9rem;
          }
          .proof { margin: 1.25rem 0; }
          .proof summary, .line_chart_data summary { cursor: pointer; }
          .line_chart { margin: 2rem 0; }
          .line_chart_title, .line_chart_subtitle { display: block; }
          .line_chart_title { font-size: 1.15rem; font-weight: bold; }
          .line_chart_subtitle, .line_chart_source_note { color: var(--muted); font-size: 0.85rem; }
          .line_chart_plot svg { display: block; width: 100%; color: var(--muted); }
          .line_chart_line {
            fill: none;
            stroke: var(--series-color);
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .line_chart_series_1 { --series-color: var(--series-1); }
          .line_chart_series_2 { --series-color: var(--series-2); }
          .line_chart_series_3 { --series-color: var(--series-3); }
          .line_chart_grid { fill: none; stroke: currentcolor; stroke-opacity: 0.15; }
          .line_chart_axis_baseline { fill: none; stroke: currentcolor; stroke-opacity: 0.55; }
          .line_chart_axes text, .line_chart_axis_label { fill: currentcolor; }
          .line_chart_legend {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem 1.25rem;
            margin: 0;
            padding: 0;
            list-style: none;
            font-size: 0.85rem;
          }
          .line_chart_legend_item { display: inline-flex; align-items: center; gap: 0.4rem; }
          .line_chart_legend_item::before {
            width: 1.5rem;
            border-top: 2px solid var(--series-color);
            content: "";
          }
          .line_chart_source_note { text-align: right; }
          .line_chart_data { margin-top: 0.5rem; font-size: 0.9rem; }
          .line_chart_data_table { overflow-x: auto; }
          .line_chart_data_table table { margin-top: 0.5rem; }
          .line_chart_data_table th:not(:first-child), .line_chart_data_table td:not(:first-child) { text-align: right; }
          .line_chart_download { display: inline-block; margin-top: 0.35rem; }
          @media (max-width: 560px) { body { padding: 1rem; font-size: 16px; } }
        </style>
      </head>
      <body>
        <header class="feed_header">
          <a href="{atom:feed/atom:link[@rel='alternate']/@href}">
            <xsl:value-of select="atom:feed/atom:title"/>
          </a>
          <a href="{atom:feed/atom:link[@rel='self']/@href}">Atom feed</a>
        </header>

        <main id="main_content">
          <h1><xsl:value-of select="atom:feed/atom:title"/></h1>
          <xsl:if test="atom:feed/atom:subtitle">
            <p class="feed_subtitle"><xsl:value-of select="atom:feed/atom:subtitle"/></p>
          </xsl:if>
              <aside class="feed_introduction">
                <p>This is an Atom feed. Subscribe by copying this URL into your feed reader.</p>
                <p class="feed_url"><xsl:value-of select="atom:feed/atom:link[@rel='self']/@href"/></p>
              </aside>

              <ol class="article_list feed_list">
                <xsl:for-each select="atom:feed/atom:entry">
                  <li>
                    <h2>
                      <a class="internal_link" href="{atom:link[@rel='alternate']/@href}">
                        <xsl:value-of select="atom:title"/>
                      </a>
                    </h2>
                    <p class="feed_byline">
                      <time datetime="{atom:published}">
                        <xsl:value-of select="substring(atom:published, 1, 10)"/>
                      </time>
                      <xsl:if test="atom:author/atom:name">
                        <span class="feed_author"><xsl:value-of select="atom:author/atom:name"/></span>
                      </xsl:if>
                    </p>
                    <div class="feed_entry_content">
                      <xsl:choose>
                        <xsl:when test="atom:content">
                          <xsl:copy-of select="atom:content/xhtml:div/node()"/>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:copy-of select="atom:summary/xhtml:div/node()"/>
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </li>
                </xsl:for-each>
              </ol>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
