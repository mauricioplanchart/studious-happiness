    // Add folded shirt/playera on top of the table (flat, store style)
    const shirtGroup = new THREE.Group();

    // Procedural fabric texture for more realistic cloth look
    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.width = 256;
    fabricCanvas.height = 256;
    const fabricCtx = fabricCanvas.getContext('2d');

    fabricCtx.fillStyle = '#c61f2a';
    fabricCtx.fillRect(0, 0, 256, 256);

    fabricCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    fabricCtx.lineWidth = 1;
    for (let i = 0; i < 256; i += 8) {
        fabricCtx.beginPath();
        fabricCtx.moveTo(i, 0);
        fabricCtx.lineTo(i, 256);
        fabricCtx.stroke();

        fabricCtx.beginPath();
        fabricCtx.moveTo(0, i);
        fabricCtx.lineTo(256, i);
        fabricCtx.stroke();
    }

    for (let i = 0; i < 1200; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const alpha = 0.05 + Math.random() * 0.12;
        fabricCtx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        fabricCtx.fillRect(x, y, 2, 2);
    }

    const fabricTexture = new THREE.CanvasTexture(fabricCanvas);
    fabricTexture.wrapS = THREE.RepeatWrapping;
    fabricTexture.wrapT = THREE.RepeatWrapping;
    fabricTexture.repeat.set(2, 2);

    const shirtMaterial = new THREE.MeshStandardMaterial({
        color: 0xd72631,
        map: fabricTexture,
        roughness: 0.93,
        metalness: 0.0
    });
    const shirtShadowMaterial = new THREE.MeshStandardMaterial({
        color: 0xa81923,
        map: fabricTexture,
        roughness: 0.96,
        metalness: 0.0
    });

    // Base folded body
    const baseGeometry = new THREE.BoxGeometry(3.8, 0.09, 2.6);
    const shirtBase = new THREE.Mesh(baseGeometry, shirtMaterial);
    shirtBase.castShadow = true;
    shirtBase.receiveShadow = true;
    shirtGroup.add(shirtBase);

    // Sleeves folded inward
    const sleeveGeometry = new THREE.BoxGeometry(1.1, 0.08, 1.0);
    const leftSleeve = new THREE.Mesh(sleeveGeometry, shirtMaterial);
    leftSleeve.position.set(-1.14, 0.03, 0.47);
    leftSleeve.rotation.y = 0.48;
    leftSleeve.castShadow = true;
    shirtGroup.add(leftSleeve);

    const rightSleeve = new THREE.Mesh(sleeveGeometry, shirtMaterial);
    rightSleeve.position.set(1.14, 0.03, 0.47);
    rightSleeve.rotation.y = -0.48;
    rightSleeve.castShadow = true;
    shirtGroup.add(rightSleeve);

    // Side folded panels
    const sideFoldGeometry = new THREE.BoxGeometry(0.66, 0.07, 2.25);
    const leftFold = new THREE.Mesh(sideFoldGeometry, shirtShadowMaterial);
    leftFold.position.set(-1.2, 0.08, 0.04);
    leftFold.castShadow = true;
    shirtGroup.add(leftFold);

    const rightFold = new THREE.Mesh(sideFoldGeometry, shirtShadowMaterial);
    rightFold.position.set(1.2, 0.08, 0.04);
    rightFold.castShadow = true;
    shirtGroup.add(rightFold);

    // Bottom fold layer
    const bottomFoldGeometry = new THREE.BoxGeometry(2.92, 0.08, 0.92);
    const bottomFold = new THREE.Mesh(bottomFoldGeometry, shirtShadowMaterial);
    bottomFold.position.set(0, 0.12, -0.78);
    bottomFold.castShadow = true;
    shirtGroup.add(bottomFold);

    // Central soft fold band
    const centerFoldGeometry = new THREE.BoxGeometry(3.15, 0.05, 0.3);
    const centerFold = new THREE.Mesh(centerFoldGeometry, shirtShadowMaterial);
    centerFold.position.set(0, 0.13, -0.08);
    shirtGroup.add(centerFold);

    // Collar / neck area
    const collarMaterial = new THREE.MeshStandardMaterial({
        color: 0xf2f2f2,
        roughness: 0.82,
        metalness: 0.0
    });

    const neckOpeningGeometry = new THREE.TorusGeometry(0.4, 0.05, 12, 24);
    const neckOpening = new THREE.Mesh(neckOpeningGeometry, collarMaterial);
    neckOpening.position.set(0, 0.1, 0.95);
    neckOpening.rotation.x = Math.PI / 2;
    neckOpening.castShadow = true;
    shirtGroup.add(neckOpening);

    const flapGeometry = new THREE.BoxGeometry(0.55, 0.035, 0.42);
    const leftFlap = new THREE.Mesh(flapGeometry, collarMaterial);
    leftFlap.position.set(-0.22, 0.11, 0.67);
    leftFlap.rotation.y = 0.42;
    shirtGroup.add(leftFlap);

    const rightFlap = new THREE.Mesh(flapGeometry, collarMaterial);
    rightFlap.position.set(0.22, 0.11, 0.67);
    rightFlap.rotation.y = -0.42;
    shirtGroup.add(rightFlap);

    // Placket and buttons
    const placketGeometry = new THREE.BoxGeometry(0.22, 0.03, 0.74);
    const placket = new THREE.Mesh(placketGeometry, shirtShadowMaterial);
    placket.position.set(0, 0.11, 0.28);
    shirtGroup.add(placket);

    const buttonGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5, metalness: 0.0 });
    [0.52, 0.34, 0.16].forEach((zPos) => {
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(0, 0.12, zPos);
        button.rotation.x = Math.PI / 2;
        shirtGroup.add(button);
    });

    // Small stitched logo patch
    const logoGeometry = new THREE.BoxGeometry(0.65, 0.03, 0.62);
    const logoMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.75,
        metalness: 0.0
    });
    const logoPatch = new THREE.Mesh(logoGeometry, logoMaterial);
    logoPatch.position.set(0.8, 0.1, 0.14);
    logoPatch.castShadow = true;
    shirtGroup.add(logoPatch);

    // Visible seam strips
    const seamGeometry = new THREE.BoxGeometry(0.06, 0.02, 2.2);
    const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x8f111b, roughness: 0.98, metalness: 0.0 });
    const leftSeam = new THREE.Mesh(seamGeometry, seamMaterial);
    leftSeam.position.set(-1.5, 0.1, -0.04);
    shirtGroup.add(leftSeam);

    const rightSeam = new THREE.Mesh(seamGeometry, seamMaterial);
    rightSeam.position.set(1.5, 0.1, -0.04);
    shirtGroup.add(rightSeam);

    // Position shirt centered and flat on top of table surface
    shirtGroup.position.set(0, 3.56, 0.45);
    shirtGroup.rotation.y = 0.08;
    table.add(shirtGroup);
    table.add(shirtGroup);
