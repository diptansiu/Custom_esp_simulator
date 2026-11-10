// Wire Interaction Controller
// Handles pointer input, wire tool state, connection preview, pin hit detection,
// keyboard cancellation, and canvas coordinate transformations.
// Platform-independent - works with any renderer that provides canvas coordinates.

import { WireValidationService } from './WireValidationService.js';
import { ValidationError } from '../shared/core/errors/index.js';

/**
 * Wire Interaction Controller
 * Manages the wire creation interaction state machine:
 *   IDLE -> WIRE_MODE_ACTIVE -> PIN_SELECTED (source) -> WIRE_PREVIEW (dragging)
 *   -> CONNECTION_COMPLETE -> back to IDLE or WIRE_MODE_ACTIVE
 */
export class WireInteractionController {
  constructor(options = {}) {
    this.canvas = options.canvas || null; // Canvas element for coordinate mapping
    this.validationService = options.validationService || new WireValidationService();
    this.connectionService = options.connectionService || null;
    this.eventBus = options.eventBus || null;

    // State
    this.isWireMode = false;
    this.isDrawing = false;
    this.sourcePin = null; // { target, pin }
    this.previewEnd = null; // { x, y } in canvas coordinates
    this.hoverPin = null; // { target, pin }

    // Callbacks
    this.onWireStart = options.onWireStart || (() => {});
    this.onWireComplete = options.onWireComplete || (() => {});
    this.onWireCancel = options.onWireCancel || (() => {});
    this.onWirePreview = options.onWirePreview || (() => {});
    this.onWireError = options.onWireError || (() => {});

    // Bound event handlers (for cleanup)
    this._boundMouseDown = this._onMouseDown.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseUp = this._onMouseUp.bind(this);
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundContextMenu = this._onContextMenu.bind(this);

    this._isBound = false;
  }

  /**
   * Enable wire drawing mode.
   */
  enableWireMode() {
    this.isWireMode = true;
    this._cancelCurrentWire();
    this._bindEvents();
    this._publish('wire:mode-enabled');
  }

  /**
   * Disable wire drawing mode.
   */
  disableWireMode() {
    this.isWireMode = false;
    this.isDrawing = false;
    this.sourcePin = null;
    this.previewEnd = null;
    this.hoverPin = null;
    this._unbindEvents();
    this._publish('wire:mode-disabled');
  }

  /**
   * Check if wire mode is active.
   */
  isWireModeActive() {
    return this.isWireMode;
  }

  /**
   * Check if currently drawing a wire.
   */
  isDrawingWire() {
    return this.isDrawing;
  }

  /**
   * Get current source pin (if in drawing state).
   */
  getSourcePin() {
    return this.sourcePin ? { ...this.sourcePin } : null;
  }

  /**
   * Get current preview end point.
   */
  getPreviewEnd() {
    return this.previewEnd ? { ...this.previewEnd } : null;
  }

  /**
   * Set the canvas element for coordinate mapping.
   */
  setCanvas(canvas) {
    this.canvas = canvas;
  }

  /**
   * Set validation service.
   */
  setValidationService(validationService) {
    this.validationService = validationService;
  }

  /**
   * Set connection service.
   */
  setConnectionService(connectionService) {
    this.connectionService = connectionService;
  }

  /**
   * Cancel current wire drawing.
   */
  cancelWire() {
    this._cancelCurrentWire();
    this._publish('wire:cancelled');
  }

  // ── Internal Methods ──

  _bindEvents() {
    if (this._isBound) return;

    if (this.canvas) {
      this.canvas.addEventListener('mousedown', this._boundMouseDown);
      this.canvas.addEventListener('mousemove', this._boundMouseMove);
      this.canvas.addEventListener('mouseup', this._boundMouseUp);
    }
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('contextmenu', this._boundContextMenu);

    this._isBound = true;
  }

  _unbindEvents() {
    if (!this._isBound) return;

    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this._boundMouseDown);
      this.canvas.removeEventListener('mousemove', this._boundMouseMove);
      this.canvas.removeEventListener('mouseup', this._boundMouseUp);
    }
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('contextmenu', this._boundContextMenu);

    this._isBound = false;
  }

  /**
   * Mouse down handler - start wire from a pin.
   */
  _onMouseDown(event) {
    if (!this.isWireMode || !this.canvas) return;

    // Only left mouse button starts a wire
    if (event.button !== 0) return;

    const pin = this._getPinAtPosition(event.clientX, event.clientY);
    if (!pin) return;

    e.stopPropagation();

    this.sourcePin = pin;
    this.isDrawing = true;
    this.previewEnd = { x: event.clientX, y: event.clientY };

    this._publish('wire:started', { pin: { ...pin } });
  }

  /**
   * Mouse move handler - update preview line.
   */
  _onMouseMove(event) {
    if (!this.isDrawing || !this.canvas) return;

    this.previewEnd = { x: event.clientX, y: event.clientY };

    // Check if hovering over a valid target pin
    const pin = this._getPinAtPosition(event.clientX, event.clientY);
    if (pin && pin.target !== this.sourcePin.target && pin.pin !== this.sourcePin.pin) {
      this.hoverPin = pin;
    } else {
      this.hoverPin = null;
    }

    this._publish('wire:preview', {
      source: { ...this.sourcePin },
      target: this.hoverPin ? { ...this.hoverPin } : null,
      end: { ...this.previewEnd }
    });
  }

  /**
   * Mouse up handler - complete wire connection.
   */
  _onMouseUp(event) {
    if (!this.isDrawing || !this.canvas) return;

    event.preventDefault();
    event.stopPropagation();

    const targetPin = this.hoverPin;

    if (targetPin) {
      // Complete the connection
      try {
        this.connectionService.createWire(this.sourcePin, targetPin);
        this._publish('wire:completed', {
          from: { ...this.sourcePin },
          to: { ...targetPin }
        });
      } catch (err) {
        this._publish('wire:error', {
          error: err.message,
          from: { ...this.sourcePin },
          to: { ...targetPin }
        });
      }
    } else {
      // No valid target - cancel
      this._publish('wire:cancelled');
    }

    this.isDrawing = false;
    this.sourcePin = null;
    this.previewEnd = null;
    this.hoverPin = null;
  }

  /**
   * Key down handler - Escape cancels wire drawing.
   */
  _onKeyDown(event) {
    if (event.key === 'Escape' && this.isDrawing) {
      event.preventDefault();
      this.cancelWire();
    }
  }

  /**
   * Context menu handler - right-click cancels wire drawing.
   */
  _onContextMenu(event) {
    if (this.isDrawing) {
      event.preventDefault();
      this.cancelWire();
    }
  }

  /**
   * Cancel current wire drawing state.
   */
  _cancelCurrentWire() {
    this.isDrawing = false;
    this.sourcePin = null;
    this.previewEnd = null;
    this.hoverPin = null;
  }

  /**
   * Get the pin at a given client position.
   * This should be overridden by subclasses or integrated with the canvas
     * hit-testing system.
   */
  _getPinAtPosition(clientX, clientY) {
    // This method should be overridden by subclasses that have access to
    // the canvas element's pin elements.
    // Returns { target, pin } or null.
    return null;
  }

  /**
   * Publish an event if event bus is available.
   */
  _publish(eventType, payload) {
    if (this.eventBus && typeof this.eventBus.publish === 'function') {
      this.eventBus.publish(eventType, payload);
    }
  }
}

export default WireInteractionController;
