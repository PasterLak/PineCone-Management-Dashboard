class GameManager {
    constructor(canvas, uiLayer) {
        this.canvas = canvas;
        this.uiLayer = uiLayer;
        this.leaderboardEl = document.getElementById('leaderboard');
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = null;
        this.camera = null;
        this.lastFrameTs = performance.now();
        this.worldWrap = false;
        this.onScoreResetRequest = null;

        this.players = {};
        this.cones = {};
        this.lastTick = -1;
        this.textures = {
            right: "squirrel_right.png",
            left: "squirrel_left.png"
        };

        this.config = {
            width: 20,
            playerSize: 2.0,
            uiOffset: 1.3
        };

        // Optional: Erzwinge kein Wrap (wenn true, kommt man nicht auf die andere Seite)
        this.forceNoWrap = true;

        // Fixe Weltbreite (in Welt-Einheiten) - sorgt dafür, dass die Spielwelt
        // auf allen Geräten dieselbe Breite hat. Die Höhe wird aus dem Viewport
        // Seitenverhältnis berechnet.
        this.config.worldWidth = 20;
        this.playerColors = [
            "#d32f2f", 
            "#1976d2", 
            "#388e3c", 
            "#f57c00", 
            "#7b1fa2", 
            "#0097a7", 
            "#c2185b", 
            "#5d4037", 
            "#455a64", 
            "#afb42b"  
        ];

        this.gameHeight = 14;

        this.init();
    }

    init() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.1, 1);

        this.camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 0, -10), this.scene);
        this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        
        new BABYLON.Layer("bg", "images/background.jpg", this.scene, true);

        this.updateCameraProjection();

        this.engine.runRenderLoop(() => {
            const now = performance.now();
            const dt = Math.min(0.1, Math.max(0, (now - this.lastFrameTs) / 1000));
            this.lastFrameTs = now;

            const lerpAlpha = Math.min(1, dt * 14);

            Object.values(this.players).forEach((p) => {
                if (typeof p.targetPosX === "number") {
                    if (this.worldWrap) {
                        p.mesh.position.x = this.lerpWrappedX(p.mesh.position.x, p.targetPosX, lerpAlpha);
                    } else {
                        p.mesh.position.x = BABYLON.Scalar.Lerp(p.mesh.position.x, p.targetPosX, lerpAlpha);
                    }
                }
                if (typeof p.targetPosY === "number") {
                    p.mesh.position.y = BABYLON.Scalar.Lerp(p.mesh.position.y, p.targetPosY, lerpAlpha);
                }
                this.updateUI(p);
            });

            Object.values(this.cones).forEach((cone) => {
                if (typeof cone.targetPosX === "number") {
                    cone.position.x = BABYLON.Scalar.Lerp(cone.position.x, cone.targetPosX, lerpAlpha);
                }
                if (typeof cone.targetPosY === "number") {
                    cone.position.y = BABYLON.Scalar.Lerp(cone.position.y, cone.targetPosY, lerpAlpha);
                }
            });

            this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
            this.updateCameraProjection();
        });
    }

    updateCameraProjection() {
        const ratio = this.canvas.clientWidth / this.canvas.clientHeight;

        // Halte die Weltbreite konstant (config.worldWidth) damit das Spiel auf
        // verschiedenen Geräten gleich skaliert aussieht. Die Höhe passt sich an.
        const width = this.config.worldWidth;
        const height = width / Math.max(0.0001, ratio);

        this.config.width = width;
        this.gameHeight = height;

        this.camera.orthoLeft = -width / 2;
        this.camera.orthoRight = width / 2;
        this.camera.orthoTop = height / 2;
        this.camera.orthoBottom = -height / 2;
    }

    wrapX(x) {
        const limit = this.config.width / 2;
        const worldWidth = this.config.width;
        let nx = Number(x || 0);

        while (nx > limit) nx -= worldWidth;
        while (nx < -limit) nx += worldWidth;
        return nx;
    }

    lerpWrappedX(currentX, targetX, alpha) {
        const worldWidth = this.config.width;
        const half = worldWidth / 2;

        // Normiere beide Werte in den Bereich (-half, half]
        const norm = (v) => {
            let x = Number(v || 0);
            // Bringe x in den Bereich (-half, half]
            x = ((x + half) % worldWidth + worldWidth) % worldWidth - half;
            return x;
        };

        const from = norm(currentX);
        const to = norm(targetX);

        // Kürzeste Distanz unter Berücksichtigung von Wrap-Around
        let delta = ((to - from + half) % worldWidth + worldWidth) % worldWidth - half;

        // Interpoliere entlang der kürzesten Strecke — alpha in [0,1]
        const stepped = from + delta * alpha;

        // Gib das Ergebnis in den sichtbaren Bereich zurück
        return this.wrapX(stepped);
    }

    setMaterialTexture(material, textureName) {
        if (material.diffuseTexture) {
            material.diffuseTexture.dispose();
        }
        const texture = new BABYLON.Texture(`images/${textureName}`, this.scene);
        texture.hasAlpha = true;
        
        material.diffuseTexture = texture;
        material.emissiveTexture = texture;
        material.useAlphaFromDiffuseTexture = true;
    }

    getUniqueColorIndex() {
        const usedIndices = new Set();
        Object.values(this.players).forEach(p => usedIndices.add(p.colorIndex));
        
        for (let i = 0; i < this.playerColors.length; i++) {
            if (!usedIndices.has(i)) {
                return i;
            }
        }
        return Object.keys(this.players).length % this.playerColors.length;
    }

    addPlayer(id, name) {
        const mesh = BABYLON.MeshBuilder.CreatePlane(id, { size: this.config.playerSize }, this.scene);
        mesh.position.z = 0;
        mesh.position.y = this.camera.orthoBottom + 2.5;
        
        const mat = new BABYLON.StandardMaterial(`mat_${id}`, this.scene);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.specularColor = new BABYLON.Color3(0, 0, 0);
        mat.disableLighting = true;
        
        this.setMaterialTexture(mat, this.textures.right);
        
        mesh.material = mat;

        const labelDiv = document.createElement("div");
        labelDiv.className = "player-label";
        
        const nameSpan = document.createElement("div");
        nameSpan.className = "player-name";
        nameSpan.innerText = name;
        
        const scoreSpan = document.createElement("div");
        scoreSpan.className = "player-score";
        scoreSpan.innerText = "0";

        const colorIndex = this.getUniqueColorIndex();
        const playerColor = this.playerColors[colorIndex];
        scoreSpan.style.backgroundColor = playerColor;

        labelDiv.appendChild(nameSpan);
        labelDiv.appendChild(scoreSpan);
        this.uiLayer.appendChild(labelDiv);

        const lbEntry = document.createElement("div");
        lbEntry.className = "lb-entry";
        
        const lbName = document.createElement("div");
        lbName.className = "lb-name";
        lbName.innerText = name;
        lbName.style.color = playerColor;

        const lbScore = document.createElement("div");
        lbScore.className = "lb-score";
        lbScore.innerText = "0";

        lbEntry.appendChild(lbName);
        lbEntry.appendChild(lbScore);
        this.leaderboardEl.appendChild(lbEntry);

        lbName.title = "Klick: Score zurücksetzen";
        const resetHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            // Fallback: Hole Player-ID aus DOM falls nicht direkt verfügbar
            let pid = id;
            if (!pid && event.target && event.target.classList.contains("lb-name")) {
                pid = event.target.parentNode && event.target.parentNode.dataset && event.target.parentNode.dataset.playerId;
            }
            if (this.onScoreResetRequest) this.onScoreResetRequest(pid);
        };
        lbName.addEventListener("click", resetHandler);
        lbEntry.addEventListener("click", resetHandler);
        lbEntry.dataset.playerId = id;

        this.players[id] = {
            mesh,
            ui: labelDiv,
            scoreUI: scoreSpan,
            lbEntry: lbEntry,
            lbScore: lbScore,
            score: 0,
            direction: 'right',
            colorIndex: colorIndex,
            targetPosX: mesh.position.x,
            targetPosY: mesh.position.y
        };
    }

    removePlayer(id) {
        if (this.players[id]) {
            this.players[id].mesh.dispose();
            if (this.players[id].ui.parentNode) {
                this.players[id].ui.parentNode.removeChild(this.players[id].ui);
            }
            if (this.players[id].lbEntry.parentNode) {
                this.players[id].lbEntry.parentNode.removeChild(this.players[id].lbEntry);
            }
            delete this.players[id];
        }
    }

    removeAllPlayers() {
        Object.keys(this.players).forEach(id => this.removePlayer(id));
    }

    addCone(id) {
        const cone = BABYLON.MeshBuilder.CreatePlane(`cone_${id}`, { size: 0.8 }, this.scene);
        cone.position.z = 0;

        const cMat = new BABYLON.StandardMaterial("cMat", this.scene);
        const texture = new BABYLON.Texture("images/cone.png", this.scene);

        cMat.diffuseTexture = texture;
        cMat.diffuseTexture.hasAlpha = true;
        cMat.useAlphaFromDiffuseTexture = true;

        cMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        cMat.specularColor = new BABYLON.Color3(0, 0, 0);
        cMat.disableLighting = true;

        cone.material = cMat;
        cone.targetPosX = 0;
        cone.targetPosY = 0;

        this.cones[id] = cone;
    }

    removeCone(id) {
        const cone = this.cones[id];
        if (!cone) return;
        cone.dispose();
        delete this.cones[id];
    }

    removeAllCones() {
        Object.keys(this.cones).forEach((id) => this.removeCone(id));
    }

    applyState(serverState) {
        if (!serverState || typeof serverState.tick !== "number") {
            return;
        }

        if (typeof serverState.worldWrap === "boolean") {
            this.worldWrap = serverState.worldWrap;
        }

        if (serverState.tick < this.lastTick) {
            return;
        }
        this.lastTick = serverState.tick;

        const playersState = serverState.players || {};
        const conesState = serverState.pinecones || {};
        const activePlayerIds = new Set(Object.keys(playersState));
        const activeConeIds = new Set(Object.keys(conesState));

        for (const [id, pdata] of Object.entries(playersState)) {
            const displayName = (pdata.name || id).toString();
            let nextX = Number(pdata.x || 0);
            const nextY = Number(pdata.y || (this.camera.orthoBottom + 2.5));
            // Wenn Wrap deaktiviert (oder erzwungen ausgeschaltet), dann
            // clamp die Ziel-X-Position auf die sichtbaren Ränder, damit
            // keine weiten Teleports auftreten.
            if (this.forceNoWrap || !this.worldWrap) {
                const limit = this.config.width / 2 - this.config.playerSize / 2;
                nextX = Math.max(-limit, Math.min(limit, nextX));
            }
            let isNewPlayer = false;

            if (!this.players[id]) {
                this.addPlayer(id, displayName);
                isNewPlayer = true;
            }

            const p = this.players[id];
            p.targetPosX = nextX;
            p.targetPosY = nextY;
            // Synchronisiere Farbe, falls der Server einen colorIndex sendet.
            if (typeof pdata.colorIndex === 'number' && pdata.colorIndex !== p.colorIndex) {
                p.colorIndex = pdata.colorIndex;
                const playerColor = this.playerColors[p.colorIndex % this.playerColors.length];
                if (p.scoreUI) p.scoreUI.style.backgroundColor = playerColor;
                if (p.lbEntry) {
                    const lbNameEl = p.lbEntry.querySelector('.lb-name');
                    if (lbNameEl) lbNameEl.style.color = playerColor;
                }
            }
            if (isNewPlayer) {
                // Setze die Startposition ebenfalls innerhalb der Grenzen
                if (this.forceNoWrap || !this.worldWrap) {
                    const limit = this.config.width / 2 - this.config.playerSize / 2;
                    p.mesh.position.x = Math.max(-limit, Math.min(limit, nextX));
                } else {
                    p.mesh.position.x = nextX;
                }
                p.mesh.position.y = nextY;
            }

            const score = Number(pdata.score || 0);
            p.score = score;
            p.scoreUI.innerText = String(score);
            p.lbScore.innerText = String(score);

            const direction = pdata.direction === "left" ? "left" : "right";
            if (direction !== p.direction) {
                p.direction = direction;
                this.setMaterialTexture(p.mesh.material, this.textures[direction]);
            }

            const nameEl = p.ui.querySelector(".player-name");
            if (nameEl && nameEl.innerText !== displayName) {
                nameEl.innerText = displayName;
                const lbNameEl = p.lbEntry.querySelector(".lb-name");
                if (lbNameEl) lbNameEl.innerText = displayName;
            }
        }

        Object.keys(this.players).forEach((id) => {
            if (!activePlayerIds.has(id)) {
                this.removePlayer(id);
            }
        });

        for (const [id, cdata] of Object.entries(conesState)) {
            const nextX = Number(cdata.x || 0);
            const nextY = Number(cdata.y || 0);
            let isNewCone = false;
            if (!this.cones[id]) {
                this.addCone(id);
                isNewCone = true;
            }
            this.cones[id].targetPosX = nextX;
            this.cones[id].targetPosY = nextY;
            if (isNewCone) {
                this.cones[id].position.x = nextX;
                this.cones[id].position.y = nextY;
            }
        }

        Object.keys(this.cones).forEach((id) => {
            if (!activeConeIds.has(id)) {
                this.removeCone(id);
            }
        });

        this.updateLeaderboard();
    }

    updateUI(player) {
        const pos = BABYLON.Vector3.Project(
            player.mesh.position.add(new BABYLON.Vector3(0, this.config.uiOffset, 0)),
            BABYLON.Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.camera.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight())
        );

        player.ui.style.left = `${pos.x}px`;
        player.ui.style.top = `${pos.y}px`;
    }

    updateLeaderboard() {
        const sortedPlayers = Object.values(this.players).sort((a, b) => b.score - a.score);
        const rowHeight = 26; 
        const padding = 10;
        
        sortedPlayers.forEach((player, index) => {
            player.lbEntry.style.top = `${padding + index * rowHeight}px`;
        });
        
        this.leaderboardEl.style.height = `${padding * 2 + sortedPlayers.length * rowHeight}px`;
    }
}