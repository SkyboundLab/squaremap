import L from "leaflet";
import { S } from "./Squaremap.js";

export const FogOfWar = L.Layer.extend({
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create("canvas", "leaflet-fog-of-war");
        this._canvas.style.position = "absolute";
        this._canvas.style.top = "0";
        this._canvas.style.left = "0";
        this._canvas.style.pointerEvents = "none";
        this._canvas.style.zIndex = "300";

        const container = map.getContainer();
        container.appendChild(this._canvas);

        this._ctx = this._canvas.getContext("2d");

        map.on("moveend resize zoomend", this._update, this);
        map.on("viewreset", this._update, this);

        this._update();
    },

    onRemove: function (map) {
        L.DomUtil.remove(this._canvas);
        map.off("moveend resize zoomend viewreset", this._update, this);
    },

    _update: function () {
        if (!this._map || !S.playerList) return;

        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        this._canvas.style.width = size.x + "px";
        this._canvas.style.height = size.y + "px";

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // Fill entire canvas with fully black overlay
        this._ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        // Clear circles around each player (flashlight effect)
        this._ctx.globalCompositeOperation = "destination-out";

        const radius = 80; // pixels - adjust for flashlight size

        if (S.playerList.markers) {
            S.playerList.markers.forEach((marker, uuid) => {
                const player = S.playerList.players.get(uuid);
                if (!player) return;

                const pos = this._map.latLngToContainerPoint(marker.getLatLng());

                // Create radial gradient for soft edge
                const gradient = this._ctx.createRadialGradient(pos.x, pos.y, radius * 0.3, pos.x, pos.y, radius);
                gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

                this._ctx.fillStyle = gradient;
                this._ctx.beginPath();
                this._ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                this._ctx.fill();
            });
        }

        this._ctx.globalCompositeOperation = "source-over";
    },
});

export function fogOfWar() {
    return new FogOfWar();
}
