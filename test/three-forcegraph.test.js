import { describe, it } from 'vitest';
import ThreeForceGraph from '../src/three-forcegraph.js';
import ForceGraph from '../src/index.js';

describe('ThreeForceGraph tests', () => {
  it('creates and modifies a graph', () => {
    const fg = new ThreeForceGraph();
    const graph = fg.graph();
    graph.addNode('src');
    fg.graph(graph);
  });
});

describe("Link Kapsule", () => {
  it('doesn\'t duplicate event listeners', () => {
    const fg = new ForceGraph();
    
  });
});