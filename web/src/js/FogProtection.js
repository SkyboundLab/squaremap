// Fog of War Protection Layer
// This script ensures the fog overlay cannot be removed or tampered with

(function () {
    "use strict";

    // Generate random intervals to make it harder to predict
    const randomInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Protection IDs for tracking
    const protectionIds = [];
    let protectionCounter = 0;

    // Obfuscated canvas class name check
    const fogClass = atob("bGVhZmxldC1mb2ctb2Ytd2Fy"); // "leaflet-fog-of-war"

    // Store original methods before they can be tampered with
    const _original = {
        remove: Element.prototype.remove,
        removeChild: Node.prototype.removeChild,
        setAttribute: Element.prototype.setAttribute,
        setProperty: CSSStyleDeclaration.prototype.setProperty,
        querySelector: Document.prototype.querySelector,
        querySelectorAll: Document.prototype.querySelectorAll,
        appendChild: Node.prototype.appendChild,
        insertBefore: Node.prototype.insertBefore,
    };

    // Create multiple hidden reference copies
    let canvasRefs = new WeakSet();
    let lastKnownCanvas = null;

    // Protection 1: Monitor DOM for fog canvas with random intervals
    function monitorFogCanvas() {
        const canvas = _original.querySelector.call(document, `canvas.${fogClass}`);
        if (canvas) {
            lastKnownCanvas = canvas;
            canvasRefs.add(canvas);

            // Ensure it's visible and properly styled
            const computedStyle = window.getComputedStyle(canvas);
            if (
                computedStyle.display === "none" ||
                computedStyle.visibility === "hidden" ||
                parseFloat(computedStyle.opacity) < 0.99 ||
                parseInt(computedStyle.zIndex) < 999
            ) {
                canvas.style.cssText = `
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    pointer-events: none !important;
                    z-index: 1000 !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                `;
            }

            // Check if canvas is attached
            if (!canvas.parentNode) {
                const mapContainer = _original.querySelector.call(document, "#map");
                if (mapContainer) {
                    _original.appendChild.call(mapContainer, canvas);
                }
            }

            // Lock attributes
            Object.defineProperty(canvas, "className", {
                value: fogClass,
                writable: false,
                configurable: false,
            });
        } else {
            // Canvas missing - attempt restore
            restoreFogCanvas();
        }
    }

    // Protection 2: Restore fog canvas from multiple sources
    function restoreFogCanvas() {
        if (window.S && window.S.fogOfWar && window.S.map) {
            try {
                if (!window.S.map.hasLayer(window.S.fogOfWar)) {
                    window.S.fogOfWar.addTo(window.S.map);
                }
                if (window.S.fogOfWar._update) {
                    window.S.fogOfWar._update();
                }
            } catch (e) {
                console.error("Failed to restore fog:", e);
            }
        }
    }

    // Protection 3: Override removal methods with randomized checks
    Element.prototype.remove = function () {
        if (this.classList && this.classList.contains(fogClass)) {
            console.warn("⚠️ Fog overlay is protected");
            setTimeout(restoreFogCanvas, randomInterval(10, 100));
            return;
        }
        if (canvasRefs.has(this)) {
            console.warn("⚠️ Protected element");
            setTimeout(restoreFogCanvas, randomInterval(10, 100));
            return;
        }
        return _original.remove.call(this);
    };

    Node.prototype.removeChild = function (child) {
        if (child && child.classList && child.classList.contains(fogClass)) {
            console.warn("⚠️ Fog overlay is protected");
            setTimeout(restoreFogCanvas, randomInterval(10, 100));
            return child;
        }
        if (canvasRefs.has(child)) {
            console.warn("⚠️ Protected element");
            setTimeout(restoreFogCanvas, randomInterval(10, 100));
            return child;
        }
        return _original.removeChild.call(this, child);
    };

    // Protection 4: Override setAttribute with detection
    Element.prototype.setAttribute = function (name, value) {
        if (this.classList && this.classList.contains(fogClass)) {
            const forbidden = ["style", "class", "id"];
            if (forbidden.includes(name.toLowerCase())) {
                console.warn("⚠️ Cannot modify protected attributes");
                return;
            }
        }
        return _original.setAttribute.call(this, name, value);
    };

    // Protection 5: Override style.setProperty
    CSSStyleDeclaration.prototype.setProperty = function (property, value, priority) {
        const element = this.parentElement || this.ownerElement;
        if (element && element.classList && element.classList.contains(fogClass)) {
            const forbidden = ["display", "visibility", "opacity", "z-index", "pointer-events"];
            if (forbidden.some((prop) => property.toLowerCase().includes(prop))) {
                console.warn("⚠️ Cannot modify protected styles");
                return;
            }
        }
        return _original.setProperty.call(this, property, value, priority);
    };

    // Protection 6: Prevent direct style manipulation
    Object.defineProperty(HTMLElement.prototype, "style", {
        get: function () {
            return this._style || {};
        },
        set: function (value) {
            if (this.classList && this.classList.contains(fogClass)) {
                console.warn("⚠️ Cannot override protected styles");
                return;
            }
            this._style = value;
        },
    });

    // Protection 7: Monitor with multiple random intervals
    const intervals = [];
    for (let i = 0; i < 5; i++) {
        const interval = setInterval(() => {
            monitorFogCanvas();
        }, randomInterval(50, 200));
        intervals.push(interval);
        protectionIds.push(interval);
    }

    // Protection 8: Additional slower monitors
    for (let i = 0; i < 3; i++) {
        const interval = setInterval(() => {
            restoreFogCanvas();
        }, randomInterval(300, 800));
        intervals.push(interval);
        protectionIds.push(interval);
    }

    // Protection 9: MutationObserver with random delays
    if (typeof MutationObserver !== "undefined") {
        const observer = new MutationObserver((mutations) => {
            setTimeout(monitorFogCanvas, randomInterval(0, 50));
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class", "id"],
        });

        // Store observer reference in protected location
        Object.defineProperty(window, "_fogObserver", {
            value: observer,
            writable: false,
            configurable: false,
        });
    }

    // Protection 10: Prevent clearing intervals
    const originalClearInterval = window.clearInterval;
    window.clearInterval = function (id) {
        if (protectionIds.includes(id)) {
            console.warn("⚠️ Cannot clear protection interval");
            return;
        }
        return originalClearInterval(id);
    };

    const originalClearTimeout = window.clearTimeout;
    window.clearTimeout = function (id) {
        if (protectionIds.includes(id)) {
            console.warn("⚠️ Cannot clear protection timeout");
            return;
        }
        return originalClearTimeout(id);
    };

    // Protection 11: Monitor console for tampering attempts
    const consolePatterns = [/fog/i, /canvas/i, /remove/i, /overlay/i, /protection/i];
    const _originalConsoleLog = console.log;
    console.log = function (...args) {
        const str = args.join(" ");
        if (consolePatterns.some((pattern) => pattern.test(str))) {
            setTimeout(monitorFogCanvas, randomInterval(10, 50));
        }
        return _originalConsoleLog.apply(console, args);
    };

    // Protection 12: Disable DevTools detection
    let devtoolsOpen = false;
    const detectDevTools = () => {
        const before = new Date();
        debugger;
        const after = new Date();
        if (after - before > 100) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                // Increase monitoring when DevTools detected
                for (let i = 0; i < 3; i++) {
                    const interval = setInterval(monitorFogCanvas, randomInterval(20, 80));
                    protectionIds.push(interval);
                }
            }
        }
    };

    setInterval(detectDevTools, randomInterval(1000, 3000));

    // Protection 13: Disable context menu on fog canvas
    document.addEventListener(
        "contextmenu",
        (e) => {
            if (e.target.classList && e.target.classList.contains(fogClass)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        },
        true,
    );

    // Protection 14: Monitor for inspect element
    document.addEventListener(
        "keydown",
        (e) => {
            // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))
            ) {
                setTimeout(monitorFogCanvas, randomInterval(100, 300));
            }
        },
        true,
    );

    // Protection 15: Freeze protection objects
    Object.freeze(_original);
    Object.freeze(canvasRefs);

    // Protection 16: Store backup in multiple locations
    window._fogProtectionBackup = {
        restore: restoreFogCanvas,
        monitor: monitorFogCanvas,
        timestamp: Date.now(),
    };
    Object.freeze(window._fogProtectionBackup);

    // Protection 17: Create hidden iframe for backup monitoring
    const createBackupMonitor = () => {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.sandbox = "allow-scripts allow-same-origin";
        document.body.appendChild(iframe);

        iframe.contentWindow.fogBackup = {
            check: () => {
                setTimeout(monitorFogCanvas, randomInterval(50, 150));
            },
        };

        setInterval(() => {
            if (iframe.contentWindow && iframe.contentWindow.fogBackup) {
                iframe.contentWindow.fogBackup.check();
            }
        }, randomInterval(400, 900));
    };

    // Wait for body to be available
    if (document.body) {
        createBackupMonitor();
    } else {
        document.addEventListener("DOMContentLoaded", createBackupMonitor);
    }

    // Initial check
    setTimeout(monitorFogCanvas, 100);

    console.log("🛡️ Advanced fog protection active");
})();
