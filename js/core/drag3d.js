/* ===== Manipulación directa 3D (arrastre de sondas, brújula y superficie gaussiana) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady || !renderer || !renderer.domElement) {
    Sim.drag = { syncHint() {} };
    return;
  }

  const dom = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPt = new THREE.Vector3();
  const grabOffset = new THREE.Vector3();

  let isDragging = false;
  let activeDrag = null;
  let lastQuantized = '';

  function updateNdc(e) {
    const rect = dom.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    return true;
  }

  function getCurrentTarget() {
    if (!Sim.activeMod || typeof Sim.activeMod.getDragTarget !== 'function') return null;
    const t = Sim.activeMod.getDragTarget();
    if (!t || !t.object) return null;
    return t;
  }

  function rayHitTarget(e, target) {
    if (!target || !updateNdc(e)) return null;
    raycaster.setFromCamera(pointerNdc, cam);
    const hits = raycaster.intersectObject(target.object, true);
    return hits.length > 0 ? hits[0] : null;
  }

  function quantize(v, min, max, step) {
    const clamped = Math.max(min, Math.min(max, v));
    if (!step) return clamped;
    return Math.round(clamped / step) * step;
  }

  function syncHint(mod) {
    const hintEl = $('vp-drag-hint');
    if (!hintEl) return;
    const target = mod && typeof mod.getDragTarget === 'function' ? mod.getDragTarget() : null;
    if (target && target.hint) {
      hintEl.textContent = target.hint;
      hintEl.hidden = false;
    } else {
      hintEl.hidden = true;
    }
  }

  if (typeof dom.addEventListener === 'function') {
    dom.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const target = getCurrentTarget();
      if (!target) return;
      const hit = rayHitTarget(e, target);
      if (!hit) return;

      raycaster.setFromCamera(pointerNdc, cam);
      if (!raycaster.ray.intersectPlane(dragPlane, hitPt)) return;

      const cur = target.getPos();
      grabOffset.set(cur.x - hitPt.x, cur.y - hitPt.y, 0);
      isDragging = true;
      activeDrag = target;
      lastQuantized = `${cur.x}:${cur.y}`;
      ctl.enabled = false;
      dom.style.cursor = 'grabbing';
      if (typeof dom.setPointerCapture === 'function') {
        try {
          dom.setPointerCapture(e.pointerId);
        } catch (_) {
          /* noop */
        }
      }
      e.stopPropagation();
    });

    dom.addEventListener('pointermove', (e) => {
      if (isDragging && activeDrag) {
        if (!updateNdc(e)) return;
        raycaster.setFromCamera(pointerNdc, cam);
        if (!raycaster.ray.intersectPlane(dragPlane, hitPt)) return;

        const b = activeDrag.bounds;
        const nx = quantize(hitPt.x + grabOffset.x, b.minX, b.maxX, b.step);
        const ny = quantize(hitPt.y + grabOffset.y, b.minY, b.maxY, b.step);
        const key = `${nx}:${ny}`;
        if (key !== lastQuantized) {
          lastQuantized = key;
          activeDrag.setPos(nx, ny);
          if (Sim.ui && Sim.ui.syncControls) Sim.ui.syncControls();
          if (Sim.plot && Sim.activeMod) Sim.plot.render(Sim.activeMod);
          if (Sim.explainer && Sim.activeMod) Sim.explainer.scheduleUpdate(Sim.activeMod);
          if (Sim.inspector) Sim.inspector.markDirty();
        }
        return;
      }

      const target = getCurrentTarget();
      if (!target) {
        if (dom.style.cursor) dom.style.cursor = '';
        return;
      }
      const hit = rayHitTarget(e, target);
      dom.style.cursor = hit ? 'grab' : '';
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      activeDrag = null;
      ctl.enabled = true;
      dom.style.cursor = '';
      if (e && typeof dom.releasePointerCapture === 'function') {
        try {
          dom.releasePointerCapture(e.pointerId);
        } catch (_) {
          /* noop */
        }
      }
    };

    dom.addEventListener('pointerup', endDrag);
    dom.addEventListener('pointercancel', endDrag);
  }

  Sim.drag = { syncHint };
})();
