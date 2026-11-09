# dsh-market-groups

**English** · [简体中文](README.zh.md)

A client-side enhancement layer for the DSH plugin market (`dshmarket`). The market
itself is not modified: this plugin observes the page, adds decoration, and reuses the
market's own HTTP endpoints.

## What it does

| Feature | Effect |
| --- | --- |
| Conflict highlighting | Rows of conflicting plugins get a coloured bar plus a `冲突` / `同依赖` badge. Hover one row and every plugin it conflicts with lights up. |
| Group by category | A **按类别分组** button next to *New group* sorts every ungrouped installed plugin into the market's 23 category groups. |
| Grouped by default | The installed list opens in the group view on every visit; `未分组` is renamed to `通用`. |
| First-run seeding | When the profile has no groups at all and more than 3 plugins are installed, it classifies once and reloads. |

Conflict sources come from the market's own `/dsh-market/check` payload:

- hard (`冲突`): duplicate cordis entry ids, multi-version coexistence, unsatisfied peer versions, load-order conflicts
- soft (`同依赖`): two plugins each bundle a copy of the same dependency

## Switches

| Key | Default | Meaning |
| --- | --- | --- |
| `localStorage['dshm:include-theme'] = '1'` | off | Also move `theme` plugins into the theme group (they stay in `通用` by default). |
| `localStorage['dshm:auto-classified:v1'] = '1'` | unset | Marks the one-time automatic classification as done. |
| URL `?dshm-demo=conflicts` | off | Injects fake conflicts on the first four installed plugins, to verify the highlight pipeline. |

## Install

Add the package to your DSH profile the same way as any other bundle (plugin manager or
market entry). During development a `link:` dependency pointing at this folder works too.
The host half is an empty shell; everything happens in `client/client.js`.

## When the market changes

The selectors and button texts are isolated at the top of `client/client.js`
(`ROWS_SELECTORS`, `NAME`, `TEXT_GROUPS`, `TEXT_NEW_GROUP`). If the market ships a new DOM,
only those constants need updating. When the panel mounts but no plugin row matches, the
plugin prints one console warning instead of failing silently.

## License

MIT
