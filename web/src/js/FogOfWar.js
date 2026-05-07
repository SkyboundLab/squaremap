import L from "leaflet";
import { S } from "./Squaremap.js";

export const FogOfWar = L.Layer.extend({
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create("canvas", "leaflet-fog-of-war");
        this._canvas.style.position = "absolute";
        this._canvas.style.top = "0";
        this._canvas.style.left = "0";
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.style.pointerEvents = "none";
        this._canvas.style.zIndex = "1000";
        
        // Mark as protected to prevent removal
        this._canvas.setAttribute("data-protected", "true");
        this._isProtected = true;

        const container = map.getContainer();
        container.appendChild(this._canvas);

        this._ctx = this._canvas.getContext("2d");

        map.on("moveend resize zoomend zoom", this._update, this);
        map.on("viewreset move", this._update, this);

        // Set up watchers to prevent tampering
        this._setupProtection();

        this._update();
    },

    onRemove: function (map) {
        // Prevent removal - re-add immediately
        if (this._isProtected) {
            setTimeout(() => {
                if (this._map && !this._map.hasLayer(this)) {
                    this.addTo(this._map);
                }
            }, 0);
            return;
        }
        L.DomUtil.remove(this._canvas);
        map.off("moveend resize zoomend zoom viewreset move", this._update, this);
    },

    _setupProtection: function () {
        // Generate random intervals
        const randomInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        // Protection 1: Monitor canvas existence with random intervals
        const monitors = [];
        for (let i = 0; i < 5; i++) {
            const interval = setInterval(() => {
                if (!this._canvas || !this._canvas.parentNode) {
                    this._restoreCanvas();
                }
                // Check if canvas is hidden
                if (this._canvas) {
                    const computed = window.getComputedStyle(this._canvas);
                    if (
                        computed.display === "none" ||
                        computed.visibility === "hidden" ||
                        parseFloat(computed.opacity) < 0.99
                    ) {
                        this._canvas.style.cssText = `
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
                }
            }, randomInterval(30, 150));
            monitors.push(interval);
        }

        // Protection 2: MutationObserver to watch for canvas removal
        if (typeof MutationObserver !== "undefined") {
            this._observer = new MutationObserver((mutations) => {
                for (let mutation of mutations) {
                    if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
                        for (let node of mutation.removedNodes) {
                            if (node === this._canvas) {
                                setTimeout(() => this._restoreCanvas(), randomInterval(0, 50));
                            }
                        }
                    }
                    if (mutation.type === "attributes" && mutation.target === this._canvas) {
                        setTimeout(() => this._restoreCanvas(), randomInterval(0, 50));
                    }
                }
            });
            this._observer.observe(this._map.getContainer(), {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["style", "class", "id"],
            });

            // Additional observer for entire document
            this._docObserver = new MutationObserver(() => {
                if (!this._canvas.parentNode) {
                    setTimeout(() => this._restoreCanvas(), randomInterval(0, 50));
                }
            });
            this._docObserver.observe(document.body, { childList: true, subtree: true });
        }

        // Protection 3: Monitor layer attachment with random intervals
        for (let i = 0; i < 3; i++) {
            const interval = setInterval(() => {
                if (this._map && !this._map.hasLayer(this)) {
                    this.addTo(this._map);
                }
            }, randomInterval(100, 400));
            monitors.push(interval);
        }

        // Protection 4: Lock canvas properties
        if (this._canvas) {
            Object.defineProperty(this._canvas, "className", {
                value: "leaflet-fog-of-war",
                writable: false,
                configurable: false,
            });

            // Prevent canvas removal via replaceWith
            const originalReplaceWith = this._canvas.replaceWith;
            this._canvas.replaceWith = function () {
                console.warn("⚠️ Cannot replace protected canvas");
                return this;
            };
        }

        // Protection 5: Monitor requestAnimationFrame
        const rafMonitor = () => {
            if (this._canvas && !this._canvas.parentNode) {
                this._restoreCanvas();
            }
            if (this._map && !this._map.hasLayer(this)) {
                this.addTo(this._map);
            }
            requestAnimationFrame(rafMonitor);
        };
        requestAnimationFrame(rafMonitor);

        // Store monitor IDs
        this._monitors = monitors;

        // Protection 6: Prevent monitor clearing
        Object.freeze(this._monitors);
    },

    _restoreCanvas: function () {
        if (!this._canvas) {
            this._canvas = L.DomUtil.create("canvas", "leaflet-fog-of-war");
        }
        this._canvas.style.position = "absolute";
        this._canvas.style.top = "0";
        this._canvas.style.left = "0";
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.style.pointerEvents = "none";
        this._canvas.style.zIndex = "1000";
        this._canvas.style.display = "";
        this._canvas.style.visibility = "visible";
        this._canvas.style.opacity = "1";
        this._canvas.setAttribute("data-protected", "true");

        const container = this._map.getContainer();
        if (!this._canvas.parentNode) {
            container.appendChild(this._canvas);
        }
        this._ctx = this._canvas.getContext("2d");
        this._update();
    },

    _update: function () {
        if (!this._map || !this._canvas || !S.playerList) return;

        const size = this._map.getSize();
        
        // Set canvas resolution (internal size)
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // Fill entire canvas with fully black overlay
        this._ctx.fillStyle = "rgb(0, 0, 0)";
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        // Clear circles around each player (flashlight effect)
        this._ctx.globalCompositeOperation = "destination-out";

        // Scale radius based on zoom level
        const zoom = this._map.getZoom();
        const baseRadius = 80; // base radius at zoom level 0
        const radius = baseRadius * Math.pow(2, zoom);

        // Draw circles around player markers
        if (S.playerList.markers) {
            S.playerList.markers.forEach((marker, uuid) => {
                const player = S.playerList.players.get(uuid);
                if (!player) return;

                const pos = this._map.latLngToContainerPoint(marker.getLatLng());
                this._drawCircle(pos, radius);
            });
        }

        // Draw circles around all other markers in visible layers
        if (S.worldList && S.worldList.curWorld) {
            S.worldList.curWorld.markerLayers.forEach((layer, layerId) => {
                // Check if layer is visible on the map
                if (this._map.hasLayer(layer)) {
                    layer.eachLayer((marker) => {
                        // Get the marker position - handle different marker types
                        let latLng;
                        if (marker.getLatLng) {
                            latLng = marker.getLatLng();
                        } else if (marker.getBounds) {
                            latLng = marker.getBounds().getCenter();
                        }
                        
                        if (latLng) {
                            const pos = this._map.latLngToContainerPoint(latLng);
                            this._drawCircle(pos, radius);
                        }
                    });
                }
            });
        }

        this._ctx.globalCompositeOperation = "source-over";
    },

    _drawCircle: function (pos, radius) {
        // Create radial gradient for soft edge
        const gradient = this._ctx.createRadialGradient(pos.x, pos.y, radius * 0.3, pos.x, pos.y, radius);
        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        this._ctx.fillStyle = gradient;
        this._ctx.beginPath();
        this._ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this._ctx.fill();
    },
});

export function fogOfWar() {
    return new FogOfWar();
}
