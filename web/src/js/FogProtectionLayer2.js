// Advanced Fog Protection - Layer 2
// Obfuscated protection layer

(function () {
    "use strict";

    // Obfuscated strings
    const s = {
        fog: atob("bGVhZmxldC1mb2ctb2Ytd2Fy"),
        canvas: atob("Y2FudmFz"),
        map: atob("I21hcA=="),
        display: atob("ZGlzcGxheQ=="),
        none: atob("bm9uZQ=="),
        visible: atob("dmlzaWJsZQ=="),
        opacity: atob("b3BhY2l0eQ=="),
    };

    // Random ID generator for protection instances
    const genId = () =>
        "_" +
        Math.random().toString(36).substr(2, 9) +
        Date.now().toString(36);

    // Store protection instances in random properties
    const protectionStore = {};

    // Create 20 protection instances with random intervals
    for (let i = 0; i < 20; i++) {
        const id = genId();
        const interval = Math.floor(Math.random() * 300) + 50;

        protectionStore[id] = setInterval(() => {
            try {
                const canvas = document.querySelector(`${s.canvas}.${s.fog}`);
                if (canvas) {
                    const styles = window.getComputedStyle(canvas);

                    // Check multiple style properties
                    const violations = [];
                    if (styles[s.display] === s.none) violations.push(s.display);
                    if (styles.visibility !== s.visible) violations.push("visibility");
                    if (parseFloat(styles[s.opacity]) < 1) violations.push(s.opacity);
                    if (parseInt(styles.zIndex) < 999) violations.push("zIndex");

                    if (violations.length > 0) {
                        // Force reset
                        canvas.style[s.display] = "block";
                        canvas.style.visibility = s.visible;
                        canvas.style[s.opacity] = "1";
                        canvas.style.zIndex = "1000";
                    }

                    // Check parent
                    if (!canvas.parentNode) {
                        const map = document.querySelector(s.map);
                        if (map) map.appendChild(canvas);
                    }
                } else {
                    // Canvas missing - trigger restore
                    if (window.S && window.S.fogOfWar) {
                        if (window.S.map && !window.S.map.hasLayer(window.S.fogOfWar)) {
                            window.S.fogOfWar.addTo(window.S.map);
                        }
                    }
                }
            } catch (e) {
                // Silently fail
            }
        }, interval);
    }

    // Protect the protection store
    Object.freeze(protectionStore);

    // Hide protection store in multiple locations
    const locations = [
        "_p1",
        "_p2",
        "_p3",
        btoa("prot"),
        genId(),
        genId(),
        genId(),
    ];

    locations.forEach((loc) => {
        Object.defineProperty(window, loc, {
            value: protectionStore,
            writable: false,
            configurable: false,
            enumerable: false,
        });
    });

    // Advanced: Create Web Worker for background monitoring
    if (typeof Worker !== "undefined") {
        try {
            const workerCode = `
                self.onmessage = function(e) {
                    if (e.data === 'check') {
                        self.postMessage('restore');
                    }
                };
                setInterval(function() {
                    self.postMessage('restore');
                }, ${Math.floor(Math.random() * 500) + 300});
            `;

            const blob = new Blob([workerCode], { type: "application/javascript" });
            const worker = new Worker(URL.createObjectURL(blob));

            worker.onmessage = function (e) {
                if (e.data === "restore") {
                    const canvas = document.querySelector(`${s.canvas}.${s.fog}`);
                    if (!canvas || !canvas.parentNode) {
                        if (window.S && window.S.fogOfWar && window.S.map) {
                            window.S.fogOfWar.addTo(window.S.map);
                        }
                    }
                }
            };

            // Store worker reference
            Object.defineProperty(window, genId(), {
                value: worker,
                writable: false,
                configurable: false,
                enumerable: false,
            });
        } catch (e) {
            // Worker not supported or blocked
        }
    }

    // Advanced: Use IndexedDB for backup state
    if (window.indexedDB) {
        const dbName = btoa("fogState");
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function (e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("state")) {
                db.createObjectStore("state");
            }
        };

        request.onsuccess = function (e) {
            const db = e.target.result;

            // Periodically check state
            setInterval(() => {
                const transaction = db.transaction(["state"], "readwrite");
                const store = transaction.objectStore("state");
                const getRequest = store.get("active");

                getRequest.onsuccess = function () {
                    const canvas = document.querySelector(`${s.canvas}.${s.fog}`);
                    if (!canvas || !canvas.parentNode) {
                        if (window.S && window.S.fogOfWar) {
                            window.S.fogOfWar.addTo(window.S.map);
                        }
                    }
                };

                store.put(Date.now(), "active");
            }, Math.floor(Math.random() * 1000) + 500);
        };
    }

    // Advanced: Monitor localStorage tampering
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
        // If someone tries to disable fog via localStorage
        if (key.includes("fog") || key.includes("overlay")) {
            console.warn("⚠️ Protected storage");
            return;
        }
        return originalSetItem.call(this, key, value);
    };

    // Advanced: Prevent script injection that might disable fog
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName) {
        const element = originalCreateElement.call(document, tagName);

        if (tagName.toLowerCase() === "script" || tagName.toLowerCase() === "style") {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function (name, value) {
                // Check for malicious content
                if (typeof value === "string" && (value.includes(s.fog) || value.includes("leaflet-fog"))) {
                    console.warn("⚠️ Blocked suspicious script");
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };
        }

        return element;
    };

    console.log("🛡️ Layer 2 protection active");
})();
