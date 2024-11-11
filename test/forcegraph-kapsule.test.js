import { describe, it, expect, beforeEach, vi } from 'vitest';
import ForceGraph from '../src/forcegraph-kapsule.js';
import { Group } from 'three';
import accessorFn from 'accessor-fn';

vi.mock('three-render-objects');
// vi.mock('three/examples/jsm/controls/DragControls.js', () => ({
//   DragControls: class DragControls {
//     constructor() {
//       this.addEventListener = vi.fn();
//       this.dispose = vi.fn();
//     }
//   }
// }));
vi.mock('three/addons/libs/stats.module.js', () => ({
  default: class Stats {
    domElement = document.createElement('div');
    update = vi.fn();
  }
}));

// Mock PointerEvent if needed
if (typeof PointerEvent === 'undefined') {
  global.PointerEvent = class PointerEvent extends Event {
    constructor(type, props = {}) {
      super(type);
      this.pointerType = props.pointerType || 'mouse';
      Object.assign(this, props);
    }
  };
}

describe('ForceGraph Kapsule', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    vi.clearAllMocks();
  });

  it('creates forcegraph kapsule', () => {
    const forceGraph = ForceGraph();
    forceGraph(container);
    const g = forceGraph.graph();
    g.addNode('src', { id: 'one' });
    g.addNode('dst', { id: 'two' });
    g.addEdgeWithKey('src->dst', 'src', 'dst');
    // const srcNode = g.getNodeAttributes('src');
    // const dstNode = g.getNodeAttributes('dst');

    // forceGraph.warmupTicks(1);
    // forceGraph.refresh();
    expect(container.querySelector('div')).toBeTruthy();
    expect(container.querySelector('.graph-info-msg')).toBeTruthy();
    expect(forceGraph.graph().listeners("nodeAdded").length).toBe(2);
    expect(forceGraph.graph().listeners("edgeAdded").length).toBe(2);
  });

  it('should provide a graph', () => {
    const forceGraph = ForceGraph();

    const fg = forceGraph(container);
    const graph = fg.graph();
    graph.addNode("src");
    graph.addNode("dst");
    graph.addEdgeWithKey("test", "src", "dst");

    expect(forceGraph.graph().order).toBe(2);
    expect(forceGraph.graph().size).toBe(1);
    expect(forceGraph.graph().listeners("nodeAdded").length).toBe(2);
    expect(forceGraph.graph().listeners("edgeAdded").length).toBe(2);
    expect(forceGraph.graph().listeners("nodeAttributesUpdated").length).toBe(2);
    expect(forceGraph.graph().listeners("edgeAttributesUpdated").length).toBe(1);
    expect(forceGraph.graph().listeners("nodeDropped").length).toBe(1);
    expect(forceGraph.graph().listeners("edgeDropped").length).toBe(2);
    expect(forceGraph.graph().listeners("cleared").length).toBe(2);
  });
});

describe('accessor-fn', () => {
  const testObj = {
    a: 1,
    b: 2,
  };
  const node = { key: 'test', attributes: { size: 10 } };

  it('accepts two args', () => {
    const myAcc = accessorFn((obj, extra) => obj[extra]);
    expect(myAcc(testObj, 'a')).toBe(1);
  });

  it('can use curly braces in callback', () => {
    const myAcc = accessorFn((obj) => {
      return obj.a;
    });
    expect(myAcc(testObj)).toBe(1);
  });

  it('can use multiple statements in callback', () => {
    const myAcc = accessorFn((obj) => {
      let sum = obj.a;
      sum += obj.b;
      return sum;
    });
    expect(myAcc(testObj)).toBe(3);
  });

  it('can use multiple statements and multiple args', () => {
    const myAcc = accessorFn((obj, extra) => {
      let sum = obj[extra[0]];
      sum += obj[extra[1]];
      return sum;
    });
    expect(myAcc(testObj, Object.keys(testObj))).toBe(3);
  });

  it('can optionally accept multiple args', () => {
    const acc = accessorFn(4);
    expect(acc(testObj)).toBe(4);
  });

  it('can get node properties', () => {
    const propNodeSize = (node) => node.attributes.size;
    const nodeSizeAccessor = accessorFn(propNodeSize);
    expect(nodeSizeAccessor(node)).toBe(10);
  });

  it("returns undefined if node property doesn't exist", () => {
    const propNodeSize = (node) => node.attributes.unavailable;
    const nodeSizeAccessor = accessorFn(propNodeSize);
    expect(nodeSizeAccessor(node)).toBeUndefined();
  });

  it('can access node properties with constants', () => {
    const propNodeSize = 8;
    const nodeSizeAccessor = accessorFn(propNodeSize);
    expect(nodeSizeAccessor(node)).toBe(8);
  });
});
