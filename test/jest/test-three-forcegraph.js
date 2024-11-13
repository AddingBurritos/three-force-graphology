import t from "tap";
import ThreeForceGraph from '../../src/three-forcegraph.js';

t.test("ThreeForceGraph", t => {
    const fg = new ThreeForceGraph();
    const graph = fg.graph();
    graph.addNode('src');
    fg.graph(graph);
    t.end();
});