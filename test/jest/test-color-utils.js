import t from 'tap';
import Graph from 'graphology';
import { autoColorNodes, autoColorEdges, autoColorObjects } from '../../src/utils/color-utils.js';
import accessorFn from 'accessor-fn';

t.test('autoColorNodes can run', t => {
    const g = new Graph();
    g.addNode("src", {'type': 'A'});
    g.addNode("dst", {'type': 'B'});
    g.addNode("other", {'type': 'A'});
    autoColorNodes(g, accessorFn('type'), 'color');

    t.equal(g.getNodeAttribute("src", "color"), g.getNodeAttribute("other", "color"), "type A nodes have same color");
    t.not(g.getNodeAttribute("src", "color"), g.getNodeAttribute("dst", "color"), "types A and B have different colors");
    t.end();
});

t.test('autoColorObjects can run', t => {
    const nodes = [{'type': 'A', 'id': 1}, {'type': 'B', 'id': 2}, {'type': 'A', 'id': 3}];
    autoColorObjects(nodes, accessorFn('type'), 'color');

    t.equal(nodes[0].color, nodes[2].color, "type A colors are same");
    t.not(nodes[0].color, nodes[1].color, "types A and B have different colors");
    t.end();
});

t.test("autoColorEdges can run", t => {
    const g = new Graph();
    g.addNode("src", {'type': 'A'});
    g.addNode("dst", {'type': 'B'});
    g.addNode("other", {'type': 'A'});
    g.addEdgeWithKey("src->dst", "src", "dst", {'type': "C"});
    g.addEdgeWithKey("other->dst", "other", "dst", {'type': "D"});
    g.addEdgeWithKey("src->other", "src", "other", {"type": "C"});

    autoColorEdges(g, accessorFn("type"), "color");

    t.equal(g.getEdgeAttribute("src->dst", "color"), g.getEdgeAttribute("src->other", "color"), "type C edges have same color");
    t.not(g.getEdgeAttribute("src->dst", "color"), g.getEdgeAttribute("other->dst", "color"), "types C and D have different colors");
    t.end();
})