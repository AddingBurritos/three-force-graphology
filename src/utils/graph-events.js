
import { deallocate, emptyObject } from './three-gc.js';
import * as threeObjs from './three-objs.js'
import accessorFn from 'accessor-fn';

function nodeAddedHandler(state, node) { // node = { key, attributes }
    // If visible...
    const visibilityAccessor = accessorFn(state.nodeVisibility);
    if (visibilityAccessor(node)) {
        node.attributes.__threeObj = threeObjs.completeThreeNode(state, node);
    }
}

function edgeAddedHandler(state, edge) { // edge = { key, source, target, attributes, directed }
    // If visible...
    const visibilityAccessor = accessorFn(state.linkVisibility);
    if (visibilityAccessor(edge)) {
        const line = threeObjs.completeThreeEdge(state, edge);
        edge.attributes.__lineObj = line;

        const arrowLengthAccessor = accessorFn(state.linkDirectionalArrowLength);
        if (arrowLengthAccessor(edge)) {
            const arrow = threeObjs.completeThreeArrow(state, edge);
            edge.attributes.__arrowObj = arrow;
        }
        
        const linkDirectionalParticlesAccessor = accessorFn(state.linkDirectionalParticles);
        if (linkDirectionalParticlesAccessor(edge)) {
            const particles = threeObjs.completeThreePhotons(state, edge);
            edge.attributes.__photonsObj = particles;
        }
    }
}

function nodeAttributesUpdatedHandler(state, {type, key, attributes, name, data}) {
    const node = {key, attributes};
    if (type == "set") {
        // If visibility is set, create and bind object
        // If visibility is unset, delete and unbind object
        // If visibility is true and nodeVal or nodeColor are set, replace and rebind the object
        const nodeVisibilityAccessor = accessorFn(state.nodeVisibility);
        const sceneObj = attributes.__threeObj;

        // nodeVisibility
        if (name == nodeVisibilityAccessor) {
            // delete previous object, if exists
            if (sceneObj) {
                nodeDroppedHandler(state, node);
            }

            // If set to visible, create object
            if (nodeVisibilityAccessor(node)) {
                nodeAddedHandler(state, node);
            }
        // nodeVal
        } else if (name == accessorFn(state.nodeVal) && sceneObj && sceneObj.__graphDefaultObj) {
            // Set geometry
            if (sceneObj.geometry) {
                sceneObj.geometry.dispose();
            }
            sceneObj.geometry = threeObjs.createThreeNodeGeometry(state, node, sceneObj);
        // nodeColor
        } else if (name == accessorFn(state.nodeColor) && sceneObj && sceneObj.__graphDefaultObj) {
            // Set material
            if (sceneObj.material) {
                sceneObj.material.dispose();
            }
            sceneObj.material = threeObjs.createThreeNodeMaterial(state, node, sceneObj);
        }
    }
}

function edgeAttributesUpdatedHandler(state, {type, key, attributes, name, data}) {
    const edge = {key, attributes};
    if (type == "set") {
        const edgeVisibilityAccessor = accessorFn(state.linkVisibility);
        const sceneObj = attributes.__lineObj;

        // linkVisibility
        if (name == edgeVisibilityAccessor) {
            // Delete previous line, if exists
            if (sceneObj) {
                edgeDroppedHandler(state, edge);
            }
            // If set to visible, create line
            if (edgeVisibilityAccessor(edge)) {
                edgeAddedHandler(state, edge);
            }
        // linkWidth
        } else if (name == accessorFn(state.linkWidth) && sceneObj && sceneObj.__graphDefaultObj) {
            // Set geometry
            if (sceneObj.geometry) {
                sceneObj.geometry.dispose();
            }
            sceneObj.geometry = threeObjs.createThreeEdgeMaterial(state, edge, sceneObj);
        // linkColor
        } else if (name == accessorFn(state.linkColor) && sceneObj && sceneObj.__graphDefaultObj) {
            // Set material
            if (sceneObj.material) {
                sceneObj.material.dispose();
            }
            sceneObj.material = threeObjs.createThreeEdgeMaterial(state, edge, sceneObj);
        }
    }
}

function nodeDroppedHandler(state, node) { // node = { key, attributes }
    // remove object
    const obj = node.attributes.__threeObj;
    if (obj) {
        state.graphScene.remove(obj);
        deallocate(obj);
        delete node.attributes.__threeObj;
    }
}

function edgeDroppedHandler(state, edge) { // edge = { key, source, target, attributes, directed }
    // remove trailing single photons
    const singlePhotonsObj = edge.attributes.__singleHopPhotonsObj;
    if (singlePhotonsObj) {
        singlePhotonsObj.parent.remove(singlePhotonsObj);
        emptyObject(singlePhotonsObj);
        delete edge.attributes.__singleHopPhotonsObj;
    }

    // remove line
    const line = edge.attributes.__lineObj;
    if (line) {
        state.graphScene.remove(line);
        deallocate(line);
        delete edge.attributes.__lineObj;
    }

    // remove arrow, if exists
    const arrow = edge.attributes.__arrowObj;
    if (arrow) {
        state.graphScene.remove(arrow);
        deallocate(arrow);
        delete edge.attributes.__arrowObj;
    }

    // remove photons, if exist
    const photons = edge.attributes.__photonsObj;
    if (photons) {
        state.graphScene.remove(photons);
        emptyObject(photons);
        delete edge.attributes.__photonsObj;
    }
}

function clearHandler(state) {
    nodeClearHandler(state);
    edgeClearHandler(state);
}

function nodeClearHandler(state) {
    state.sphereGeometries = {};
    state.sphereMaterials = {};
}

function edgeClearHandler(state) {
    state.cylinderGeometries = {};
    state.lambertLineMaterials = {};
    state.basicLineMaterials = {};
    state.particleGeometries = {}; 
    state.particleMaterials = {};
}

export {
    nodeAddedHandler,
    edgeAddedHandler,
    nodeAttributesUpdatedHandler,
    edgeAttributesUpdatedHandler,
    nodeDroppedHandler,
    edgeDroppedHandler,
    clearHandler,
}