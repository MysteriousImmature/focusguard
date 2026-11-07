# Contributing to FocusGuard

Bug reports, feature suggestions, documentation improvements, and pull requests are welcome.

For major changes, open an issue first to discuss the proposed behavior.

## Report an Issue

Include:

- Firefox version and operating system.
- Whether the issue occurs on desktop or Android.
- Steps to reproduce it.
- Expected and actual behavior.
- Screenshots, recordings, or extension-console errors when relevant.

For blocking problems, include the exact URL, whether the site is selected, and whether the global switch is ON.

## Set Up Your Fork

1. Fork the repository on GitHub.
2. Clone your fork, replacing `YOUR_USERNAME` with your GitHub username:

   ```bash
   git clone https://github.com/YOUR_USERNAME/focusguard.git
   cd focusguard
   ```

3. Add the original repository as an upstream remote:

   ```bash
   git remote add upstream https://github.com/MysteriousImmature/focusguard.git
   ```

4. Create a branch:

   ```bash
   git checkout -b feature/short-description
   ```

## Load the Extension

### Firefox Desktop

1. Open `about:debugging`.
2. Select **This Firefox** → **Load Temporary Add-on**.
3. Select `manifest.json` from your checkout.
4. Open FocusGuard from the toolbar.

Keep the existing icons and other required assets in your checkout.

After making changes, reload the extension from `about:debugging` and reopen the popup. Temporary installations must be loaded again after restarting Firefox.

### Firefox for Android

Use Firefox's Android remote-debugging workflow and test on a physical device when possible.

The Android toolbar action opens the options page. Test that page separately from the desktop popup.

## Development Guidelines

- Keep changes focused and consistent with the existing code style.
- Use Firefox WebExtension APIs compatible with the declared minimum versions.
- Preserve existing settings when changing storage structures.
- Keep user-facing data local unless a separately discussed feature requires otherwise.
- Explain changes to permissions, storage, dependencies, or data handling.
- Keep documentation consistent with the implemented behavior.
- Add meaningful tests when introducing logic that needs automated verification.

If Node.js is installed, basic JavaScript syntax checks can be run with:

```bash
node --check background.js
node --check popup.js
node --check options.js
node --check blocking-toggle.js
```

Syntax checks do not replace browser testing.

## Testing Checklist

Before submitting changes, check the relevant behavior:

- Add, remove, and toggle predefined and custom sites.
- Verify blocking of selected domains and subdomains.
- Pause and resume blocking without losing saved sites.
- Confirm paused navigation does not add blocked attempts.
- Verify live statistics and the five-minute-per-attempt estimate.
- Test focus-session start, end, completion, duration validation, and reopening.
- Confirm blocking and the focus timer remain independent.
- Check synchronization between open popup and options views.
- Verify settings survive an extension reload.
- On Android, confirm defaults do not overwrite saved choices.

For UI changes, test the actual toolbar popup: first opening, reopening, scrolling, alignment, switch interaction, and shorter browser windows.

Opening `popup.html` in a normal tab does not validate Firefox's toolbar-popup sizing.

State which Firefox versions and devices you tested. Clearly identify simulated checks and any Android testing you could not perform.

## Submit a Pull Request

1. Commit your changes with a clear message.
2. Push your branch:

   ```bash
   git push origin feature/short-description
   ```

3. Open a pull request against the original repository's default branch.

Include:

- The problem and resulting behavior.
- Related issue numbers, if applicable.
- Tests performed and their results.
- Screenshots for visible UI changes.
- Any remaining limitations.

## License

Contributions are made under the project's existing [MIT License](LICENSE). Preserve existing copyright and license notices.