# System Shade

A macOS Safari web extension that follows system appearance. In dark mode it uses the bundled Dark Reader engine to darken light websites. In light mode it removes its generated theme. Existing dark pages are left unchanged by default.

## Use on this Mac

1. Open `build/System Shade.app` after building. A portable copy is also available as `build/System Shade.zip`; unzip it into Applications. The app provides a button to open Safari’s extension settings.
2. For this locally signed development build, enable Safari > Settings > Advanced > Show features for web developers. In Safari > Settings > Developer, enable **Allow unsigned extensions**. Older Safari versions place this option in the Develop menu. Safari may require it again after restarting. See [Apple’s instructions for running local extensions](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension).
3. In Safari > Settings > Extensions, enable **System Shade**, then grant website access. Choose all websites to use it across the web.
4. Reload open pages. Set macOS > System Settings > Appearance to Dark or Auto. The extension also follows appearance changes while pages are open.
5. Click System Shade in Safari’s toolbar for the current website’s status and preference. **Automatic** checks for an active dark theme. **Leave website unchanged** excludes the hostname. **Always darken in system dark mode** overrides detection, while still leaving light mode unchanged.

The development app is signed locally, not notarized or distributed through the App Store. Distribution requires your Apple developer signing identity. Browser-protected pages, Safari’s start page, PDFs, and pages without extension access cannot be modified.

## Build

Requires Node.js 20 or later, npm, and Xcode with its command-line tools selected.

```sh
npm ci
npm run build
npm run safari:build
open 'build/System Shade.app'
```

The checked-in Xcode project references `extension/` directly. Run `npm run build` before building in Xcode to create the bundled dependency. The command-line build uses a temporary derived-data folder to avoid signing failures from synced Documents-folder metadata. The result is copied to `build/System Shade.app`, its file metadata is cleared, and its signature is verified. A zip archive preserves the app for transfer.

To generate a fresh wrapper, run `npm run safari:project`. Back up any wrapper customizations before regenerating. For distribution, open `safari/System Shade/System Shade.xcodeproj`, select your development team for both targets, and archive using Xcode.

## Verify

```sh
npx playwright install webkit
npm run build
npm test
```

WebKit tests exercise actual Dark Reader rendering, system appearance changes, preservation of a native media-query theme, restoration of original colors, late native theme changes, per-site exclusion, and forced darkening. Extension storage and messaging are simulated in these tests. Safari’s permission UI and extension installation require a live Safari check.

For live verification, visit a light website and a website with an active native dark theme, switch macOS appearance between Light and Dark, then change each site’s toolbar preference. Confirm that images remain natural and that native dark pages stay unchanged.

## Detection and limits

The extension waits 160 ms for native theme listeners to settle, then samples nine visible page surfaces. It treats a page as dark if at least two-thirds of the samples have a dark background. It rechecks at load, after 1.5 seconds, when system appearance changes, and when common root/body theme attributes change.

This detects an active dark appearance, not whether a site has a dark-theme option hidden in its settings. There is no standard website API for that distinction. Unusual layouts, background images, themes switched through other attributes, closed shadow roots, canvas content, and stylesheets restricted by CORS can limit detection or rendering. Use the site preference when automatic detection needs correction. A short light flash can occur while the page’s own theme is assessed.

## Privacy and dependencies

Site preferences are stored in Safari’s local extension storage using exact hostnames. There is no analytics, remote configuration, or third-party service. Dark Reader may fetch the current website’s stylesheets and assets to generate its theme, using normal browser CORS rules without credentials. Images are not globally inverted.

The rendering engine is Dark Reader 4.9.133, pinned in `package-lock.json`, bundled locally during the build, and licensed under MIT. Its license is included in the extension bundle. This is an independent wrapper, not the official Dark Reader Safari extension.

References: [Apple’s Safari extension packaging documentation](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari), [Dark Reader’s API](https://github.com/darkreader/darkreader#using-dark-reader-on-a-website).
