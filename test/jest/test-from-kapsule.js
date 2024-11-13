import t from "tap";
import fromKapsule from '../../src/utils/kapsule-class.js'
import ForceGraph from '../../src/forcegraph-kapsule.js';
import { Group } from 'three';
import Graph from "graphology";

t.test("makes fromKapsule from three group", t => {
    const scene = new Group();
    const kap = ForceGraph();
    kap(scene);

    const graph = kap.graph();
    graph.addNode('src');
    kap.graph(graph);
    t.end();
});

t.test("makes fromKapsule from object", t => {
    const res = fromKapsule(ForceGraph, Object, true);
    // console.log(res.prototype);
    // const test = new res();
    t.end();
});