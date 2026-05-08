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
        this._canvas.style.zIndex = "400";

        const container = map.getContainer();
        container.appendChild(this._canvas);

        this._ctx = this._canvas.getContext("2d");

        map.on("moveend resize zoomend zoom", this._update, this);
        map.on("viewreset move", this._update, this);

        this._update();
    },

    onRemove: function (map) {
        L.DomUtil.remove(this._canvas);
        map.off("moveend resize zoomend zoom viewreset move", this._update, this);
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
