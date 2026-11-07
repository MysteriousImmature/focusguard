(() => {
    'use strict';

    async function initializeBlockingToggle() {
        const anchor = document.getElementById('status-message');

        if (!anchor || document.getElementById('blocking-enabled')) {
            return;
        }

        const section = document.createElement('section');
        section.className = 'blocking-control';
        section.setAttribute('aria-label', 'Website blocking');

        section.innerHTML = `
            <label class="blocking-control-label"
                for="blocking-enabled">
                <span>Website blocking</span>

                <span class="blocking-switch">
                    <input
                        id="blocking-enabled"
                        type="checkbox"
                        role="switch"
                        aria-describedby="blocking-state blocking-help"
                        disabled
                    >
                    <span
                        class="blocking-switch-track"
                        aria-hidden="true"
                    ></span>
                </span>
            </label>

            <p id="blocking-state" role="status">
                Loading blocking state…
            </p>

            <p id="blocking-help">
                Your site list stays saved while paused.
                The focus timer runs independently.
            </p>

            <p id="blocking-error" role="alert" hidden></p>
        `;

        anchor.after(section);

        const toggle = section.querySelector('#blocking-enabled');
        const state = section.querySelector('#blocking-state');
        const error = section.querySelector('#blocking-error');

        let enabled = true;
        let revision = 0;

        function render(value) {
            enabled = value !== false;
            toggle.checked = enabled;
            section.dataset.enabled = String(enabled);

            state.textContent = enabled
                ? 'Blocking is on'
                : 'Blocking paused';
        }

        function onStorageChanged(changes, areaName) {
            if (
                areaName === 'local' &&
                changes.blockingEnabled
            ) {
                revision++;
                render(changes.blockingEnabled.newValue);
            }
        }

        async function readState() {
            let observed;
            let saved;

            do {
                observed = revision;

                saved = await browser.storage.local.get(
                    'blockingEnabled'
                );
            } while (observed !== revision);

            render(saved.blockingEnabled);
        }

        browser.storage.onChanged.addListener(onStorageChanged);

        window.addEventListener('unload', () => {
            browser.storage.onChanged.removeListener(
                onStorageChanged
            );
        }, { once: true });

        toggle.addEventListener('change', async () => {
            const desired = toggle.checked;

            // Keep the requested position while saving.
            toggle.disabled = true;
            state.textContent = 'Saving blocking setting…';
            error.hidden = true;

            try {
                await browser.storage.local.set({
                    blockingEnabled: desired
                });

                await readState();
            } catch (failure) {
                // Restore the last confirmed state on failure.
                render(enabled);

                error.textContent =
                    'Could not confirm the blocking setting. Try again.';
                error.hidden = false;

                console.error(
                    'Could not update blocking state:',
                    failure
                );
            } finally {
                toggle.disabled = false;
            }
        });

        try {
            await readState();
            toggle.disabled = false;
        } catch (failure) {
            state.textContent = 'Blocking state unavailable';

            error.textContent =
                'Reopen this page to retry loading the switch.';
            error.hidden = false;

            console.error(
                'Could not load blocking state:',
                failure
            );
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initializeBlockingToggle,
            { once: true }
        );
    } else {
        initializeBlockingToggle();
    }
})();