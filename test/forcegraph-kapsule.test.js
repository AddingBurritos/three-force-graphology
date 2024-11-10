import { describe, it, expect } from 'vitest';
import ForceGraph from '../src/forcegraph-kapsule.js';
import { Group } from 'three';
import accessorFn from 'accessor-fn';

describe('ForceGraph Kapsule', () => {
  it('creates forcegraph kapsule', () => {
    const scene = new Group();
    const forceGraph = ForceGraph();
    forceGraph(scene);
    const g = forceGraph.graph();
    g.addNode('src', { id: 'one' });
    g.addNode('dst', { id: 'two' });
    g.addEdgeWithKey('src->dst', 'src', 'dst');
    const srcNode = g.getNodeAttributes('src');
    const dstNode = g.getNodeAttributes('dst');

    forceGraph.warmupTicks(1);
    forceGraph.refresh();
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
