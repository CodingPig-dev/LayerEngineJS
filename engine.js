document.addEventListener('DOMContentLoaded', () => {
    function parseCoord(value, axisLength, elementSize) {
        if (typeof value === 'string' && value.trim().endsWith('%')) {
            const percent = parseFloat(value) / 100;
            return percent * axisLength - elementSize / 2;
        }
        return parseFloat(value);
    }
    function getSize(attr, fallback, max) {
        if (!attr) return fallback;
        if (attr.trim().endsWith('%')) {
            const percent = parseFloat(attr) / 100;
            return percent * max;
        }
        return parseFloat(attr);
    }
    function getFittingSize(baseW, baseH, maxW, maxH) {
        return {
            width: Math.min(baseW, maxW),
            height: Math.min(baseH, maxH)
        };
    }
    function replaceObjects() {
        document.querySelectorAll('object').forEach(obj => {
            const sizeAttr = obj.getAttribute('size') || '100%';
            const percent = parseFloat(sizeAttr) / 100;
            const zAttr = obj.getAttribute('z');
            const rotX = obj.getAttribute('rotation-x') || '0';
            const rotY = obj.getAttribute('rotation-y') || '0';
            const rotZ = obj.getAttribute('rotation-z') || '0';
            const modelSrc = obj.getAttribute('src');
            if (!modelSrc || !zAttr || isNaN(parseFloat(zAttr))) {
                obj.style.display = 'none';
                return;
            }
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            let ratioAttr = obj.getAttribute('ratio') || '';
            let ratioW = 1, ratioH = 1;
            if (ratioAttr) {
                let [rw, rh] = ratioAttr.split(',').map(v => parseFloat(v.trim()) / 100);
                if (!isNaN(rw) && rw > 0) ratioW = rw;
                if (!isNaN(rh) && rh > 0) ratioH = rh;
            }
            const buffer = 0.1;
            const boxHeight = screenH * percent * (1 - buffer);
            const boxWidth = screenW * percent * (1 - buffer);
            let viewerWidth = boxWidth;
            let viewerHeight = boxHeight;
            if (ratioW > 0 && ratioH > 0) {
                const ratio = ratioW / ratioH;
                if (boxWidth / boxHeight > ratio) {
                    viewerWidth = boxHeight * ratio;
                    viewerHeight = boxHeight;
                } else {
                    viewerWidth = boxWidth;
                    viewerHeight = boxWidth / ratio;
                }
            }
            viewerWidth += 30;
            viewerHeight += 30;
            let fov = 45;
            if (viewerWidth > viewerHeight) {
                fov = 2 * Math.atan((viewerWidth / viewerHeight) * Math.tan(45 * Math.PI / 360)) * (180 / Math.PI);
            }
            const z = parseFloat(zAttr);
            const cameraDistance = z * 2.5;
            let posAttr = obj.getAttribute('pos') || '50,50';
            let [posX, posY] = posAttr.split(',').map(v => parseFloat(v.trim()));
            if (isNaN(posX)) posX = 50;
            if (isNaN(posY)) posY = 50;
            const left = (screenW * (posX / 100)) - (viewerWidth / 2);
            const top = (screenH * (posY / 100)) - (viewerHeight / 2);
            const mv = document.createElement('model-viewer');
            mv.src = modelSrc;
            mv.style.position = 'absolute';
            mv.style.left = left + 'px';
            mv.style.top = top + 'px';
            mv.style.width = viewerWidth + 'px';
            mv.style.height = viewerHeight + 'px';
            mv.style.overflow = 'visible';
            mv.style.maxWidth = '100vw';
            mv.style.maxHeight = '100vh';
            mv.style.background = 'transparent';
            mv.style.clipPath = 'inset(2px)';
            mv.setAttribute('camera-orbit', `${rotY}deg ${rotX}deg ${cameraDistance}m`);
            mv.setAttribute('field-of-view', fov + 'deg');
            mv.setAttribute('disable-zoom', '');
            mv.setAttribute('disable-pan', '');
            mv.setAttribute('interaction-prompt', 'none');
            mv.setAttribute('shadow-intensity', '1');
            mv.setAttribute('ar', 'false');
            mv.setAttribute('reveal', 'auto');
            mv.setAttribute('style', mv.style.cssText + ';background:transparent;clip-path:inset(10px);');
            mv.setAttribute('poster', '');
            mv.setAttribute('disable-tap', '');
            if (obj.id) mv.id = obj.id;
            else if (obj.hasAttribute('id')) mv.id = obj.getAttribute('id');
            obj.parentNode.replaceChild(mv, obj);
        });
    }
    if (window.customElements && customElements.get('model-viewer')) {
        replaceObjects();
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            if (window.customElements && customElements.get('model-viewer')) {
                replaceObjects();
            } else {
                window.addEventListener('model-viewer-defined', replaceObjects);
            }
        });
    }
    window.move = function(modelViewer, x, y) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const width = modelViewer.offsetWidth;
        const height = modelViewer.offsetHeight;
        modelViewer.style.left = parseCoord(x, screenW, width) + 'px';
        modelViewer.style.top = parseCoord(y, screenH, height) + 'px';
    };
    window.resize = function(modelViewer, width, height) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        let w = width, h = height;
        if (typeof width === 'string' && width.trim().endsWith('%')) {
            w = (parseFloat(width) / 100) * screenW;
        }
        if (typeof height === 'string' && height.trim().endsWith('%')) {
            h = (parseFloat(height) / 100) * screenH;
        }
        modelViewer.style.width = w + 'px';
        modelViewer.style.height = h + 'px';
    };
    window.resizePercent = function(modelViewer, percent) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const minScreen = Math.min(screenW, screenH);
        const sizePx = (parseFloat(percent) / 100) * minScreen;
        modelViewer.style.width = sizePx + 'px';
        modelViewer.style.height = sizePx + 'px';
    };
    window.rotateX = function(modelViewer, value) {
        const orbit = modelViewer.getAttribute('camera-orbit') || '0deg 0deg 2.5m';
        const parts = orbit.split(' ');
        parts[1] = value + 'deg';
        modelViewer.setAttribute('camera-orbit', parts.join(' '));
    };
    window.rotateY = function(modelViewer, value) {
        const orbit = modelViewer.getAttribute('camera-orbit') || '0deg 0deg 2.5m';
        const parts = orbit.split(' ');
        parts[0] = value + 'deg';
        modelViewer.setAttribute('camera-orbit', parts.join(' '));
    };
    window.rotateZ = function(modelViewer, value) {
        const orbit = modelViewer.getAttribute('camera-orbit') || '0deg 0deg 2.5m';
        const parts = orbit.split(' ');
        parts[2] = value + 'm';
        modelViewer.setAttribute('camera-orbit', parts.join(' '));
    };
    window.scale = function(modelViewer, z) {
        const scale = 1 / parseFloat(z);
        modelViewer.style.transform = `scale(${scale})`;
    };
    window.setHDRI = function(pfad) {
        if (!pfad) return;
        document.querySelectorAll('model-viewer').forEach(mv => {
            mv.setAttribute('environment-image', pfad);
        });
    };
    window.setLight = function(x, y, z) {
        document.querySelectorAll('model-viewer').forEach(mv => {
            mv.setAttribute('shadow-softness', '1');
            mv.style.setProperty('--model-viewer-skybox-light-direction', `${x}deg ${y}deg ${z}m`);
        });
    };
    window.playAnimation = (function() {
        const animationTimers = new WeakMap();
        return function(modelViewer, animationName, durationMs) {
            if (!modelViewer || !animationName || !durationMs) return;
            function setAnim() {
                if (animationTimers.has(modelViewer)) {
                    clearTimeout(animationTimers.get(modelViewer));
                }
                modelViewer.setAttribute('animation-name', animationName);
                modelViewer.setAttribute('autoplay', 'true');
                modelViewer.setAttribute('animation-crossfade-duration', '200');
                const timer = setTimeout(() => {
                    setTimeout(() => {
                        modelViewer.setAttribute('animation-name', "Dance_Loop");
                        modelViewer.removeAttribute('autoplay');
                        modelViewer.removeAttribute('animation-crossfade-duration');
                        modelViewer.setAttribute('pose', 'rest');
                    }, 300);
                }, durationMs);
                animationTimers.set(modelViewer, timer);
            }
            if (modelViewer.loaded) {
                setAnim();
            } else {
                modelViewer.addEventListener('load', setAnim, { once: true });
            }
        };
    })();
    window.smoothMove = function(modelViewer, targetX, targetY, targetZ, steps = 10, interval = 15) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const width = modelViewer.offsetWidth;
        const height = modelViewer.offsetHeight;
        let leftPx = parseFloat(modelViewer.style.left) || 0;
        let topPx = parseFloat(modelViewer.style.top) || 0;
        let leftPercent = ((leftPx + width / 2) / screenW) * 100;
        let topPercent = ((topPx + height / 2) / screenH) * 100;
        let z = parseFloat(modelViewer.getAttribute('z')) || 1;
        let rotY = (() => {
            const orbit = modelViewer.getAttribute('camera-orbit') || '0deg 0deg 2.5m';
            return parseFloat(orbit.split(' ')[0]);
        })();
        targetX = typeof targetX === "string" && targetX.endsWith("%") ? parseFloat(targetX) : targetX;
        targetY = typeof targetY === "string" && targetY.endsWith("%") ? parseFloat(targetY) : targetY;
        targetZ = parseFloat(targetZ);
        const dx = (targetX - leftPercent) / steps;
        const dy = (targetY - topPercent) / steps;
        const dz = (targetZ - z) / steps;
        let i = 0;
        function step() {
            if (i < steps) {
                leftPercent += dx;
                topPercent += dy;
                z += dz;
                modelViewer.setAttribute('z', z);
                scale(modelViewer, z);
                move(modelViewer, leftPercent + "%", topPercent + "%");
                i++;
                setTimeout(step, interval);
            } else {
                modelViewer.setAttribute('z', targetZ);
                scale(modelViewer, targetZ);
                move(modelViewer, targetX + "%", targetY + "%");
            }
        }
        step();
    };
    window.moveZ = function(modelViewer, y) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const width = modelViewer.offsetWidth;
        const height = modelViewer.offsetHeight;
        let leftPx = parseFloat(modelViewer.style.left) || 0;
        let topPx = parseFloat(modelViewer.style.top) || 0;
        let leftPercent = ((leftPx + width / 2) / screenW) * 100;
        let topPercent = ((topPx + height / 2) / screenH) * 100;
        let z = parseFloat(modelViewer.getAttribute('z')) || 1;
        if (y > 0) {
            topPercent -= y;
            if (topPercent < 0) topPercent = 0;
            z += 0.12;
        } else {
            topPercent -= y;
            if (topPercent > 100) topPercent = 100;
            z -= 0.12;
            if (z < 0.2) z = 0.2;
        }
        smoothMove(modelViewer, leftPercent, topPercent, z);
    }
    window.moveX = function(modelViewer, y) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const width = modelViewer.offsetWidth;
        const height = modelViewer.offsetHeight;
        let leftPx = parseFloat(modelViewer.style.left) || 0;
        let topPx = parseFloat(modelViewer.style.top) || 0;
        let leftPercent = ((leftPx + width / 2) / screenW) * 100;
        let topPercent = ((topPx + height / 2) / screenH) * 100;
        let z = parseFloat(modelViewer.getAttribute('z')) || 1;
        if (y > 0) {
            leftPercent += 5;
            if (leftPercent > 100) leftPercent = 100;
            smoothMove(modelViewer, leftPercent, topPercent, z);
        }else{
            leftPercent -= 5;
            if (leftPercent < 0) leftPercent = 0;
            targetRotY = 90;
            smoothMove(modelViewer, leftPercent, topPercent, z);
        }
    }
    window.pointToMouseLoop = function(modelViewer) {
        document.addEventListener('mousemove', function(e) {
            const rect = modelViewer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = centerX - e.clientX;
            const dy = e.clientY - centerY;
            const angle = Math.atan2(dx, dy) * (180 / Math.PI);
            window.rotateY(modelViewer, angle);
        });
    };
    window.moveDirection = function(modelViewer, winkel, distance = 5) {
        const orbit = modelViewer.getAttribute('camera-orbit') || '0deg 0deg 2.5m';
        const parts = orbit.split(' ');
        const rotY = parseFloat(parts[0]) + winkel;
        const rad = rotY * Math.PI / 180;
        const dx = -Math.sin(rad) * distance;
        const dz = Math.cos(rad) * distance;
        const leftPx = parseFloat(modelViewer.style.left) || 0;
        const topPx = parseFloat(modelViewer.style.top) || 0;
        let z = parseFloat(modelViewer.getAttribute('z')) || 1;
        z -= dz * 0.024;
        modelViewer.style.left = (leftPx + dx) + "px";
        modelViewer.style.top = (topPx + dz) + "px";
        modelViewer.setAttribute('z', z);
        scale(modelViewer, z);
    }
    async function getModelPixels(modelViewer) {
        const dataUrl = await html2canvas(modelViewer).then(canvas => canvas.toDataURL());
        const img = new Image();
        img.src = dataUrl;
        await new Promise(resolve => img.onload = resolve);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const visiblePixels = [];
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                if (imgData.data[i + 3] > 0) {
                    visiblePixels.push({x, y});
                }
            }
        }
        return visiblePixels;
    }
    window.logAnimations = function(modelViewer) {
        if (!modelViewer) return;
        const animations = modelViewer.availableAnimations || [];
        if (animations.length) {
            console.log("Verfügbare Animationen:", animations);
        } else {
            modelViewer.addEventListener('load', () => {
                const anims = modelViewer.availableAnimations || [];
                console.log("Verfügbare Animationen:", anims);
            }, { once: true });
        }
    };
    window.fitModelInViewer = function(modelViewer, scaleBuffer = 0.9) {
        if (!modelViewer) return;
        modelViewer.addEventListener('load', () => {
            const boundingBox = modelViewer.getBoundingBox ? modelViewer.getBoundingBox() : null;
            if (!boundingBox) return;
            const bufferPx = 30;
            const viewerW = modelViewer.offsetWidth - bufferPx;
            const viewerH = modelViewer.offsetHeight - bufferPx;
            const modelW = boundingBox.max.x - boundingBox.min.x;
            const modelH = boundingBox.max.y - boundingBox.min.y;
            const modelD = boundingBox.max.z - boundingBox.min.z;
            const scaleW = viewerW / modelW;
            const scaleH = viewerH / modelH;
            const scaleD = viewerH / modelD;
            const scale = Math.min(scaleW, scaleH, scaleD) * scaleBuffer;
            modelViewer.style.transform = `scale(${scale})`;
            modelViewer.style.margin = bufferPx + "px";
        }, { once: true });
    };

    window.onModelClick = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('click', function handler(e) {
            callback(e);
        });
    };
    window.onModelHover = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('mouseover', e => callback('over', e));
        mv.addEventListener('mouseout', e => callback('out', e));
    };
    window.onModelDoubleClick = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('dblclick', e => callback(e));
    };
    window.onModelLoad = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('load', e => callback(e));
    };
    window.onModelAnimationEnd = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('animation-finish', e => callback(e));
    };
    window.onModelContextMenu = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('contextmenu', e => {
            e.preventDefault();
            callback(e);
        });
    };
    window.onModelFocus = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('focus', e => callback(e));
    };
    window.onModelChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            callback(mutations);
        });
        observer.observe(mv, { attributes: true, childList: false, subtree: false });
    };
    window.onModelIntersect = function(id1, id2, callback) {
        const mv1 = document.getElementById(id1);
        const mv2 = document.getElementById(id2);
        if (!mv1 || !mv2 || typeof callback !== 'function') return;
        function checkIntersection() {
            const r1 = mv1.getBoundingClientRect();
            const r2 = mv2.getBoundingClientRect();
            const intersect = !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
            if (intersect) callback();
        }
        setInterval(checkIntersection, 100);
    };
    window.onModelMove = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastPos = {left: mv.style.left, top: mv.style.top};
        setInterval(() => {
            if (mv.style.left !== lastPos.left || mv.style.top !== lastPos.top) {
                callback({left: mv.style.left, top: mv.style.top});
                lastPos = {left: mv.style.left, top: mv.style.top};
            }
        }, 100);
    };
    window.onModelResize = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastSize = {width: mv.style.width, height: mv.style.height};
        setInterval(() => {
            if (mv.style.width !== lastSize.width || mv.style.height !== lastSize.height) {
                callback({width: mv.style.width, height: mv.style.height});
                lastSize = {width: mv.style.width, height: mv.style.height};
            }
        }, 100);
    };
    window.onModelScale = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastScale = mv.style.transform;
        setInterval(() => {
            if (mv.style.transform !== lastScale) {
                callback(mv.style.transform);
                lastScale = mv.style.transform;
            }
        }, 100);
    };
    window.onModelRotate = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastOrbit = mv.getAttribute('camera-orbit');
        setInterval(() => {
            if (mv.getAttribute('camera-orbit') !== lastOrbit) {
                callback(mv.getAttribute('camera-orbit'));
                lastOrbit = mv.getAttribute('camera-orbit');
            }
        }, 100);
    };
    window.onModelAttributeChange = function(id, attribute, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'attributes' && m.attributeName === attribute) {
                    callback(mv.getAttribute(attribute));
                }
            });
        });
        observer.observe(mv, { attributes: true });
    };
    window.onModelError = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('error', e => callback(e));
    };
    window.onModelVisibilityChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastDisplay = mv.style.display;
        setInterval(() => {
            if (mv.style.display !== lastDisplay) {
                callback(mv.style.display);
                lastDisplay = mv.style.display;
            }
        }, 100);
    };
    window.onModelMaterialChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'attributes' && (m.attributeName === 'material' || m.attributeName === 'texture')) {
                    callback({material: mv.getAttribute('material'), texture: mv.getAttribute('texture')});
                }
            });
        });
        observer.observe(mv, { attributes: true });
    };
    window.onModelAnimationStart = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('animation-start', e => callback(e));
    };
    window.onModelDistance = function(id1, id2, distance, callback) {
        const mv1 = document.getElementById(id1);
        const mv2 = document.getElementById(id2);
        if (!mv1 || !mv2 || typeof callback !== 'function') return;
        setInterval(() => {
            const r1 = mv1.getBoundingClientRect();
            const r2 = mv2.getBoundingClientRect();
            const dx = (r1.left + r1.width/2) - (r2.left + r2.width/2);
            const dy = (r1.top + r1.height/2) - (r2.top + r2.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= distance) callback(dist);
        }, 100);
    };
    window.onModelSelect = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('click', e => callback('selected', e));
        mv.addEventListener('focus', e => callback('selected', e));
    };
    window.onModelUnselect = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('blur', e => callback('unselected', e));
    };
    window.onModelDragStart = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('dragstart', e => callback(e));
    };
    window.onModelDragEnd = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('dragend', e => callback(e));
    };
    window.onModelDrop = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('drop', e => callback(e));
    };
    window.onModelRaycast = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('raycast', e => callback(e));
    };
    window.onModelOpacityChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastOpacity = mv.style.opacity;
        setInterval(() => {
            if (mv.style.opacity !== lastOpacity) {
                callback(mv.style.opacity);
                lastOpacity = mv.style.opacity;
            }
        }, 100);
    };
    window.onModelGroupEvent = function(groupId, callback) {
        const group = document.querySelectorAll(`[data-group='${groupId}']`);
        group.forEach(mv => {
            mv.addEventListener('click', e => callback('click', mv, e));
            mv.addEventListener('focus', e => callback('focus', mv, e));
        });
    };
    window.onModelParentChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'childList') {
                    callback(m);
                }
            });
        });
        observer.observe(mv.parentNode, { childList: true });
    };
    window.onModelCustomEvent = function(id, eventName, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener(eventName, e => callback(e));
    };
    window.onModelIdle = function(id, timeout, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastActivity = Date.now();
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'animation-start', 'animation-finish'].forEach(evt => {
            mv.addEventListener(evt, () => lastActivity = Date.now());
        });
        setInterval(() => {
            if (Date.now() - lastActivity > timeout) {
                callback();
                lastActivity = Date.now();
            }
        }, 500);
    };
    window.onModelBoundingBoxChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function' || !mv.getBoundingClientRect) return;
        let lastBox = mv.getBoundingClientRect();
        setInterval(() => {
            const box = mv.getBoundingClientRect();
            if (box.width !== lastBox.width || box.height !== lastBox.height || box.left !== lastBox.left || box.top !== lastBox.top) {
                callback(box);
                lastBox = box;
            }
        }, 200);
    };
    window.onModelScreenshot = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        html2canvas(mv).then(canvas => {
            callback(canvas.toDataURL());
        });
    };
    window.onModelExport = function(id, format, callback) {
        // Platzhalter: Export benötigt zusätzliche Bibliotheken
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        callback('Export nicht implementiert: ' + format);
    };
    window.onModelImport = function(file, callback) {
        // Platzhalter: Import benötigt zusätzliche Bibliotheken
        if (!file || typeof callback !== 'function') return;
        callback('Import nicht implementiert');
    };
    window.onModelAnimationLoop = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('animation-loop', e => callback(e));
    };
    window.onModelPerformance = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let lastTime = performance.now();
        let frames = 0;
        setInterval(() => {
            frames++;
            const now = performance.now();
            if (now - lastTime > 1000) {
                callback({fps: frames});
                frames = 0;
                lastTime = now;
            }
        }, 16);
    };
    window.onModelARStart = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('ar-status', e => {
            if (e.detail && e.detail.status === 'session-started') callback(e);
        });
    };
    window.onModelARStop = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('ar-status', e => {
            if (e.detail && e.detail.status === 'session-ended') callback(e);
        });
    };
    window.onModelPinchZoom = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('gesture', e => {
            if (e.detail && e.detail.type === 'pinch') callback(e);
        });
    };
    window.onModelRotateGesture = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('gesture', e => {
            if (e.detail && e.detail.type === 'rotate') callback(e);
        });
    };
    window.onModelTap = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('tap', e => callback(e));
    };
    window.onModelLongPress = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        let timer;
        mv.addEventListener('mousedown', () => {
            timer = setTimeout(() => callback(), 800);
        });
        mv.addEventListener('mouseup', () => clearTimeout(timer));
        mv.addEventListener('mouseleave', () => clearTimeout(timer));
        mv.addEventListener('touchstart', () => {
            timer = setTimeout(() => callback(), 800);
        });
        mv.addEventListener('touchend', () => clearTimeout(timer));
    };
    window.onModelColorChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'attributes' && m.attributeName === 'color') {
                    callback(mv.getAttribute('color'));
                }
            });
        });
        observer.observe(mv, { attributes: true });
    };
    window.onModelShadowChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'attributes' && m.attributeName === 'shadow-intensity') {
                    callback(mv.getAttribute('shadow-intensity'));
                }
            });
        });
        observer.observe(mv, { attributes: true });
    };
    window.onModelCameraChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'attributes' && (m.attributeName === 'camera-orbit' || m.attributeName === 'field-of-view')) {
                    callback({orbit: mv.getAttribute('camera-orbit'), fov: mv.getAttribute('field-of-view')});
                }
            });
        });
        observer.observe(mv, { attributes: true });
    };
    window.onModelEnvironmentChange = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'attributes' && m.attributeName === 'environment-image') {
                    callback(mv.getAttribute('environment-image'));
                }
            });
        });
        observer.observe(mv, { attributes: true });
    };
    window.onModelReset = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        mv.addEventListener('reset', e => callback(e));
    };
    window.onModelSaveState = function(id, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function') return;
        const state = {
            left: mv.style.left,
            top: mv.style.top,
            width: mv.style.width,
            height: mv.style.height,
            scale: mv.style.transform,
            orbit: mv.getAttribute('camera-orbit'),
            fov: mv.getAttribute('field-of-view'),
            material: mv.getAttribute('material'),
            texture: mv.getAttribute('texture'),
            color: mv.getAttribute('color'),
            shadow: mv.getAttribute('shadow-intensity'),
            environment: mv.getAttribute('environment-image'),
            opacity: mv.style.opacity
        };
        callback(state);
    };
    window.onModelRestoreState = function(id, state, callback) {
        const mv = document.getElementById(id);
        if (!mv || typeof callback !== 'function' || !state) return;
        mv.style.left = state.left;
        mv.style.top = state.top;
        mv.style.width = state.width;
        mv.style.height = state.height;
        mv.style.transform = state.scale;
        mv.setAttribute('camera-orbit', state.orbit);
        mv.setAttribute('field-of-view', state.fov);
        if (state.material) mv.setAttribute('material', state.material);
        if (state.texture) mv.setAttribute('texture', state.texture);
        if (state.color) mv.setAttribute('color', state.color);
        if (state.shadow) mv.setAttribute('shadow-intensity', state.shadow);
        if (state.environment) mv.setAttribute('environment-image', state.environment);
        if (state.opacity) mv.style.opacity = state.opacity;
        callback();
    };

    window.createModel = function(options) {
        if (!options || !options.src) return null;
        const mv = document.createElement('model-viewer');
        mv.src = options.src;
        mv.id = options.id || ('model_' + Math.random().toString(36).substr(2, 9));
        mv.style.position = 'absolute';
        mv.style.left = (options.left || '50%');
        mv.style.top = (options.top || '50%');
        mv.style.width = (options.width || '300px');
        mv.style.height = (options.height || '300px');
        mv.setAttribute('camera-orbit', options.cameraOrbit || '0deg 90deg 2.5m');
        mv.setAttribute('field-of-view', options.fov || '45deg');
        mv.setAttribute('disable-zoom', '');
        mv.setAttribute('disable-pan', '');
        mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('shadow-intensity', '1');
        mv.setAttribute('ar', 'false');
        mv.setAttribute('reveal', 'auto');
        mv.setAttribute('poster', '');
        mv.setAttribute('disable-tap', '');
        if (options.material) mv.setAttribute('material', options.material);
        if (options.color) mv.setAttribute('color', options.color);
        if (options.texture) mv.setAttribute('texture', options.texture);
        document.body.appendChild(mv);
        return mv;
    };

    window.centerModel = function(id) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv) return;
        mv.style.left = ((window.innerWidth - mv.offsetWidth) / 2) + 'px';
        mv.style.top = ((window.innerHeight - mv.offsetHeight) / 2) + 'px';
    };
    window.fullscreenModel = function(id) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv) return;
        mv.style.left = '0px';
        mv.style.top = '0px';
        mv.style.width = window.innerWidth + 'px';
        mv.style.height = window.innerHeight + 'px';
    };

    window.playDefaultAnimation = function(id) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv) return;
        const anims = mv.availableAnimations || [];
        if (anims.length) {
            playAnimation(mv, anims[0], 1000);
        }
    };
    window.playRandomAnimation = function(id) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv) return;
        const anims = mv.availableAnimations || [];
        if (anims.length) {
            const anim = anims[Math.floor(Math.random() * anims.length)];
            playAnimation(mv, anim, 1000);
        }
    };

    window.saveModelState = function(id) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv) return null;
        return {
            left: mv.style.left,
            top: mv.style.top,
            width: mv.style.width,
            height: mv.style.height,
            scale: mv.style.transform,
            orbit: mv.getAttribute('camera-orbit'),
            fov: mv.getAttribute('field-of-view'),
            material: mv.getAttribute('material'),
            texture: mv.getAttribute('texture'),
            color: mv.getAttribute('color'),
            shadow: mv.getAttribute('shadow-intensity'),
            environment: mv.getAttribute('environment-image'),
            opacity: mv.style.opacity
        };
    };
    window.restoreModelState = function(id, state) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv || !state) return;
        mv.style.left = state.left;
        mv.style.top = state.top;
        mv.style.width = state.width;
        mv.style.height = state.height;
        mv.style.transform = state.scale;
        mv.setAttribute('camera-orbit', state.orbit);
        mv.setAttribute('field-of-view', state.fov);
        if (state.material) mv.setAttribute('material', state.material);
        if (state.texture) mv.setAttribute('texture', state.texture);
        if (state.color) mv.setAttribute('color', state.color);
        if (state.shadow) mv.setAttribute('shadow-intensity', state.shadow);
        if (state.environment) mv.setAttribute('environment-image', state.environment);
        if (state.opacity) mv.style.opacity = state.opacity;
    };

    window.moveModels = function(ids, x, y) {
        ids.forEach(id => {
            const mv = typeof id === 'string' ? document.getElementById(id) : id;
            if (mv) move(mv, x, y);
        });
    };
    window.scaleModels = function(ids, z) {
        ids.forEach(id => {
            const mv = typeof id === 'string' ? document.getElementById(id) : id;
            if (mv) scale(mv, z);
        });
    };

    window.setModelColor = function(id, color) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (mv) mv.setAttribute('color', color);
    };
    window.setModelMaterial = function(id, material) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (mv) mv.setAttribute('material', material);
    };

    window.autoResizeModel = function(id) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv) return;
        function resize() {
            mv.style.width = window.innerWidth + 'px';
            mv.style.height = window.innerHeight + 'px';
        }
        window.addEventListener('resize', resize);
        resize();
    };

    window.queueAnimations = function(id, animations) {
        const mv = typeof id === 'string' ? document.getElementById(id) : id;
        if (!mv || !Array.isArray(animations) || !animations.length) return;
        let i = 0;
        function next() {
            if (i < animations.length) {
                playAnimation(mv, animations[i], 1000);
                i++;
                setTimeout(next, 1100);
            }
        }
        next();
    };
});
