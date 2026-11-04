# Static replay demo

Build a public replay-only site using the same reviewed source and original synthetic fixtures:

```sh
node scripts/build-static.mjs
```

The output is `dist/pages`, containing exactly six files:

```text
.nojekyll
index.html
public/app.mjs
public/styles.css
src/fixtures.mjs
src/review.mjs
```

The build makes asset URLs relative to the deployment path and module imports relative to the script. It works at a domain root or a project path such as `/revisiondesk/`. The source application and local Node server are not modified. The builder refuses an existing output directory containing unexpected files, rather than publishing them or silently deleting them.

The demo prominently labels authored fixture replay. Its live-mode option is disabled, programmatic mode changes remain in replay, and its static content policy blocks outgoing connections. The output contains no server, Clocked adapter, credentials, API configuration, private notes, user data, or test artifacts. Reviewer notes remain in the browser session and any exported audit is a local download. No analytics or external assets are included.

For a project on GitHub Pages, publish **only the contents of `dist/pages`** as a Pages artifact, or as the root of a dedicated Pages branch. The entry file must remain at that root. `.nojekyll` is included for branch publication. GitHub Pages is available for public repositories on GitHub Free; its static hosting does not run the local Node server. See [creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [configuring its publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The simplest publication route is a dedicated `gh-pages` branch. Build locally, then copy only the six generated files from `dist/pages` into a separate publishing worktree for that branch. Commit that actual output and push `gh-pages`; leave the source and development history on `main`. In the repository's Pages settings, choose **Deploy from a branch**, **gh-pages**, and **/(root)**. This uses GitHub's built-in Pages publication and requires no repository workflow file, package installation, Clocked key, or additional service credential. A later update repeats the build and replaces only those six files in the publishing worktree before committing and pushing. Do not copy the parent `dist` directory, source workspace, or private build records.

Do not publish the workspace directory or enable the live proxy on static hosting. A public source repository can separately contain the application, tests, setup instructions, and genuine development history. Live integration uses the local server and server-only credentials described in [the README](../README.md).

Before publishing, serve the generated output under the intended project prefix and check that the style, script, and both module imports load there. Exercise a synthetic scenario, source highlighting, completion hold, and local audit download. Check the live option remains unavailable. Passing a static test demonstrates the replay experience; it does not establish live Clocked compatibility or model accuracy. Building this directory does not publish or submit an entry.

## Local verification on 2026-11-04

All **51 automated tests passed**, including the two static-export tests. A Chrome check served the generated output under `/revisiondesk/` and passed six checks: exact source highlighting and loaded styles/modules; four-field review and audit download; missing-expiry hold; Guard-driven hold; live-mode isolation; and a 390px layout without horizontal overflow. There were no page errors. The only observed page requests were the HTML, stylesheet, app script, fixtures module, and review module, all under the project prefix. No API or external request occurred. These are local static-demo results, not a successful live provider call or a verification of a published URL.
