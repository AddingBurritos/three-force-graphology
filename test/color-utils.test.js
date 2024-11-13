import { describe, it, expect } from 'vitest';
import Graph from 'graphology';
import { autoColorNodes, autoColorEdges, autoColorObjects } from '../src/utils/color-utils.js';
import accessorFn from 'accessor-fn';

describe('autoColorNodes', () => {
  it('can run', () => {
    const g = new Graph();
    g.addNode('src', { type: 'A' });
    g.addNode('dst', { type: 'B' });
    g.addNode('other', { type: 'A' });
    autoColorNodes(g, accessorFn('type'), 'color');

    expect(g.getNodeAttribute('src', 'color')).toBe(g.getNodeAttribute('other', 'color'), 'type A nodes have same color');
    expect(g.getNodeAttribute('src', 'color')).not.toBe(g.getNodeAttribute('dst', 'color'), 'types A and B have different colors');
  });
});

describe('autoColorObjects', () => {
  it('can run', () => {
    const nodes = [
      { type: 'A', id: 1 },
      { type: 'B', id: 2 },
      { type: 'A', id: 3 }
    ];
    autoColorObjects(nodes, accessorFn('type'), 'color');

    expect(nodes[0].color).toBe(nodes[2].color, 'type A colors are same');
    expect(nodes[0].color).not.toBe(nodes[1].color, 'types A and B have different colors');
  });
});

describe('autoColorEdges', () => {
  it('can run', () => {
    const g = new Graph();
    g.addNode('src', { type: 'A' });
    g.addNode('dst', { type: 'B' });
    g.addNode('other', { type: 'A' });
    g.addEdgeWithKey('src->dst', 'src', 'dst', { type: 'C' });
    g.addEdgeWithKey('other->dst', 'other', 'dst', { type: 'D' });
    g.addEdgeWithKey('src->other', 'src', 'other', { type: 'C' });

    autoColorEdges(g, accessorFn('type'), 'color');

    expect(g.getEdgeAttribute('src->dst', 'color')).toBe(g.getEdgeAttribute('src->other', 'color'), 'type C edges have same color');
    expect(g.getEdgeAttribute('src->dst', 'color')).not.toBe(g.getEdgeAttribute('other->dst', 'color'), 'types C and D have different colors');
  });
});
