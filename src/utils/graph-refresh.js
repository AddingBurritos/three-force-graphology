import * as graphEvents from './graph-events.js';
import * as threeObjs from './three-objs.js'
import accessorFn from 'accessor-fn';

function refreshNode(state, changedProps, node) {
    const hasAnyPropChanged = propList => propList.some(p => changedProps.hasOwnProperty(p));
    const visibilityAccessor = accessorFn(state.nodeVisibility);

    // nodeVisibility
    if (hasAnyPropChanged(['nodeVisibility'])) {
        if (changedProps.nodeVisibility) {
            // If the node is no longer visible, delete its three obj
            graphEvents.nodeDroppedHandler(state, node);
        } else {
            // If the node is now visible, create a three obj
            graphEvents.nodeAddedHandler(state, node);
        }
    }
    
    // If node is visible, node has a three obj
    if (visibilityAccessor(node)) {
        // graph
        if (state._flushObjects || hasAnyPropChanged([
            'graph', // TODO: reevaluate where graph updates are handled
            'nodeThreeObject',
            'nodeThreeObjectExtend'])) {
            graphEvents.nodeDroppedHandler(state, node);
            graphEvents.nodeAddedHandler(state, node);
        } else {
            const obj = node.attributes.__threeObj;
    
            // Replace Material
            if (hasAnyPropChanged(['nodeAutoColorBy', 'nodeColor', 'nodeOpacity'])) {
                obj.material = threeObjs.createThreeNodeMaterial(state, node, obj);
            }
    
            // Replace Geometry
            if (hasAnyPropChanged(['nodeVal', 'nodeRelSize', 'nodeResolution'])) {
                obj.geometry = threeObjs.createThreeNodeGeometry(state, node, obj);
            }
        }
    }
}

function refreshEdge(state, changedProps, edge) {
    const hasAnyPropChanged = propList => propList.some(p => changedProps.hasOwnProperty(p));
    const visibilityAccessor = accessorFn(state.linkVisibility);
    const arrowLengthAccessor = accessorFn(state.linkDirectionalArrowLength);
    const linkDirectionalParticlesAccessor = accessorFn(state.linkDirectionalParticles);

    // linkVisibility
    if (hasAnyPropChanged(['linkVisibility'])) {
        if (changedProps.linkVisibility) {
            // If the edge is no longer visible, delete its line, arrow, and photons
            graphEvents.edgeDroppedHandler(state, edge);
        } {
            // If the edge is now visible, create line, arrow, and photons
            graphEvents.edgeAddedHandler(state, edge);
        }
    }

    // If edge is visible, edge has a line and maybe an arrow or photons
    if (visibilityAccessor(edge)) {
        if (hasAnyPropChanged(['graph', 'linkThreeObject', 'linkThreeObjectExtend'])) {
            // Full reset of line object
            graphEvents.edgeDroppedHandler(state, edge);
            graphEvents.edgeAddedHandler(state, edge);
        } else {
            const line = edge.attributes.__lineObj;
    
            // Replace material
            if (hasAnyPropChanged(['linkAutoColorBy', 'linkColor', 'linkOpacity', 'linkMaterial'])) {
                line.material = threeObjs.createThreeEdgeMaterial(state, edge, line);
            }
    
            // Replace geometry
            if (hasAnyPropChanged(['linkWidth', 'linkResolution'])) {
                line.geometry = threeObjs.createThreeEdgeGeometry(state, edge, line);
            }
    
            // If there's an arrow, handle updates
            if (arrowLengthAccessor(edge)) {
                const arrow = edge.attributes.__arrowObj;
    
                // Replace material
                if (hasAnyPropChanged(['linkColor', 'linkDirectionalArrowColor', 'linkOpacity'])) {
                    arrow.material = threeObjs.createThreeArrowMaterial(state, edge, line);
                }
    
                // Replace geometry
                if (hasAnyPropChanged(['linkDirectionalArrowLength', 'linkDirectionalArrowResolution'])) {
                    arrow.geometry = threeObjs.createThreeArrowGeometry(state, edge, line);
                }
            }
    
            // If there's photons, handle updates
            if (linkDirectionalParticlesAccessor(edge)) {
                const photons = edge.attributes.__photonsObj;
    
                // Replace material
                if (hasAnyPropChanged(['linkDirectionalParticleColor', 'linkOpacity'])) {
                    photons.material = threeObjs.createThreePhotonsMaterial(state, edge, photons);
                }
    
                // Replace geometry
                if (hasAnyPropChanged(['linkDirectionalParticleWidth', 'linkDirectionalParticleResolution'])) {
                    photons.geometry = threeObjs.createThreePhotonsGeometry(state, edge, photons);
                }
    
                // This might not be necessary if the child photon material/geometry is still linked to the parent
                if (photons.children.length) {
                    photons.children.map((photon) => {
                        if (hasAnyPropChanged(['linkDirectionalParticleWidth', 'linkDirectionalParticleColor'])) {
                            photon.material = photons.material;
                        }
                        if (hasAnyPropChanged(['linkDirectionalParticleColor', 'linkOpacity'])) {
                            photon.geometry = photons.geometry;
                        }
                    });
                }
    
                // Update single hop photons
                if (edge.attributes.__singleHopPhotonsObj.children.length &&
                    hasAnyPropChanged([
                        'linkDirectionalParticleWidth', 
                        'linkDirectionalParticleColor',
                        'linkDirectionalParticleColor',
                        'linkOpacity',
                    ])
                ) {
                    edge.attributes.__singleHopPhotonsObj.children.map((photon) => {
                        photon.material = photons.material;
                        photon.geometry = photons.geometry;
                    });
                }
            }
        }
    }
}

export {
    refreshEdge,
    refreshNode,
}