import { colorStr2Hex, colorAlpha } from './color-utils.js';
import accessorFn from 'accessor-fn';
import {
    Group,
    Mesh,
    MeshLambertMaterial,
    Color,
    BufferGeometry,
    BufferAttribute,
    Matrix4,
    SphereGeometry,
    CylinderGeometry,
    ConeGeometry,
    Line,
    LineBasicMaterial,
} from 'three';
import { getAutoColor } from './color-utils.js';

// TODO: Write function to create threeObjs then apply it to node creation and node attribute changed
function createBaseThreeNode(state, node) {
    // ...Create scene object
    const customObjectAccessor = accessorFn(state.nodeThreeObject);
    const customObjectExtendAccessor = accessorFn(state.nodeThreeObjectExtend);
    let customObj = customObjectAccessor(node);
    const extendObj = customObjectExtendAccessor(node);

    if (customObj && state.nodeThreeObject === customObj) {
        // clone object if it's a shared object among all nodes
        customObj = customObj.clone();
    }

    let obj;

    if (customObj && !extendObj) { // Use custom object
        obj = customObj;
        obj.__graphDefaultObj = false;
    } else { // Add default object (sphere mesh)
        obj = new Mesh();
        obj.__graphDefaultObj = true;

        if (customObj && extendObj) {
            obj.add(customObj); // extend default with custom
        }
    }

    obj.__graphObjType = 'node'; // Add object type
    return obj
}

function createBaseThreeEdge(state, edge) {
    const customObjectAccessor = accessorFn(state.linkThreeObject);
    const customObjectExtendAccessor = accessorFn(state.linkThreeObjectExtend);
    let customObj = customObjectAccessor(edge);
    const extendObj = customObjectExtendAccessor(edge);

    if (customObj && state.linkThreeObject === customObj) {
        // clone object if it's a shared object among all links
        customObj = customObj.clone();
    }

    let defaultObj;
    if (!customObj || extendObj) {
        // construct default line obj
        const widthAccessor = accessorFn(state.linkWidth);
        const useCylinder = !!widthAccessor(edge);

        if (useCylinder) {
            defaultObj = new Mesh();
        } else { // Use plain line (constant width)
            const lineGeometry = new BufferGeometry();
            lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(2 * 3), 3));

            defaultObj = new Line(lineGeometry);
        }
    }

    let line;
    if (!customObj) {
        line = defaultObj;
        line.__graphDefaultObj = true;
    } else {
        if (!extendObj) {
            // use custom object
            line = customObj;
            line.__graphDefaultObj = false;
        } else {
            // extend default with custom in a group
            line = new Group();
            line.__graphDefaultObj = true;

            line.add(defaultObj);
            line.add(customObj);
        }
    }

    line.renderOrder = 10; // Prevent visual glitches of dark lines on top of nodes by rendering them last

    line.__graphObjType = 'link'; // Add object type

    return line;
}

function createBaseThreeArrow() {
    const arrow = new Mesh();
    arrow.__linkThreeObjType = 'arrow'; // Add object type

    return arrow;
}

function createBaseThreePhotons() {
    const photons = new Group();
    photons.__linkThreeObjType = 'photons'; // Add object type

    return photons;
}

function createThreeNodeGeometry(state, node, obj) {
    // Build geometry
    const valAccessor = accessorFn(state.nodeVal);
    const val = valAccessor(node) || 1;
    const radius = Math.cbrt(val) * state.nodeRelSize;
    const numSegments = state.nodeResolution;

    let geometry = obj.geometry;

    if (!obj.geometry.type.match(/^Sphere(Buffer)?Geometry$/)
        || obj.geometry.parameters.radius !== radius
        || obj.geometry.parameters.widthSegments !== numSegments
    ) {
        if (!state.sphereGeometries.hasOwnProperty(val)) {
            state.sphereGeometries[val] = {};
        }
        if (!state.sphereGeometries[val].hasOwnProperty(numSegments)) {
            state.sphereGeometries[val][numSegments] = new SphereGeometry(radius, numSegments, numSegments);
        }

        geometry = state.sphereGeometries[val][numSegments];
    }
    return geometry;
}

function createThreeEdgeGeometry(state, edge, line) {
    const widthAccessor = accessorFn(state.linkWidth);
    const linkWidth = Math.ceil(widthAccessor(edge) * 10) / 10;
    const useCylinder = !!linkWidth;

    let geometry = line.geometry;
    if (useCylinder) {
        const radius = linkWidth / 2;
        const numSegments = state.linkResolution;

        if (!line.geometry.type.match(/^Cylinder(Buffer)?Geometry$/)
            || line.geometry.parameters.radiusTop !== radius
            || line.geometry.parameters.radialSegments !== numSegments
        ) {
            if (!state.cylinderGeometries.hasOwnProperty(linkWidth)) {
                state.cylinderGeometries[linkWidth] = {}
            }
            if (!state.cylinderGeometries[linkWidth].hasOwnProperty(numSegments)) {
                const geometry = new CylinderGeometry(radius, radius, 1, numSegments, 1, false);
                geometry.applyMatrix4(new Matrix4().makeTranslation(0, 1 / 2, 0));
                geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));
                state.cylinderGeometries[linkWidth][numSegments] = geometry;
            }

            geometry = state.cylinderGeometries[linkWidth][numSegments];
        }
    }
    return geometry;
}

function createThreeArrowGeometry(state, edge, arrow) {
    const arrowLengthAccessor = accessorFn(state.linkDirectionalArrowLength);
    const arrowLength = arrowLengthAccessor(edge);
    const numSegments = state.linkDirectionalArrowResolution;

    let geometry = arrow.geometry;

    if (!arrow.geometry.type.match(/^Cone(Buffer)?Geometry$/)
      || arrow.geometry.parameters.height !== arrowLength
      || arrow.geometry.parameters.radialSegments !== numSegments
    ) {
      const coneGeometry = new ConeGeometry(arrowLength * 0.25, arrowLength, numSegments);
      // Correct orientation
      coneGeometry.translate(0, arrowLength / 2, 0);
      coneGeometry.rotateX(Math.PI / 2);

      geometry = coneGeometry;
    }
    return geometry;
}

function createThreePhotonsGeometry(state, edge, photons) {
    const particleWidthAccessor = accessorFn(state.linkDirectionalParticleWidth);

    const curPhoton = !!photons.children.length && photons.children[0];

    const photonR = Math.ceil(particleWidthAccessor(edge) * 10) / 10 / 2;
    const numSegments = state.linkDirectionalParticleResolution;

    let geometry = photons.geometry;
    if (curPhoton
      && curPhoton.geometry.parameters.radius === photonR
      && curPhoton.geometry.parameters.widthSegments === numSegments) {
      geometry = curPhoton.geometry;
    } else {
      if (!state.particleGeometries.hasOwnProperty(photonR)) {
        state.particleGeometries[photonR] = {};
        if (!state.particleGeometries[photonR][numSegments]) {
            state.particleGeometries[photonR][numSegments] = new SphereGeometry(photonR, numSegments, numSegments);
        }
      }
      geometry = state.particleGeometries[photonR][numSegments];
    }
    return geometry;
}

function createThreeNodeMaterial(state, node, obj) {
    // Build material

    // Set node auto color
    const colorAccessor = accessorFn(state.nodeColor);
    let color = colorAccessor(node);
    if (!color) {
        const nodeAutoColorAccessor = accessorFn(state.nodeAutoColorBy);
        const nodeAutoColorVal = nodeAutoColorAccessor(node);
        color = getAutoColor(nodeAutoColorVal);
        // state.graph.setNodeAttribute(node.key, state.nodeColor, autoColor);
    }
    const materialColor = new Color(colorStr2Hex(color || '#ffffaa'));
    const opacity = state.nodeOpacity * colorAlpha(color);

    let material = obj.material;

    if (obj.material.type !== 'MeshLambertMaterial'
        || !obj.material.color.equals(materialColor)
        || obj.material.opacity !== opacity
    ) {
        if (!state.sphereMaterials.hasOwnProperty(color)) {
            state.sphereMaterials[color] = {};
            if (!state.sphereMaterials[color].hasOwnProperty(state.nodeOpacity)) {
                state.sphereMaterials[color][state.nodeOpacity] = new MeshLambertMaterial({
                    color: materialColor,
                    transparent: true,
                    opacity
                });
            }
        }
        material = state.sphereMaterials[color][state.nodeOpacity];
    }
    return material;
}

function createThreeEdgeMaterial(state, edge, line) {
    // Build material
    let material = line.material;
    const customMaterialAccessor = accessorFn(state.linkMaterial);
    const customMaterial = customMaterialAccessor(edge);
    if (customMaterial) {
        material = customMaterial;
    } else {
        const colorAccessor = accessorFn(state.linkColor);
        let color = colorAccessor(edge);
        if (!color) {
            const linkAutoColorAccessor = accessorFn(state.linkAutoColorBy);
            const linkAutoColorVal = linkAutoColorAccessor(edge);
            color = getAutoColor(linkAutoColorVal);
        }
        const materialColor = new Color(colorStr2Hex(color || '#f0f0f0'));
        const opacity = state.linkOpacity * colorAlpha(color);
        
        const widthAccessor = accessorFn(state.linkWidth);
        const edgeWidth = Math.ceil(widthAccessor(edge) * 10) / 10;
        const useCylinder = !!edgeWidth;

        const materialType = useCylinder ? 'MeshLambertMaterial' : 'LineBasicMaterial';
        const materialConstructors = {
            "MeshLambertMaterial": MeshLambertMaterial,
            "LineBasicMaterial": LineBasicMaterial
        }
        if (line.material.type !== materialType
            || !line.material.color.equals(materialColor)
            || line.material.opacity !== opacity
        ) {
            const lineMaterials = useCylinder ? state.lambertLineMaterials : state.basicLineMaterials;
            if (!lineMaterials.hasOwnProperty(color)) {
                lineMaterials[color] = {};
            }
            if (!lineMaterials[color].hasOwnProperty(state.linkOpacity)) {
                lineMaterials[color][state.linkOpacity] = new materialConstructors[materialType]({
                    color: materialColor,
                    transparent: opacity < 1,
                    opacity,
                    depthWrite: opacity >= 1 // Prevent transparency issues
                });
            }
            material = lineMaterials[color][state.linkOpacity];
        }
    }
    return material;
}

function createThreeArrowMaterial(state, edge, arrow) {
    let material = arrow.material;
    if (!material || material.type != "MeshLambertMaterial") {
        material = new MeshLambertMaterial({ transparent: true });
    }
    const colorAccessor = accessorFn(state.linkColor);
    const arrowColorAccessor = accessorFn(state.linkDirectionalArrowColor);
    const arrowColor = arrowColorAccessor(edge) || colorAccessor(edge) || '#f0f0f0';
    const materialColor = new Color(colorStr2Hex(arrowColor));
    const opacity = state.linkOpacity * 3 * colorAlpha(arrowColor);
    if (materialColor != material.color) {
        material.color = materialColor;
    }
    if (opacity != material.opacity) {
        material.opacity = opacity;
    }
    return material;
}

function createThreePhotonsMaterial(state, edge, photons) {
    const particleColorAccessor = accessorFn(state.linkDirectionalParticleColor);
    const photonColor = particleColorAccessor(edge) || colorAccessor(edge) || '#f0f0f0';
    const materialColor = new Color(colorStr2Hex(photonColor));
    const opacity = state.linkOpacity * 3;
    
    const curPhoton = !!photons.children.length && photons.children[0];

    let material = photons.material;
    if (curPhoton
      && curPhoton.material.color.equals(materialColor)
      && curPhoton.material.opacity === opacity
    ) {
      material = curPhoton.material;
    } else {
      if (!state.particleMaterials.hasOwnProperty(photonColor)) {
        state.particleMaterials[photonColor] = {}
        if (!state.particleMaterials[photonColor][state.linkOpacity]) {
            state.particleMaterials[photonColor][state.linkOpacity] = new MeshLambertMaterial({
              color: materialColor,
              transparent: true,
              opacity
            });
        }
      }
      material = state.particleMaterials[photonColor][state.linkOpacity];
    }
    return material;
}

function completeThreeNode(state, node) {
    // ...create an object in the scene
    const obj = createBaseThreeNode(state, node);
    obj.__data = node.attributes; // Bind node data to scene obj
    obj.__key = node.key;
    // state.graph.setNodeAttribute(node.key, "__threeObj", obj); // Bind scene obj to node
    state.graphScene.add(obj); // Add obj to scene
    if (obj.__graphDefaultObj) { // TODO: Put this in createBaseThreeObj?
        obj.geometry = createThreeNodeGeometry(state, node, obj);
        obj.material = createThreeNodeMaterial(state, node, obj);
    }
    return obj;
}

function completeThreeEdge(state, edge) {
    const line = createBaseThreeEdge(state, edge);
    line.__data = edge.attributes;
    line.__key = edge.key;
    // state.graph.setEdgeAttribute(edge.key, "__lineObj", line);
    state.graphScene.add(line);
    if (line.__graphDefaultObj) {
        line.geometry = createThreeEdgeGeometry(state, edge, line);
        line.material = createThreeEdgeMaterial(state, edge, line);
    }
    return line;
}

function completeThreeArrow(state, edge) {
    const arrow = createBaseThreeArrow();
    arrow.__data = edge.attributes;
    arrow.__key = edge.key;
    // state.graph.setEdgeAttribute(edge.key, "__arrowObj", arrow);
    state.graphScene.add(arrow);
    arrow.geometry = createThreeArrowGeometry(state, edge, arrow);
    arrow.material = createThreeArrowMaterial(state, edge, arrow);
    return arrow;
}

function completeThreePhotons(state, edge) {
    const photons = createBaseThreePhotons();
    photons.__data = edge.attributes;
    photons.__key = edge.key;
    // state.graph.setEdgeAttribute(edge.key, "__photonsObj", photons);
    state.graphScene.add(photons);
    photons.geometry = createThreePhotonsGeometry(state, edge, photons);
    photons.material= createThreePhotonsMaterial(state, edge, photons);

    // Create each particle
    const particlesAccessor = accessorFn(state.linkDirectionalParticles);
    const numPhotons = Math.round(Math.abs(particlesAccessor(edge)));

    photons.children = [... new Array(numPhotons)].map((_, idx) => {
        const particle = new Mesh(photons.geometry, photons.material);
        particle.__data = {idx, __obj: particle};
        particle.__key = edge.key;
        return particle;
    });

    return photons;
}

export {
    createBaseThreeNode,
    createBaseThreeEdge,
    createBaseThreeArrow,
    createBaseThreePhotons,
    createThreeNodeGeometry,
    createThreeEdgeGeometry,
    createThreeArrowGeometry,
    createThreePhotonsGeometry,
    createThreeNodeMaterial,
    createThreeEdgeMaterial,
    createThreeArrowMaterial,
    createThreePhotonsMaterial,
    completeThreeNode,
    completeThreeEdge,
    completeThreeArrow,
    completeThreePhotons,
}