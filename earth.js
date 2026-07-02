/* =================================================================
   earth.js  —  3D Earth globe for the Global Offices section

   Coordinate system (matches Three.js SphereGeometry UV exactly):
     phi   = (90 - lat) * PI/180        — polar angle, 0 at north pole
     theta = (lon + 180) * PI/180       — azimuth, 0 at lon=-180 (left seam)
     X = -sin(phi) * cos(theta)
     Y =  cos(phi)
     Z =  sin(phi) * sin(theta)

   At rotY=0 the globe faces +Z (camera). A city faces the camera when
   its Z component is maximised, i.e. sin(theta)=1, theta=PI/2, lon=-90.
   To bring city at longitude L to face camera:
     targetRotY = PI/2 - (L+180)*PI/180  =  -PI/2 - L*PI/180
================================================================= */

function latLonToVec3(lat, lon, R) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -R * Math.sin(phi) * Math.cos(theta),
     R * Math.cos(phi),
     R * Math.sin(phi) * Math.sin(theta)
  );
}

function buildArcCurve(v1, v2, R, bulge) {
  const mid = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(R + bulge);
  return new THREE.QuadraticBezierCurve3(v1, mid, v2);
}

/* ── Markers ─────────────────────────────────────────────────── */
function createMarkers(earthGroup, R) {
  const dotGeo  = new THREE.SphereGeometry(0.028, 12, 12);
  const dotMat  = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
  const ringGeo = new THREE.TorusGeometry(0.052, 0.007, 6, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.7 });
  const markerMeshes = [];

  OFFICES.forEach(office => {
    const pos = latLonToVec3(office.lat, office.lon, R);

    const dot = new THREE.Mesh(dotGeo, dotMat.clone());
    dot.position.copy(pos);
    dot.userData.office   = office;
    dot.userData.isMarker = true;
    earthGroup.add(dot);
    markerMeshes.push(dot);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.002, 0.14, 4),
      new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.45 })
    );
    beacon.position.copy(pos);
    beacon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
    beacon.translateY(0.07);
    earthGroup.add(beacon);

    const ring = new THREE.Mesh(ringGeo, ringMat.clone());
    ring.position.copy(pos);
    ring.userData.isMarkerRing = true;
    earthGroup.add(ring);
    dot.userData.ring = ring;
    office._dot = dot;
  });

  return markerMeshes;
}

/* ── Arc particles ───────────────────────────────────────────── */
function createArcParticles(earthGroup, R) {
  const particleGeo = new THREE.SphereGeometry(0.014, 6, 6);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
  const arcParticles = [];

  ARC_PAIRS.forEach(pair => {
    const offA = OFFICES.find(o => o.id === pair[0]);
    const offB = OFFICES.find(o => o.id === pair[1]);
    if (!offA || !offB) return;

    const vA    = latLonToVec3(offA.lat, offA.lon, R);
    const vB    = latLonToVec3(offB.lat, offB.lon, R);
    const curve = buildArcCurve(vA, vB, R, R * 0.4);

    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
    earthGroup.add(new THREE.Line(lineGeo,
      new THREE.LineBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.15 })
    ));

    [0, 0.5].forEach(offset => {
      const mesh = new THREE.Mesh(particleGeo, particleMat.clone());
      earthGroup.add(mesh);
      arcParticles.push({ mesh, curve, t: offset, speed: 0.0018 + Math.random() * 0.001 });
    });
  });

  return arcParticles;
}

/* ── Main init ───────────────────────────────────────────────── */
function initEarth(canvasEl) {
  const R = 1.4;

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvasEl.clientWidth / canvasEl.clientHeight, 0.1, 100);
  camera.position.z = 4.2;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(5, 3, 5);
  scene.add(sun);
  const rimLight = new THREE.PointLight(0x00E5FF, 1.6, 20);
  rimLight.position.set(-4, -2, -3);
  scene.add(rimLight);

  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const loader  = new THREE.TextureLoader();
  const dayTex  = loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');

  earthGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshPhongMaterial({ map: dayTex, specular: new THREE.Color(0x111111), shininess: 8 })
  ));

  const cloudTex = loader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
  const cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.02, 48, 48),
    new THREE.MeshLambertMaterial({ map: cloudTex, transparent: true, opacity: 0.3, depthWrite: false })
  );
  earthGroup.add(cloudMesh);

  earthGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.18, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.055, side: THREE.BackSide })
  ));

  earthGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.34, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x003355, transparent: true, opacity: 0.022, side: THREE.BackSide })
  ));

  const markerMeshes = createMarkers(earthGroup, R + 0.01);
  const arcParticles = createArcParticles(earthGroup, R + 0.01);

  /* ── Rotation state ──────────────────────────────────────────
     rotY and rotX are scalar angles rebuilt into a quaternion
     every frame. This guarantees north stays up — no roll ever.

     Initial view: India/Middle East facing (lon≈80°)
     targetRotY for lon=80: -PI/2 - 80*PI/180 = -2.966
     We negate to get a pleasant starting view showing the region.
  ─────────────────────────────────────────────────────────────── */
  let rotY = 1.2;   // shows Atlantic/Europe on load
  let rotX = 0.0;

  function buildQuat(ry, rx) {
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rx);
    return qY.multiply(qX);
  }

  earthGroup.quaternion.copy(buildQuat(rotY, rotX));

  let targetRotY    = null;
  let targetRotX    = null;
  let isDragging    = false;
  let prevX = 0, prevY = 0;
  let dragVelX = 0, dragVelY = 0;
  let autoSpin      = true;
  let selectedOffice = null;

  /* ── fly-to ──────────────────────────────────────────────────
     Derived from latLonToVec3:
       theta = (lon + 180) * PI/180
       Z = sin(phi) * sin(theta)
     City faces camera (+Z) when sin(theta) = 1, theta = PI/2
     → lon = -90°. To bring city at lon L to face camera:
       rotY = PI/2 - theta = PI/2 - (lon+180)*PI/180
            = -PI/2 - lon*PI/180

     For X: positive lat is north (top), so rotX = -latRad
     tilts the globe so the city moves to vertical centre.
  ─────────────────────────────────────────────────────────────── */
  function flyToOffice(office) {
    if (!office) return;
    isDragging = false;
    dragVelX = dragVelY = 0;
    autoSpin  = false;

    const lonRad = office.lon * (Math.PI / 180);
    const latRad = office.lat * (Math.PI / 180);

    let ty = -Math.PI / 2 - lonRad;
    // shortest path — normalise against current rotY
    ty -= Math.round((ty - rotY) / (Math.PI * 2)) * (Math.PI * 2);
    targetRotY = ty;
    targetRotX = -latRad;

    selectedOffice = office;
    cityLabelText.textContent = office.city;
    cityLabel.style.display = 'flex';

    if (office._dot) {
      office._dot.userData.selected = true;
      if (office._dot.userData.ring) office._dot.userData.ring.userData.selected = true;
      markerMeshes.forEach(m => {
        if (m !== office._dot) {
          m.userData.selected = false;
          if (m.userData.ring) m.userData.ring.userData.selected = false;
        }
      });
    }
  }

  /* ── Drag ────────────────────────────────────────────────────── */
  function onDown(e) {
    isDragging = true;
    prevX = e.touches ? e.touches[0].clientX : e.clientX;
    prevY = e.touches ? e.touches[0].clientY : e.clientY;
    dragVelX = dragVelY = 0;
    targetRotY = targetRotX = null;
    cityLabel.style.display = 'none';
    selectedOffice = null;
    markerMeshes.forEach(m => {
      m.userData.selected = false;
      if (m.userData.ring) m.userData.ring.userData.selected = false;
    });
    autoSpin = false;
  }

  function onMove(e) {
    if (!isDragging) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    dragVelX = (cx - prevX) * 0.005;
    dragVelY = (cy - prevY) * 0.005;
    prevX = cx; prevY = cy;
    rotY += dragVelX;
    rotX -= dragVelY;   // subtract: drag up → globe rotates up (natural)
    rotX = Math.max(-1.2, Math.min(1.2, rotX));
  }

  function onUp() {
    isDragging = false;
    autoSpin = true;
  }

  canvasEl.addEventListener('mousedown',  onDown);
  canvasEl.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup',  onUp);
  window.addEventListener('touchend', onUp);

  /* ── Raycaster ───────────────────────────────────────────────── */
  const raycaster    = new THREE.Raycaster();
  const mouse2D      = new THREE.Vector2();
  let hoveredMarker  = null;
  const earthTooltip = document.getElementById('earth-tooltip');

  canvasEl.addEventListener('mousemove', e => {
    const rect = canvasEl.getBoundingClientRect();
    mouse2D.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse2D.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  });

  canvasEl.addEventListener('click', () => {
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(markerMeshes);
    if (hits.length > 0) {
      const office = hits[0].object.userData.office;
      highlightOfficeCard(office.id);
      flyToOffice(office);
    }
  });

  /* ── City label pin ──────────────────────────────────────────── */
  const cityLabel = document.createElement('div');
  cityLabel.id = 'globe-city-label';
  cityLabel.style.cssText = `
    position: absolute;
    pointer-events: none;
    display: none;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -100%);
    z-index: 20;
  `;
  cityLabel.innerHTML = `
    <div style="
      background: rgba(5,8,22,0.92);
      border: 1.5px solid #00E5FF;
      border-radius: 8px;
      padding: 5px 12px;
      color: #fff;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 0 14px rgba(0,229,255,0.4);
      letter-spacing: 0.5px;
    " id="globe-city-label-text"></div>
    <div style="
      width: 2px;
      height: 18px;
      background: linear-gradient(to bottom, #00E5FF, transparent);
      margin-top: 0;
    "></div>
    <div style="
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00E5FF;
      box-shadow: 0 0 8px #00E5FF;
      margin-top: -1px;
    "></div>
  `;
  canvasEl.parentElement.style.position = 'relative';
  canvasEl.parentElement.appendChild(cityLabel);
  const cityLabelText = cityLabel.querySelector('#globe-city-label-text');

  function projectToScreen(worldPos) {
    const v = worldPos.clone().project(camera);
    return {
      x: ( v.x + 1) / 2 * canvasEl.clientWidth,
      y: (-v.y + 1) / 2 * canvasEl.clientHeight,
      behind: v.z > 1,
    };
  }

  /* ── Render loop ─────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let raf = null;

  function loop() {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    if (targetRotY !== null) {
      rotY += (targetRotY - rotY) * 0.06;
      rotX += (targetRotX - rotX) * 0.06;
      if (Math.abs(targetRotY - rotY) < 0.001 && Math.abs(targetRotX - rotX) < 0.001) {
        rotY = targetRotY; rotX = targetRotX;
        targetRotY = targetRotX = null;
      }
    } else if (!isDragging) {
      dragVelX *= 0.92; dragVelY *= 0.92;
      if (Math.abs(dragVelX) < 0.0001) dragVelX = 0;
      if (Math.abs(dragVelY) < 0.0001) dragVelY = 0;
      rotY += dragVelX; rotX -= dragVelY;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      if (autoSpin) rotY += 0.0025;
    }

    earthGroup.quaternion.copy(buildQuat(rotY, rotX));
    cloudMesh.rotation.y = rotY * 0.03;

    earthGroup.children.forEach(child => {
      if (child.userData.isMarkerRing) {
        child.quaternion.copy(earthGroup.quaternion).invert();
        const sel   = child.userData.selected;
        const speed = sel ? 5.5 : 2.8;
        const amp   = sel ? 0.45 : 0.2;
        child.scale.setScalar(1 + Math.sin(t * speed + child.position.x) * amp + (sel ? 0.25 : 0));
        if (child.material) child.material.opacity = sel ? 1 : 0.7;
      }
    });

    arcParticles.forEach(p => {
      p.t = (p.t + p.speed) % 1;
      p.mesh.position.copy(p.curve.getPoint(p.t));
    });

    if (selectedOffice && selectedOffice._dot) {
      const worldPos = selectedOffice._dot.getWorldPosition(new THREE.Vector3());
      const screen   = projectToScreen(worldPos);
      if (screen.behind) {
        cityLabel.style.display = 'none';
      } else {
        cityLabel.style.display = 'flex';
        cityLabel.style.left    = screen.x + 'px';
        cityLabel.style.top     = (screen.y - 8) + 'px';
      }
    }

    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(markerMeshes);
    if (hits.length > 0) {
      const hit    = hits[0].object;
      const office = hit.userData.office;
      if (hoveredMarker !== hit) {
        hoveredMarker = hit;
        earthTooltip.innerHTML = `
          <strong>${office.city}</strong>
          <span>${office.region}</span>
          <em>${office.team}</em>
        `;
        earthTooltip.classList.add('show');
      }
      const rect = canvasEl.getBoundingClientRect();
      earthTooltip.style.left = (((mouse2D.x + 1) / 2) * rect.width  + rect.left) + 'px';
      earthTooltip.style.top  = (((1 - mouse2D.y) / 2) * rect.height + rect.top)  + 'px';
    } else if (hoveredMarker) {
      hoveredMarker = null;
      earthTooltip.classList.remove('show');
    }

    rimLight.intensity = 1.6 + Math.sin(t * 1.6) * 0.3;
    renderer.render(scene, camera);
  }

  loop();

  function onResize() {
    renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);
    camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  function destroy() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize',    onResize);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    canvasEl.removeEventListener('mousedown',  onDown);
    canvasEl.removeEventListener('touchstart', onDown);
  }

  return { destroy, markerMeshes, flyToOffice };
}
