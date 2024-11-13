import ForceGraph from '../../src/forcegraph-kapsule.js';
import t from 'tap';
import { Group } from 'three';
import accessorFn from 'accessor-fn';

t.test("creates forcegraph kapsule", t => {
    const scene = new Group();
    const forceGraph = ForceGraph();
    forceGraph(scene);
    const g = forceGraph.graph();
    g.addNode("src", {id: "one"});
    g.addNode("dst", {id: "two"});
    g.addEdgeWithKey("src->dst", "src", "dst");
    const srcNode = g.getNodeAttributes("src");
    const dstNode = g.getNodeAttributes("dst");

    forceGraph.warmupTicks(1)
    forceGraph.refresh()
    t.end();
});

t.test("accessor-fn", t => {
    const testObj = {
        'a': 1,
        'b': 2,
    };
    const node = {key: "test", attributes: {"size": 10}};

    t.test("accepts two args", t => {
        const myAcc = accessorFn((obj, extra) => obj[extra]);
        
        t.equal(1, myAcc(testObj, 'a'), "myAcc accepts two args");
        t.end();
    });

    t.test("can use curly braces in cb", t => {
        const myAcc = accessorFn(obj => { return obj.a; });
        t.equal(1, myAcc(testObj), "myAcc returns successfuly");
        t.end();
    });

    t.test("can use multiple statements in cb", t => {
        const myAcc = accessorFn(obj => {
            let sum = obj.a;
            sum += obj.b;
            return sum;
        });
        t.equal(3, myAcc(testObj), "accessorFn ran multiple statements");
        t.end();
    });

    t.test("can use multiple statements and multiple args", t => {
        const myAcc = accessorFn((obj, extra) => {
            let sum = obj[extra[0]];
            sum += obj[extra[1]];
            return sum;
        });
        t.equal(3, myAcc(testObj, Object.keys(testObj)), "accessorFn ran multiple statements with multiple args");
        t.end();
    });

    t.test("can optionally accept multiple args", t => {
        const acc = accessorFn(4);
        t.equal(4, acc(testObj), "accessor-fn returns constant");
        t.end();
    });

    t.test("can get node properties", t => {
        const propNodeSize = (node) => node.attributes.size; // defined in prop default
        const nodeSizeAccessor = accessorFn(propNodeSize); // accessed in relevant method
        t.equal(10, nodeSizeAccessor(node), "can access properties passed directly");
        t.end();
    });
    t.test("if node property doesn't exist", t => {
        const propNodeSize = (node) => node.attributes.unavailable; // defined in prop default
        const nodeSizeAccessor = accessorFn(propNodeSize); // accessed in relevant method
        const nodeSize = nodeSizeAccessor(node);
        t.notOk(nodeSize, "can access properties passed directly");
        t.end();
    });
    t.test("with constants", t => {
        const propNodeSize = 8; // defined in prop default
        const nodeSizeAccessor = accessorFn(propNodeSize); // accessed in relevant method
        t.equal(8, nodeSizeAccessor(node), "can access node with constants");
        t.end();
    });


    t.end();
});
