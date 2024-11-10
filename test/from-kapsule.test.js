import { describe, it, expect } from 'vitest';
import fromKapsule from '../src/utils/kapsule-class.js';
import ForceGraph from '../src/forcegraph-kapsule.js';
import { Group } from 'three';
import Graph from 'graphology';

describe('fromKapsule tests', () => {
  it('makes fromKapsule from three group', () => {
    const res = new fromKapsule(ForceGraph, Group, true);
    const kap = new res();

    const graph = kap.graph();
    graph.addNode('src');

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

  it('makes fromKapsule from object', () => {
    const res = fromKapsule(ForceGraph, Object, true);
    // Add relevant checks/assertions here if necessary
    // console.log(res.prototype);
    // const test = new res();
  });
});
