// Backup - createProductTable function (Mesa del Centro)
// Date: February 12, 2026

function createProductTable(x, z) {
    const table = new THREE.Group();

    // Table surface (wooden)
    const tableGeometry = new THREE.BoxGeometry(15, 1, 8);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const tableSurface = new THREE.Mesh(tableGeometry, tableMaterial);
    tableSurface.position.y = 3;
    tableSurface.castShadow = true;
    tableSurface.receiveShadow = true;
    table.add(tableSurface);

    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.8, 3, 0.8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    const positions = [
        [-6.5, 1.5, 3.5],
        [6.5, 1.5, 3.5],
        [-6.5, 1.5, -3.5],
        [6.5, 1.5, -3.5]
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        table.add(leg);
    });

    // Create products with data
    const productPositions = [
        { x: -5, y: 4.5, z: 2, size: [2, 2, 2] },
        { x: -2, y: 4.75, z: 2, size: [1.5, 2.5, 1.5] },
        { x: 1, y: 4.25, z: 2, size: [2.5, 1.5, 2] },
        { x: 4.5, y: 4.4, z: 2, size: [1.8, 1.8, 1.8] },
        { x: -4, y: 4.1, z: -1.5, size: [2, 1.2, 2] },
        { x: -1, y: 4.5, z: -1.5, size: [1.5, 2, 1.5] },
        { x: 2, y: 4.25, z: -1.5, size: [2.2, 1.5, 1.8] },
        { x: 5, y: 4.3, z: -1.5, size: [1.6, 1.6, 1.6] }
    ];

    const productColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff8844, 0xff44ff, 0x44ffff, 0xff88cc];

    productPositions.forEach((pos, index) => {
        const productGeo = new THREE.BoxGeometry(...pos.size);
        const productMat = new THREE.MeshStandardMaterial({
            color: productColors[index],
            emissive: productColors[index],
            emissiveIntensity: 0.2
        });
        const product = new THREE.Mesh(productGeo, productMat);
        product.position.set(pos.x, pos.y, pos.z);
        product.castShadow = true;
        product.userData = { isProduct: true, productIndex: index };
        clickableProducts.push(product);
        table.add(product);
    });

    // Sign on front of table
    const signGeo = new THREE.BoxGeometry(8, 1.5, 0.2);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2, 4.1);
    sign.castShadow = true;
    table.add(sign);

    // Sign text (using canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PRODUCTOS EN VENTA', 256, 80);

    const textTexture = new THREE.CanvasTexture(canvas);
    const textGeo = new THREE.PlaneGeometry(7.5, 1.2);
    const textMat = new THREE.MeshStandardMaterial({ map: textTexture });
    const textPlane = new THREE.Mesh(textGeo, textMat);
    textPlane.position.set(0, 2, 4.2);
    table.add(textPlane);

    // Baseball cap/hat (gray) on top of the product table
    const capGroup = new THREE.Group();

    // Cap crown (semi-sphere)
    const crownGeometry = new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,  // Gray color
        roughness: 0.8,
        metalness: 0.1
    });
    const crown = new THREE.Mesh(crownGeometry, capMaterial);
    crown.position.y = 4.5;  // On top of the table surface
    crown.castShadow = true;
    crown.receiveShadow = true;
    capGroup.add(crown);

    // Cap visor/brim
    const visorGeometry = new THREE.BoxGeometry(2.4, 0.3, 1.5);
    const brim = new THREE.Mesh(visorGeometry, capMaterial);
    brim.position.set(0, 4.35, 1.2);
    brim.castShadow = true;
    brim.receiveShadow = true;
    capGroup.add(brim);

    table.add(capGroup);

    table.position.set(x, 0, z);
    scene.add(table);
    return table;
}
