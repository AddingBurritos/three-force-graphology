import Graph from 'graphology';
import t from 'tap';
import * as threeObjs from '../../src/utils/three-objs.js';
import {
    Group,
    Mesh,
    MeshLambertMaterial,
    Color,
    BufferGeometry,
    BufferAttribute,
    Matrix4,
    Vector3,
    SphereGeometry,
    CylinderGeometry,
    TubeGeometry,
    ConeGeometry,
    Line,
    LineBasicMaterial,
    QuadraticBezierCurve3,
    CubicBezierCurve3,
    Box3,
    Sphere
} from 'three';

t.test('Base', t => {
    t.test('createBaseThreeNode', t => {
        t.test('first', t => {
            const state = {
                nodeThreeObjectExtend: ({key, attributes}) => attributes.nodeThreeObjectExtend
            };
            const node = {key: "test", attributes: {nodeThreeObjectExtend: false}};
            const actual = threeObjs.createBaseThreeNode(state, node);
            t.type(actual, Mesh, 'created Mesh');
            t.equal(actual.__graphDefaultObj, true, '__graphDefaultObj is true');
            t.equal(actual.__graphObjType, 'node', '__graphObjType is node');
            t.end();
        });
        t.end();
    });

    t.test('createBaseThreeEdge', t => {
        t.test('linkThreeObjectExtend false', t => {
            const state = {
                linkThreeObjectExtend: ({key, attributes}) => attributes.linkThreeObjectExtend
            };
            const edge = {key: "test", attributes: {linkThreeObjectExtend: false}};
            const actual = threeObjs.createBaseThreeEdge(state, edge);

            t.type(actual, Line, 'created Line');
            t.equal(actual.__graphDefaultObj, true, '__graphDefaultObj is true');
            t.equal(actual.__graphObjType, 'link', '__graphObjType is link');
            t.end();
        });
        t.test('linkWidth > 0', t => {
            const state = {
                linkThreeObjectExtend: ({key, attributes}) => attributes.linkThreeObjectExtend,
                linkWidth: ({key, attributes}) => attributes.linkWidth,
            };
            const edge = {key: "test", attributes: {linkThreeObjectExtend: false, linkWidth: 10}};
            const actual = threeObjs.createBaseThreeEdge(state, edge);

            t.type(actual, Mesh, 'created Mesh');
            t.equal(actual.__graphDefaultObj, true, '__graphDefaultObj is true');
            t.equal(actual.__graphObjType, 'link', '__graphObjType is link');
            t.end();
        });
        t.end();
    });

    t.test('createBaseThreeArrow', t => {
        t.test('first', t => {
            const actual = threeObjs.createBaseThreeArrow();

            t.type(actual, Mesh, 'created Mesh');
            t.equal(actual.__linkThreeObjType, 'arrow', '__graphObjType is arrow');
            t.end();
        });
        t.end();
    });

    t.test('createBaseThreePhotons', t => {
        t.test('first', t => {
            const actual = threeObjs.createBaseThreePhotons();
            
            t.type(actual, Group, 'created Group');
            t.equal(actual.__linkThreeObjType, 'photons', '__graphObjType is photons');
            t.end();
        });
        t.end();
    });
    t.end();
});

t.test('Geometry', t => {
    t.test('createThreeNodeGeometry', t => {
        t.test('first', t => {
            const state = {
                nodeThreeObjectExtend: ({key, attributes}) => attributes.nodeThreeObjectExtend,
                nodeResolution: 8,
                nodeRelSize: 4,
                sphereGeometries: {},
            };
            const attributes = {
                nodeThreeObjectExtend: false
            };
            const node = {key: "test", attributes};
            const baseObj = threeObjs.createBaseThreeNode(state, node);
            const geometry = threeObjs.createThreeNodeGeometry(state, node, baseObj);

            t.type(geometry, SphereGeometry, 'created SphereGeometry');
            t.equal(geometry.parameters.radius, 4, 'correct radius');
            t.equal(geometry.parameters.widthSegments, 8, 'correct WidthSegments');
            t.equal(geometry.parameters.heightSegments, 8, 'correct heightSegments');
            t.end();
        });
        t.end();
    });

    t.test('createThreeEdgeGeometry', t => {
        t.test('first', t => {
            const state = {
                linkThreeObjectExtend: ({key, attributes}) => attributes.linkThreeObjectExtend,
                linkResolution: 6,
                linkWidth: 1,
                cylinderGeometries: {}
            };
            const attributes = {
                linkThreeObjectExtend: false,
            };
            const edge = {key: "test", attributes};
            const baseLine = threeObjs.createBaseThreeEdge(state, edge);
            const geometry = threeObjs.createThreeEdgeGeometry(state, edge, baseLine);

            t.type(geometry, CylinderGeometry, 'created CylinderGeometry');
            t.equal(geometry.parameters.radiusTop, state.linkWidth / 2, 'radiusTop');
            t.equal(geometry.parameters.radiusBottom, state.linkWidth / 2, 'radiusBottom');
            t.equal(geometry.parameters.height, 1, 'height');
            t.equal(geometry.parameters.radialSegments, state.linkResolution, 'radialSegments');
            t.equal(geometry.parameters.heightSegments, 1, 'heightSegments');
            t.equal(geometry.parameters.openEnded, false, 'openEnded');
            t.end();
        });
        t.end();
    });

    t.test('createThreeArrowGeometry', t => {
        t.test('first', t => {
            const state = {
                linkDirectionalArrowResolution: 8,
                linkDirectionalArrowLength: ({key, attributes}) => attributes.linkDirectionalArrowLength,
            };
            const edge = {key: "test", attributes: {linkDirectionalArrowLength: 2}};
            const baseArrow = threeObjs.createBaseThreeArrow();
            const geometry = threeObjs.createThreeArrowGeometry(state, edge, baseArrow);

            t.type(geometry, ConeGeometry, 'created ConeGeometry');
            t.equal(geometry.parameters.radius, edge.attributes.linkDirectionalArrowLength / 4, 'radius');
            t.equal(geometry.parameters.height, edge.attributes.linkDirectionalArrowLength, 'height');
            t.equal(geometry.parameters.radialSegments, state.linkDirectionalArrowResolution, 'radialSegments');
            t.end();
        });
        t.end();
    });

    t.test('createThreePhotonsGeometry', t => {
        t.test('first', t => {
            const state = {
                linkDirectionalParticleWidth: ({key, attributes}) => attributes.linkDirectionalParticleWidth,
                linkDirectionalParticleResolution: 8, 
                particleGeometries: {}
            };
            const edge = {key: "test", attributes: {linkDirectionalParticleWidth: 2}};
            const basePhotons = threeObjs.createBaseThreePhotons();
            const geometry = threeObjs.createThreePhotonsGeometry(state, edge, basePhotons);

            t.type(geometry, SphereGeometry, 'created SphereGeometry');
            t.equal(geometry.parameters.radius, 1, 'radius');
            t.equal(geometry.parameters.widthSegments, 8, 'WidthSegments');
            t.equal(geometry.parameters.heightSegments, 8, 'heightSegments');
            t.end();
        });
        t.end();
    });
    t.end();
});

t.test('Materials', t => {
    let expectedColor = new Color('#a0a0a0');
    t.test('createThreeNodeMaterial', t => {
        t.test('first', t => {
            const state = {
                nodeThreeObjectExtend: ({key, attributes}) => attributes.nodeThreeObjectExtend,
                nodeOpacity: 0.75,
                nodeColor: ({key, attributes}) => attributes.color,
                sphereMaterials: {},
            };
            const attributes = {
                nodeThreeObjectExtend: false,
                color: '#a0a0a0'
            };
            const node = {key: "test", attributes};
            const baseObj = threeObjs.createBaseThreeNode(state, node);
            const material = threeObjs.createThreeNodeMaterial(state, node, baseObj);

            t.type(material, MeshLambertMaterial, 'created MeshLambertMaterial');
            t.equal(material.color.r, expectedColor.r, 'red');
            t.equal(material.color.g, expectedColor.g, 'green');
            t.equal(material.color.b, expectedColor.b, 'blue');
            t.equal(material.color.isColor, expectedColor.isColor, 'isColor');
            t.equal(material.opacity, 0.75, 'opacity');
            t.end();
        });
        t.end();
    });
    t.test('createThreeEdgeMaterial', t => {
        t.test('first', t => {
            const state = {
                linkThreeObjectExtend: ({key, attributes}) => attributes.linkThreeObjectExtend,
                linkOpacity: 0.75,
                linkColor: ({key, attributes}) => attributes.color,
                lambertLineMaterials: {},
                linkWidth: 1,
            };
            const attributes = {
                linkThreeObjectExtend: false,
                color: '#a0a0a0'
            };
            const edge = {key: "test", attributes};
            const baseLine = threeObjs.createBaseThreeEdge(state, edge);
            const material = threeObjs.createThreeEdgeMaterial(state, edge, baseLine);

            t.type(material, MeshLambertMaterial, 'created MeshLambertMaterial');
            t.equal(material.color.r, expectedColor.r, 'red');
            t.equal(material.color.g, expectedColor.g, 'green');
            t.equal(material.color.b, expectedColor.b, 'blue');
            t.equal(material.color.isColor, expectedColor.isColor, 'isColor');
            t.equal(material.opacity, 0.75, 'opacity');
            t.end();
        });
        t.end();
    });
    t.test('createThreeArrowMaterial', t => {
        t.test('first', t => {
            const state = {
                linkDirectionalArrowResolution: 8,
                linkDirectionalArrowLength: ({key, attributes}) => attributes.linkDirectionalArrowLength,
                linkDirectionalArrowColor: ({key, attributes}) => attributes.color,
                linkOpacity: 0.75,
            };
            const attributes = {
                linkDirectionalArrowLength: 2,
                color: '#a0a0a0'
            };
            const edge = {key: "test", attributes};
            const baseArrow = threeObjs.createBaseThreeArrow();
            const material = threeObjs.createThreeArrowMaterial(state, edge, baseArrow);

            t.type(material, MeshLambertMaterial, 'created MeshLambertMaterial');
            t.equal(material.color.r, expectedColor.r, 'red');
            t.equal(material.color.g, expectedColor.g, 'green');
            t.equal(material.color.b, expectedColor.b, 'blue');
            t.equal(material.color.isColor, expectedColor.isColor, 'isColor');
            t.equal(material.opacity, 2.25, 'opacity');
            t.end();
        });
        t.end();
    });
    t.test('createThreePhotonsMaterial', t => {
        t.test('first', t => {
            const state = {
                linkDirectionalParticleColor: ({key, attributes}) => attributes.color,
                linkOpacity: 0.75,
                particleMaterials: {},
            };
            const attributes = {
                color: '#a0a0a0'
            };
            const edge = {key: "test", attributes};
            const basePhotons = threeObjs.createBaseThreePhotons();
            const material = threeObjs.createThreePhotonsMaterial(state, edge, basePhotons);

            t.type(material, MeshLambertMaterial, 'created MeshLambertMaterial');
            t.equal(material.color.r, expectedColor.r, 'red');
            t.equal(material.color.g, expectedColor.g, 'green');
            t.equal(material.color.b, expectedColor.b, 'blue');
            t.equal(material.color.isColor, expectedColor.isColor, 'isColor');
            t.equal(material.opacity, 2.25, 'opacity');
            t.end();
        });
        t.end();
    });
    t.end();
});

t.test('Complete', t => {
    t.test('completeThreeNode', t => {
        t.test('first', t => {
            const state = {
                graph: new Graph,
                graphScene: new Group,
                nodeThreeObjectExtend: ({key, attributes}) => attributes.nodeThreeObjectExtend,
                nodeColor: ({key, attributes}) => attributes.color,
                nodeResolution: 8,
                nodeRelSize: 4,
                nodeOpacity: 0.75,
                sphereMaterials: {},
                sphereGeometries: {},
            };
            const attributes = {
                nodeThreeObjectExtend: false,
                color: '#a0a0a0'
            };
            const node = { key: "test", attributes };
            state.graph.addNode(node.key, node.attributes);
            const actual = threeObjs.completeThreeNode(state, node);
            t.type(actual, Mesh, 'created Mesh');
            // t.equal(attributes.__threeObj, actual, 'object bound to node');
            t.equal(actual.__data, attributes, 'node attributes bound to object');
            t.equal(actual, state.graphScene.children[0], 'graphScene contains object');
            t.type(actual.material, MeshLambertMaterial, 'material is MeshLambertMaterial');
            t.type(actual.geometry, SphereGeometry, 'geometry is SphereGeometry');
            t.end();
        });
        t.end();
    });
    t.test('completeThreeEdge', t => {
        t.test('first', t => {
            const state = {
                graph: new Graph,
                graphScene: new Group,
                linkThreeObjectExtend: ({key, attributes}) => attributes.linkThreeObjectExtend,
                linkResolution: 6,
                linkWidth: 1,
                linkOpacity: 0.75,
                linkColor: ({key, attributes}) => attributes.color,
                lambertLineMaterials: {},
                cylinderGeometries: {},
            };
            const attributes = {
                linkThreeObjectExtend: false,
                color: '#a0a0a0'
            }
            const edge = {key: "test", attributes};
            state.graph.addNode("src");
            state.graph.addNode("dst");
            state.graph.addEdgeWithKey("test", "src", "dst", attributes);

            const actual = threeObjs.completeThreeEdge(state, edge);
            t.type(actual, Mesh, 'created Mesh');
            // t.equal(attributes.__lineObj, actual, 'line bound to edge');
            t.equal(actual.__data, attributes, 'edge attributes bound to line');
            t.equal(actual, state.graphScene.children[0], 'graphScene contains line');
            t.type(actual.material, MeshLambertMaterial, 'material is MeshLambertMaterial');
            t.type(actual.geometry, CylinderGeometry, 'geometry is CylinderGeometry');
            t.end();

        });
        t.end();
    });
    t.test('completeThreeArrow', t => {
        t.test('first', t => {
            const state = {
                graph: new Graph,
                graphScene: new Group,
                linkDirectionalArrowResolution: 8,
                linkDirectionalArrowLength: ({key, attributes}) => attributes.linkDirectionalArrowLength,
                linkDirectionalArrowColor: ({key, attributes}) => attributes.color,
                linkOpacity: 0.75,
            };
            const attributes = {
                color: '#a0a0a0',
                linkDirectionalArrowLength: 2,
            };
            const edge = {key: "test", attributes};
            state.graph.addNode("src");
            state.graph.addNode("dst");
            state.graph.addEdgeWithKey("test", "src", "dst", attributes);

            const actual = threeObjs.completeThreeArrow(state, edge);
            t.type(actual, Mesh, 'created Mesh');
            // t.equal(attributes.__arrowObj, actual, 'arrow bound to edge');
            t.equal(actual.__data, attributes, 'edge attributes bound to arrow');
            t.equal(actual, state.graphScene.children[0], 'graphScene contains arrow');
            t.type(actual.material, MeshLambertMaterial, 'material is MeshLambertMaterial');
            t.type(actual.geometry, ConeGeometry, 'geometry is CylinderGeometry');
            t.end();
        });
        t.end();
    });
    t.test('completeThreePhotons', t => {
        t.test('first', t => {
            const state = {
                graph: new Graph,
                graphScene: new Group,
                linkDirectionalParticleWidth: ({key, attributes}) => attributes.linkDirectionalParticleWidth,
                linkDirectionalParticleResolution: 8, 
                particleGeometries: {},
                linkDirectionalParticleColor: ({key, attributes}) => attributes.color,
                linkOpacity: 0.75,
                particleMaterials: {},
                linkDirectionalParticles: 3
            };
            const attributes = {
                color: '#a0a0a0',
                linkDirectionalParticleWidth: 2,
            };
            const edge = {key: "test", attributes};
            state.graph.addNode("src");
            state.graph.addNode("dst");
            state.graph.addEdgeWithKey("test", "src", "dst", attributes);

            const actual = threeObjs.completeThreePhotons(state, edge);
            t.type(actual, Group, 'created Group');
            // t.equal(attributes.__photonsObj, actual, 'arrow bound to photons');
            t.equal(actual.__data, attributes, 'edge attributes bound to photons');
            t.equal(actual, state.graphScene.children[0], 'graphScene contains photons');
            t.type(actual.material, MeshLambertMaterial, 'material is MeshLambertMaterial');
            t.type(actual.geometry, SphereGeometry, 'geometry is SphereGeometry');
            t.equal(actual.children.length, 3, "photons contains each photon");
            actual.children.map((photon, idx) => {
                t.type(photon, Mesh, `photon ${idx} is Mesh`);
                t.equal(photon.__data.idx, idx, `photon ${idx} is bound to Mesh`);
                t.type(photon.geometry, SphereGeometry, `photon ${idx} has SphereGeometry`);
                t.type(photon.material, MeshLambertMaterial, `photon ${idx} has MeshLambertMaterial`);
            });
            t.end();
        });
        t.end();
    });
    t.end();
});