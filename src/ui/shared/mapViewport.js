// =============================================================================
// SHARED MAP VIEWPORT ENGINE (ADR-0014 §3)
// Unified camera pan, zoom-toward-cursor/pinch, frustum culling, pointer/touch
// tap-vs-drag disambiguation, and 6-layer render pipeline contract.
// Works seamlessly with PixiJS v8 (pixi-viewport) or Canvas 2D fallback.
// =============================================================================

export const MAP_RENDER_LAYERS = {
  TERRAIN: 0,
  DECALS: 1,
  PROPS: 2,
  ACTORS: 3,
  LIGHTING: 4,
  OVERLAYS: 5
};

export function createMapViewport(options) {
  const opts = options || {};
  const gridAdapter = opts.gridAdapter || null;
  const minZoom = typeof opts.minZoom === 'number' ? opts.minZoom : 0.45;
  const maxZoom = typeof opts.maxZoom === 'number' ? opts.maxZoom : 2.5;
  const bounds = opts.bounds || null; // { minX, maxX, minY, maxY }

  const camera = {
    x: typeof opts.x === 'number' ? opts.x : 0, // World X at viewport center
    y: typeof opts.y === 'number' ? opts.y : 0, // World Y at viewport center
    zoom: typeof opts.zoom === 'number' ? opts.zoom : 1.0,
    width: opts.viewportWidth || 672,
    height: opts.viewportHeight || 480
  };

  function clampCamera() {
    if (camera.zoom < minZoom) camera.zoom = minZoom;
    if (camera.zoom > maxZoom) camera.zoom = maxZoom;
    if (bounds) {
      if (typeof bounds.minX === 'number' && camera.x < bounds.minX) camera.x = bounds.minX;
      if (typeof bounds.maxX === 'number' && camera.x > bounds.maxX) camera.x = bounds.maxX;
      if (typeof bounds.minY === 'number' && camera.y < bounds.minY) camera.y = bounds.minY;
      if (typeof bounds.maxY === 'number' && camera.y > bounds.maxY) camera.y = bounds.maxY;
    }
  }

  function screenToWorld(sx, sy) {
    return {
      wx: camera.x + (sx - camera.width * 0.5) / camera.zoom,
      wy: camera.y + (sy - camera.height * 0.5) / camera.zoom
    };
  }

  function worldToScreen(wx, wy) {
    return {
      sx: (wx - camera.x) * camera.zoom + camera.width * 0.5,
      sy: (wy - camera.y) * camera.zoom + camera.height * 0.5
    };
  }

  function setZoom(nextZoom, anchorSx, anchorSy) {
    const clamped = Math.max(minZoom, Math.min(maxZoom, nextZoom));
    if (typeof anchorSx === 'number' && typeof anchorSy === 'number') {
      const before = screenToWorld(anchorSx, anchorSy);
      camera.zoom = clamped;
      const after = screenToWorld(anchorSx, anchorSy);
      camera.x += (before.wx - after.wx);
      camera.y += (before.wy - after.wy);
    } else {
      camera.zoom = clamped;
    }
    clampCamera();
    return camera.zoom;
  }

  function panByScreenDelta(dsx, dsy) {
    camera.x -= dsx / camera.zoom;
    camera.y -= dsy / camera.zoom;
    clampCamera();
  }

  function centerOnWorld(wx, wy) {
    camera.x = wx;
    camera.y = wy;
    clampCamera();
  }

  function centerOnTile(coord) {
    if (!gridAdapter || typeof gridAdapter.tileToWorld !== 'function') return;
    const w = gridAdapter.tileToWorld(coord);
    centerOnWorld(w.wx, w.wy);
  }

  function screenToTile(sx, sy) {
    if (!gridAdapter || typeof gridAdapter.worldToTile !== 'function') return null;
    const w = screenToWorld(sx, sy);
    return gridAdapter.worldToTile(w.wx, w.wy);
  }

  function tileToScreen(coord) {
    if (!gridAdapter || typeof gridAdapter.tileToWorld !== 'function') return null;
    const w = gridAdapter.tileToWorld(coord);
    return worldToScreen(w.wx, w.wy);
  }

  function getVisibleWorldRect(margin) {
    const pad = typeof margin === 'number' ? margin : 64;
    const tl = screenToWorld(-pad, -pad);
    const br = screenToWorld(camera.width + pad, camera.height + pad);
    return {
      minX: tl.wx,
      minY: tl.wy,
      maxX: br.wx,
      maxY: br.wy
    };
  }

  function resize(width, height) {
    if (width > 0) camera.width = width;
    if (height > 0) camera.height = height;
    clampCamera();
  }

  // Unified Mouse + Touch Pointer Controller (Tap-vs-Drag disambiguation + Pinch-Zoom)
  function attachPointerControls(canvasEl, handlers) {
    if (!canvasEl || typeof canvasEl.addEventListener !== 'function') return function() {};
    const cb = handlers || {};
    const dragThresholdPx = 8;

    let isDown = false;
    let dragged = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastPinchDist = 0;

    function getLocalPos(clientX, clientY) {
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = rect.width > 0 ? (camera.width / rect.width) : 1;
      const scaleY = rect.height > 0 ? (camera.height / rect.height) : 1;
      return {
        sx: (clientX - rect.left) * scaleX,
        sy: (clientY - rect.top) * scaleY
      };
    }

    function onMouseDown(e) {
      isDown = true;
      dragged = false;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
    }

    function onMouseMove(e) {
      const pos = getLocalPos(e.clientX, e.clientY);
      if (isDown) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(e.clientX - startX, e.clientY - startY) >= dragThresholdPx) {
          dragged = true;
        }
        if (dragged) {
          panByScreenDelta(dx, dy);
          if (typeof cb.onCameraChange === 'function') cb.onCameraChange(camera);
        }
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (typeof cb.onHoverTile === 'function') {
        cb.onHoverTile(screenToTile(pos.sx, pos.sy), pos);
      }
    }

    function onMouseUp(e) {
      if (!isDown) return;
      isDown = false;
      if (!dragged && typeof cb.onTapTile === 'function') {
        const pos = getLocalPos(e.clientX, e.clientY);
        cb.onTapTile(screenToTile(pos.sx, pos.sy), pos);
      }
    }

    function onWheel(e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      const pos = getLocalPos(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom(camera.zoom * factor, pos.sx, pos.sy);
      if (typeof cb.onCameraChange === 'function') cb.onCameraChange(camera);
    }

    function onTouchStart(e) {
      if (!e.touches || e.touches.length === 0) return;
      if (e.touches.length === 1) {
        isDown = true;
        dragged = false;
        startX = lastX = e.touches[0].clientX;
        startY = lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isDown = false;
        dragged = true;
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }

    function onTouchMove(e) {
      if (!e.touches || e.touches.length === 0) return;
      if (e.touches.length === 1 && isDown) {
        const t = e.touches[0];
        if (Math.hypot(t.clientX - startX, t.clientY - startY) >= dragThresholdPx) {
          dragged = true;
        }
        if (dragged) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          panByScreenDelta(t.clientX - lastX, t.clientY - lastY);
          if (typeof cb.onCameraChange === 'function') cb.onCameraChange(camera);
        }
        lastX = t.clientX;
        lastY = t.clientY;
      } else if (e.touches.length === 2) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0 && dist > 0) {
          const midX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
          const pos = getLocalPos(midX, midY);
          setZoom(camera.zoom * (dist / lastPinchDist), pos.sx, pos.sy);
          if (typeof cb.onCameraChange === 'function') cb.onCameraChange(camera);
        }
        lastPinchDist = dist;
      }
    }

    function onTouchEnd(e) {
      if (isDown && !dragged && typeof cb.onTapTile === 'function' && e.changedTouches && e.changedTouches[0]) {
        const pos = getLocalPos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        cb.onTapTile(screenToTile(pos.sx, pos.sy), pos);
      }
      isDown = false;
      lastPinchDist = 0;
    }

    canvasEl.addEventListener('mousedown', onMouseDown);
    canvasEl.addEventListener('mousemove', onMouseMove);
    canvasEl.addEventListener('mouseup', onMouseUp);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasEl.addEventListener('touchmove', onTouchMove, { passive: false });
    canvasEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return function detach() {
      canvasEl.removeEventListener('mousedown', onMouseDown);
      canvasEl.removeEventListener('mousemove', onMouseMove);
      canvasEl.removeEventListener('mouseup', onMouseUp);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('touchmove', onTouchMove);
      canvasEl.removeEventListener('touchend', onTouchEnd);
    };
  }

  clampCamera();

  return {
    camera: camera,
    gridAdapter: gridAdapter,
    screenToWorld: screenToWorld,
    worldToScreen: worldToScreen,
    setZoom: setZoom,
    panByScreenDelta: panByScreenDelta,
    centerOnWorld: centerOnWorld,
    centerOnTile: centerOnTile,
    screenToTile: screenToTile,
    tileToScreen: tileToScreen,
    getVisibleWorldRect: getVisibleWorldRect,
    resize: resize,
    attachPointerControls: attachPointerControls
  };
}
