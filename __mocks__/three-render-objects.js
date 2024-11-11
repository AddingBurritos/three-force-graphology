import Kapsule from 'kapsule';
import { vi } from 'vitest';

const MockThreeRenderObjects = Kapsule({
  props: {
    width: { default: 0 },
    height: { default: 0 },
    backgroundColor: { default: '#000000' },
    backgroundImageUrl: {},
    onBackgroundImageLoaded: {},
    showNavInfo: { default: true },
    skyRadius: { default: 50000 },
    objects: { default: [] },
    lights: { default: [] },
    enablePointerInteraction: { default: true, triggerUpdate: false },
    lineHoverPrecision: { default: 1, triggerUpdate: false },
    hoverOrderComparator: { default: () => -1, triggerUpdate: false }, // keep existing order by default
    hoverFilter: { default: () => true, triggerUpdate: false }, // exclude objects from interaction
    tooltipContent: { triggerUpdate: false },
    hoverDuringDrag: { default: false, triggerUpdate: false },
    clickAfterDrag: { default: false, triggerUpdate: false },
    onHover: { default: () => {}, triggerUpdate: false },
    onClick: { default: () => {}, triggerUpdate: false },
    onRightClick: { triggerUpdate: false },
    mock: {default: true, triggerUpdate: false}
  },

  methods: {
    tick: function(state) {},
    getPointerPos: function(state) {
      return { x: 0, y: 0 };
    },
    cameraPosition: function(state) {
      return { x: 0, y: 0, z: 0, lookAt: { x: 1, y: 1, z: 1 } };
    },
    zoomToFit: function() { return this; },
    fitToBox: function() { return this; },
    getBbox: function() {
      return {};
    },
    getScreenCoords: function() { return {}; },
    getSceneCoords: function() { return {}; },
    intersectingObjects: function() { return {}; },
    renderer: function(state) {
      return {
        domElement: document.createElement('canvas'),
        render: vi.fn()
      };
    },
    scene: function(state) {
      return {
        add: vi.fn(),
        remove: vi.fn()
      };
    },
    camera: function(state) {
      return {
        position: { x: 0, y: 0, z: 0 },
        lookAt: vi.fn()
      };
    },
    postProcessingComposer: function() {},
    controls: function(state) {
      return {
        enabled: true,
        addEventListener: vi.fn(),
        domElement: document.createElement('div'),
        dispatchEvent: vi.fn()
      };
    },
    tbControls: function() {return {};}
  },

  stateInit: () => ({
    scene: {},
    camera: {},
    clock: {}
  }),

  init: function(domElement, state) {
    state.domElement = domElement;
  }
});

export default MockThreeRenderObjects;