class GameManager {
    constructor(canvas, uiLayer) {
        this.canvas = canvas;
        this.uiLayer = uiLayer;
        this.leaderboardEl = document.getElementById('leaderboard');
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = null;
        this.camera = null;
        
        this.players = {};
        this.cones = [];
        this.textures = {
            right: "squirrel_right.png",
            left: "squirrel_left.png"
        };
        
        this.config = {
            width: 20, 
            playerSpeed: 0.2,
            coneSpeed: 0.15,
            spawnRate: 1000,
            playerSize: 2.0,
            uiOffset: 1.3
        };

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

        this.lastSpawnTime = Date.now();
        this.gameHeight = 14; 
        
        this.init();
    }

    init() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.1, 1);

        this.camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 0, -10), this.scene);
        this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        
        const backgroundLayer = new BABYLON.Layer("bg", "images/background.jpg", this.scene, true);

        this.updateCameraProjection();

        this.engine.runRenderLoop(() => {
            this.gameLoop();
            this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
            this.updateCameraProjection();
        });
    }

    updateCameraProjection() {
        const ratio = this.canvas.clientWidth / this.canvas.clientHeight;
        const width = this.gameHeight * ratio;

        this.config.width = width;
        
        this.camera.orthoTop = this.gameHeight / 2;
        this.camera.orthoBottom = -this.gameHeight / 2;
        this.camera.orthoLeft = -width / 2;
        this.camera.orthoRight = width / 2;
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

    addPlayer(id, name, isBot) {
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

        this.players[id] = {
            mesh,
            ui: labelDiv,
            scoreUI: scoreSpan,
            lbEntry: lbEntry,
            lbScore: lbScore,
            score: 0,
            targetX: 0,
            direction: 'right',
            isBot: isBot,
            nextBotUpdate: 0,
            colorIndex: colorIndex
        };
    }

    removePlayer(id) {
        if (this.players[id]) {
            this.players[id].mesh.dispose();
            if(this.players[id].ui.parentNode) {
                this.players[id].ui.parentNode.removeChild(this.players[id].ui);
            }
            if(this.players[id].lbEntry.parentNode) {
                this.players[id].lbEntry.parentNode.removeChild(this.players[id].lbEntry);
            }
            delete this.players[id];
        }
    }

    removeAllPlayers() {
        Object.keys(this.players).forEach(id => this.removePlayer(id));
    }

    syncPlayers(devicesData) {
        const currentIds = new Set();

        if (devicesData && devicesData.devices) {
            for (const [deviceId, data] of Object.entries(devicesData.devices)) {
                let hasX = false;
                let xVal = 0;

                if (data.pins) {
                    for (const p of Object.values(data.pins)) {
                        if (p.name === "X Axis") {
                            hasX = true;
                            xVal = parseFloat(p.value);
                            break;
                        }
                    }
                }

                if (hasX) {
                    currentIds.add(deviceId);
                    
                    let displayName = deviceId;
                    if (data.description && data.description.trim().length > 0) {
                        displayName = data.description;
                    }

                    const isBot = (data.is_simulator === true || data.is_simulator === "true");

                    if (!this.players[deviceId]) {
                        this.addPlayer(deviceId, displayName, isBot);
                    } else {
                        const nameEl = this.players[deviceId].ui.querySelector(".player-name");
                        if (nameEl.innerText !== displayName) {
                            nameEl.innerText = displayName;
                            this.players[deviceId].lbEntry.querySelector(".lb-name").innerText = displayName;
                        }
                        this.players[deviceId].isBot = isBot;
                    }
                    
                    if (!this.players[deviceId].isBot) {
                        this.players[deviceId].targetX = xVal;
                    }
                }
            }
        }

        Object.keys(this.players).forEach(id => {
            if (!currentIds.has(id)) {
                this.removePlayer(id);
            }
        });
    }

    spawnCone() {
        if (Object.keys(this.players).length === 0) return;

        const topY = this.camera.orthoTop + 2;
        const margin = 1;
        const x = Math.random() * (this.config.width - margin * 2) - (this.config.width / 2 - margin);
        
        const cone = BABYLON.MeshBuilder.CreatePlane("cone", { size: 0.8 }, this.scene);
        cone.position.set(x, topY, 0);
        
        const cMat = new BABYLON.StandardMaterial("cMat", this.scene);
        const texture = new BABYLON.Texture("images/cone.png", this.scene);
        
        cMat.diffuseTexture = texture;
        cMat.diffuseTexture.hasAlpha = true;
        cMat.useAlphaFromDiffuseTexture = true;
        
        cMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        cMat.specularColor = new BABYLON.Color3(0, 0, 0);
        cMat.disableLighting = true;
        
        cone.material = cMat;
        
        this.cones.push(cone);
    }

    gameLoop() {
        const dt = this.engine.getDeltaTime();
        const now = Date.now();

        if (dt > 100 || dt <= 0) {
            this.lastSpawnTime = now; 
            return;
        }

        if (Object.keys(this.players).length > 0) {
            if (now - this.lastSpawnTime > this.config.spawnRate) {
                this.spawnCone();
                this.lastSpawnTime = now;
            }
        } else {
            this.lastSpawnTime = now;
        }

        const bottomY = this.camera.orthoBottom - 2;
        const playerY = this.camera.orthoBottom + 2.5;
        const limit = this.config.width / 2;

        Object.values(this.players).forEach(p => {
            if (p.isBot && now > p.nextBotUpdate) {
                let foundCone = false;

                if (Math.random() > 0.35 && this.cones.length > 0) {
                    let closestCone = null;
                    let minDistance = Infinity;

                    for (const cone of this.cones) {
                         if (cone.position.y > playerY) {
                            const dist = BABYLON.Vector3.Distance(p.mesh.position, cone.position);
                            if (dist < minDistance) {
                                minDistance = dist;
                                closestCone = cone;
                            }
                         }
                    }

                    if (closestCone) {
                        const dx = closestCone.position.x - p.mesh.position.x;
                        if (Math.abs(dx) > 0.5) {
                             p.targetX = dx > 0 ? 1 : -1;
                        } else {
                             p.targetX = dx; 
                        }
                        foundCone = true;
                        p.nextBotUpdate = now + 400; 
                    }
                }

                if (!foundCone) {
                    p.targetX = (Math.random() * 2) - 1; 
                    p.nextBotUpdate = now + (Math.random() * 1000 + 500);
                }
            }

            if (p.targetX !== 0) {
                if (p.targetX > 0 && p.direction !== 'right') {
                    p.direction = 'right';
                    this.setMaterialTexture(p.mesh.material, this.textures.right);
                } else if (p.targetX < 0 && p.direction !== 'left') {
                    p.direction = 'left';
                    this.setMaterialTexture(p.mesh.material, this.textures.left);
                }

                p.mesh.position.x += p.targetX * this.config.playerSpeed * (dt / 16);
                
                if (p.mesh.position.x > limit) {
                    p.mesh.position.x = -limit;
                } else if (p.mesh.position.x < -limit) {
                    p.mesh.position.x = limit;
                }
            }
            p.mesh.position.y = playerY;
            this.updateUI(p);
        });

        for (let i = this.cones.length - 1; i >= 0; i--) {
            const c = this.cones[i];
            c.position.y -= this.config.coneSpeed * (dt / 16);

            let caught = false;
            
            for (const p of Object.values(this.players)) {
                if (c.intersectsMesh(p.mesh, false)) {
                    p.score++;
                    p.scoreUI.innerText = p.score;
                    p.lbScore.innerText = p.score;
                    caught = true;
                    break; 
                }
            }

            if (caught || c.position.y < bottomY) {
                c.dispose();
                this.cones.splice(i, 1);
            }
        }
        
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