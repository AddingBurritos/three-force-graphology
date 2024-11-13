import { describe, it, expect } from 'vitest';
import Graph from 'graphology';
import * as threeObjs from '../src/utils/three-objs.js';
import {
    Group,
    Mesh,
    MeshLambertMaterial,
    Color,
    SphereGeometry,
    CylinderGeometry,
    ConeGeometry,
    Line
} from 'three';

describe('Base Tests', () => {
    describe('createBaseThreeNode', () => {
        it('creates base three node as Mesh', () => {
            const state = {
                nodeThreeObjectExtend: ({ key, attributes }) => attributes.nodeThreeObjectExtend
            };
            const node = { key: "test", attributes: { nodeThreeObjectExtend: false } };
            const actual = threeObjs.createBaseThreeNode(state, node);

            expect(actual).toBeInstanceOf(Mesh);
            expect(actual.__graphDefaultObj).toBe(true);
            expect(actual.__graphObjType).toBe('node');
        });
    });

    describe('createBaseThreeEdge', () => {
        it('creates base three edge as Line', () => {
            const state = {
                linkThreeObjectExtend: ({ key, attributes }) => attributes.linkThreeObjectExtend
            };
            const edge = { key: "test", attributes: { linkThreeObjectExtend: false } };
            const actual = threeObjs.createBaseThreeEdge(state, edge);

            expect(actual).toBeInstanceOf(Line);
            expect(actual.__graphDefaultObj).toBe(true);
            expect(actual.__graphObjType).toBe('link');
        });

        it('creates base three edge as Mesh when linkWidth > 0', () => {
            const state = {
                linkThreeObjectExtend: ({ key, attributes }) => attributes.linkThreeObjectExtend,
                linkWidth: ({ key, attributes }) => attributes.linkWidth
            };
            const edge = { key: "test", attributes: { linkThreeObjectExtend: false, linkWidth: 10 } };
            const actual = threeObjs.createBaseThreeEdge(state, edge);

            expect(actual).toBeInstanceOf(Mesh);
            expect(actual.__graphDefaultObj).toBe(true);
            expect(actual.__graphObjType).toBe('link');
        });
    });

    describe('createBaseThreeArrow', () => {
        it('creates base three arrow as Mesh', () => {
            const actual = threeObjs.createBaseThreeArrow();

            expect(actual).toBeInstanceOf(Mesh);
            expect(actual.__linkThreeObjType).toBe('arrow');
        });
    });

    describe('createBaseThreePhotons', () => {
        it('creates base three photons as Group', () => {
            const actual = threeObjs.createBaseThreePhotons();

            expect(actual).toBeInstanceOf(Group);
            expect(actual.__linkThreeObjType).toBe('photons');
        });
    });
});

describe('Geometry Tests', () => {
    describe('createThreeNodeGeometry', () => {
        it('creates SphereGeometry for node', () => {
            const state = {
                nodeThreeObjectExtend: ({ key, attributes }) => attributes.nodeThreeObjectExtend,
                nodeResolution: 8,
                nodeRelSize: 4,
                sphereGeometries: {}
            };
            const attributes = { nodeThreeObjectExtend: false };
            const node = { key: "test", attributes };
            const baseObj = threeObjs.createBaseThreeNode(state, node);
            const geometry = threeObjs.createThreeNodeGeometry(state, node, baseObj);

            expect(geometry).toBeInstanceOf(SphereGeometry);
            expect(geometry.parameters.radius).toBe(4);
            expect(geometry.parameters.widthSegments).toBe(8);
            expect(geometry.parameters.heightSegments).toBe(8);
        });
    });

    describe('createThreeEdgeGeometry', () => {
        it('creates CylinderGeometry for edge', () => {
            const state = {
                linkThreeObjectExtend: ({ key, attributes }) => attributes.linkThreeObjectExtend,
                linkResolution: 6,
                linkWidth: 1,
                cylinderGeometries: {}
            };
            const attributes = { linkThreeObjectExtend: false };
            const edge = { key: "test", attributes };
            const baseLine = threeObjs.createBaseThreeEdge(state, edge);
            const geometry = threeObjs.createThreeEdgeGeometry(state, edge, baseLine);

            expect(geometry).toBeInstanceOf(CylinderGeometry);
            expect(geometry.parameters.radiusTop).toBe(state.linkWidth / 2);
            expect(geometry.parameters.radiusBottom).toBe(state.linkWidth / 2);
            expect(geometry.parameters.height).toBe(1);
            expect(geometry.parameters.radialSegments).toBe(state.linkResolution);
            expect(geometry.parameters.heightSegments).toBe(1);
            expect(geometry.parameters.openEnded).toBe(false);
        });
    });

    describe('createThreeArrowGeometry', () => {
        it('creates ConeGeometry for arrow', () => {
            const state = {
                linkDirectionalArrowResolution: 8,
                linkDirectionalArrowLength: ({ key, attributes }) => attributes.linkDirectionalArrowLength
            };
            const edge = { key: "test", attributes: { linkDirectionalArrowLength: 2 } };
            const baseArrow = threeObjs.createBaseThreeArrow();
            const geometry = threeObjs.createThreeArrowGeometry(state, edge, baseArrow);

            expect(geometry).toBeInstanceOf(ConeGeometry);
            expect(geometry.parameters.radius).toBe(edge.attributes.linkDirectionalArrowLength / 4);
            expect(geometry.parameters.height).toBe(edge.attributes.linkDirectionalArrowLength);
            expect(geometry.parameters.radialSegments).toBe(state.linkDirectionalArrowResolution);
        });
    });
});

describe('Materials Tests', () => {
    let expectedColor = new Color('#a0a0a0');

    describe('createThreeNodeMaterial', () => {
        it('creates MeshLambertMaterial for node', () => {
            const state = {
                nodeThreeObjectExtend: ({ key, attributes }) => attributes.nodeThreeObjectExtend,
                nodeOpacity: 0.75,
                nodeColor: ({ key, attributes }) => attributes.color,
                sphereMaterials: {}
            };
            const attributes = { nodeThreeObjectExtend: false, color: '#a0a0a0' };
            const node = { key: "test", attributes };
            const baseObj = threeObjs.createBaseThreeNode(state, node);
            const material = threeObjs.createThreeNodeMaterial(state, node, baseObj);

            expect(material).toBeInstanceOf(MeshLambertMaterial);
            expect(material.color.r).toBe(expectedColor.r);
            expect(material.color.g).toBe(expectedColor.g);
            expect(material.color.b).toBe(expectedColor.b);
            expect(material.opacity).toBe(0.75);
        });
    });

    describe('createThreeEdgeMaterial', () => {
        it('creates MeshLambertMaterial for edge', () => {
            const state = {
                linkThreeObjectExtend: ({ key, attributes }) => attributes.linkThreeObjectExtend,
                linkOpacity: 0.75,
                linkColor: ({ key, attributes }) => attributes.color,
                lambertLineMaterials: {},
                linkWidth: 1
            };
            const attributes = { linkThreeObjectExtend: false, color: '#a0a0a0' };
            const edge = { key: "test", attributes };
            const baseLine = threeObjs.createBaseThreeEdge(state, edge);
            const material = threeObjs.createThreeEdgeMaterial(state, edge, baseLine);

            expect(material).toBeInstanceOf(MeshLambertMaterial);
            expect(material.color.r).toBe(expectedColor.r);
            expect(material.color.g).toBe(expectedColor.g);
            expect(material.color.b).toBe(expectedColor.b);
            expect(material.opacity).toBe(0.75);
        });
    });
});
