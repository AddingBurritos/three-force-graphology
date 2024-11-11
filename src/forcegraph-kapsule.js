import {
  Mesh,
  BufferGeometry,
  BufferAttribute,
  Matrix4,
  Vector3,
  CylinderGeometry,
  TubeGeometry,
  QuadraticBezierCurve3,
  CubicBezierCurve3,
  Box3,
  Group,
  AmbientLight,
  DirectionalLight
} from 'three';

import createlayout from 'graphology.forcelayout';
import MultiDirectedGraph from 'graphology';
import * as graphEvents from './utils/graph-events.js';

import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';

import { min as d3Min, max as d3Max } from 'd3-array';

import { emptyObject } from './utils/three-gc.js';
import { refreshEdge, refreshNode } from './utils/graph-refresh.js';
import { createBaseThreePhotons, createThreePhotonsGeometry, createThreePhotonsMaterial } from './utils/three-objs.js';


import ThreeRenderObjects from 'three-render-objects';
import { DragControls as ThreeDragControls } from 'three/examples/jsm/controls/DragControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import linkKapsule from './utils/kapsule-link.js';

// support multiple method names for backwards threejs compatibility
const setAttributeFn = new BufferGeometry().setAttribute ? 'setAttribute' : 'addAttribute';
const applyMatrix4Fn = new BufferGeometry().applyMatrix4 ? 'applyMatrix4' : 'applyMatrix';

let stats;
const CAMERA_DISTANCE2NODES_FACTOR = 170;

// Expose config from renderObjs
const bindRenderObjs = linkKapsule('renderObjs', ThreeRenderObjects);
const linkedRenderObjsProps = Object.assign(...[
  'width',
  'height',
  'backgroundColor',
  'showNavInfo',
  'enablePointerInteraction'
].map(p => ({ [p]: bindRenderObjs.linkProp(p)})));
const linkedRenderObjsMethods = Object.assign(
  ...[
    'lights',
    'cameraPosition',
    'postProcessingComposer'
  ].map(p => ({ [p]: bindRenderObjs.linkMethod(p)})),
  {
    graph2ScreenCoords: bindRenderObjs.linkMethod('getScreenCoords'),
    screen2GraphCoords: bindRenderObjs.linkMethod('getSceneCoords')
  }
);

export default Kapsule({

  props: {
    jsonUrl: {
      onChange: function(jsonUrl, state) {
        if (jsonUrl && !state.fetchingJson) {
          // Load data asynchronously
          state.fetchingJson = true;
          state.onLoading(state);

          fetch(jsonUrl).then(r => r.json()).then(json => {
            state.fetchingJson = false;
            state.onFinishLoading(state);
            this.graph.from(json);
          });
        }
      },
      triggerUpdate: false
    },
    graph: {
      default: () => new MultiDirectedGraph(),
      onChange(graph, state, prevGraph) {
        if (!state.initialised) return; // Ensure init has run before proceeding

        state.engineRunning = false; // Pause simulation immediately
        
        if (prevGraph) {
          this.removeGraphListeners();
        }

        this.setGraphListeners();

        // TODO: delete old layout
        if (state.layout) {
          state.layout.dispose();
        }
        delete state.layout;

        // Create forcelayout once
        state.layout = createlayout(graph, { dimensions: state.numDimensions, ...state.ngraphPhysics });

        state._flushObjects = true;
      }
    },
    numDimensions: {
      default: 3,
      onChange(numDim, state) {
        if (state.layout) {
          state.layout.setDimensions(numDim);
        }
      }
    },
    nodeRelSize: { default: 4 }, // volume per val unit
    nodeId: { default: 'id' },
    nodeVal: { default: 'val' },
    nodeResolution: { default: 8 }, // how many slice segments in the sphere's circumference
    nodeColor: { default: 'color' },
    nodeAutoColorBy: {},
    nodeOpacity: { default: 0.75 },
    nodeVisibility: { default: true },
    nodeThreeObject: {},
    nodeThreeObjectExtend: { default: false },
    nodePositionUpdate: { triggerUpdate: false }, // custom function to call for updating the node's position. Signature: (threeObj, { x, y, z}, node). If the function returns a truthy value, the regular node position update will not run.
    linkSource: { default: 'source' },
    linkTarget: { default: 'target' },
    linkVisibility: { default: true },
    linkColor: { default: 'color' },
    linkAutoColorBy: {},
    linkOpacity: { default: 0.2 },
    linkWidth: {}, // Rounded to nearest decimal. For falsy values use dimensionless line with 1px regardless of distance.
    linkResolution: { default: 6 }, // how many radial segments in each line tube's geometry
    linkCurvature: { default: 0, triggerUpdate: false }, // line curvature radius (0: straight, 1: semi-circle)
    linkCurveRotation: { default: 0, triggerUpdate: false }, // line curve rotation along the line axis (0: interection with XY plane, PI: upside down)
    linkMaterial: {},
    linkThreeObject: {},
    linkThreeObjectExtend: { default: false },
    linkPositionUpdate: { triggerUpdate: false }, // custom function to call for updating the link's position. Signature: (threeObj, { start: { x, y, z},  end: { x, y, z }}, link). If the function returns a truthy value, the regular link position update will not run.
    linkDirectionalArrowLength: { default: 0 },
    linkDirectionalArrowColor: {},
    linkDirectionalArrowRelPos: { default: 0.5, triggerUpdate: false }, // value between 0<>1 indicating the relative pos along the (exposed) line
    linkDirectionalArrowResolution: { default: 8 }, // how many slice segments in the arrow's conic circumference
    linkDirectionalParticles: { default: 0 }, // animate photons travelling in the link direction
    linkDirectionalParticleSpeed: { default: 0.01, triggerUpdate: false }, // in link length ratio per frame
    linkDirectionalParticleWidth: { default: 0.5 },
    linkDirectionalParticleColor: {},
    linkDirectionalParticleResolution: { default: 4 }, // how many slice segments in the particle sphere's circumference
    forceEngine: { default: 'graphology' },
    ngraphPhysics: { default: {
      // defaults from https://github.com/anvaka/ngraph.physics.simulator/blob/master/index.js
      timeStep: 20,
      gravity: -1.2,
      theta: 0.8,
      springLength: 30,
      springCoefficient: 0.0008,
      dragCoefficient: 0.02
    }},
    warmupTicks: { default: 0, triggerUpdate: false }, // how many times to tick the force engine at init before starting to render
    cooldownTicks: { default: Infinity, triggerUpdate: false },
    cooldownTime: { default: 15000, triggerUpdate: false }, // ms
    onLoading: { default: (state) => state.infoElem.textContent = 'Loading...', triggerUpdate: false },
    onFinishLoading: { default: (state) => state.infoElem.textContent = '', triggerUpdate: false },
    onUpdate: { 
      default: (state) => {
        const camera = state.renderObjs.camera();

        // re-aim camera, if still in default position (not user modified)
        if (camera.position.x === 0 && camera.position.y === 0 && camera.position.z === state.lastSetCameraZ && state.graph.order) {
          camera.lookAt(state.graphScene.position);
          state.lastSetCameraZ = camera.position.z = Math.cbrt(state.graph.order) * CAMERA_DISTANCE2NODES_FACTOR;
        }
      }, 
      triggerUpdate: false 
    },
    onFinishUpdate: { 
      default: (state) => {
        // Setup node drag interaction
        if (state._dragControls) {
          const curNodeDrag = state.graph.findNode((node, attrs) => attrs.__initialFixedPos && !attrs.__disposeControlsAfterDrag); // detect if there's a node being dragged using the existing drag controls
          if (curNodeDrag) {
            state.graph.setNodeAttribute(curNodeDrag, "__disposeControlsAfterDrag", true); // postpone previous controls disposal until drag ends
          } else {
            state._dragControls.dispose(); // cancel previous drag controls
          }
  
          state._dragControls = undefined;
        }
  
        if (state.enableNodeDrag && state.enablePointerInteraction && state.forceEngine === 'd3') { // Can't access node positions programmatically in ngraph
          const camera = state.renderObjs.camera();
          const renderer = state.renderObjs.renderer();
          const controls = state.renderObjs.controls();
          const dragControls = state._dragControls = new ThreeDragControls(
            state.graph.mapNodes((node, attrs) => attrs.__threeObj).filter(obj => obj),
            camera,
            renderer.domElement
          );
  
          dragControls.addEventListener('dragstart', function (event) {
            controls.enabled = false; // Disable controls while dragging
  
            // track drag object movement
            event.object.__initialPos = event.object.position.clone();
            event.object.__prevPos = event.object.position.clone();
  
            const node = getGraphObj(event.object).__data;
            !node.__initialFixedPos && (node.__initialFixedPos = {fx: node.fx, fy: node.fy, fz: node.fz});
            !node.__initialPos && (node.__initialPos = {x: node.x, y: node.y, z: node.z});
  
            // lock node
            ['x', 'y', 'z'].forEach(c => node[`f${c}`] = node[c]);
  
            // drag cursor
            renderer.domElement.classList.add('grabbable');
          });
  
          dragControls.addEventListener('drag', function (event) {
            const nodeObj = getGraphObj(event.object);
  
            if (!event.object.hasOwnProperty('__graphObjType')) {
              // If dragging a child of the node, update the node object instead
              const initPos = event.object.__initialPos;
              const prevPos = event.object.__prevPos;
              const newPos = event.object.position;
  
              nodeObj.position.add(newPos.clone().sub(prevPos)); // translate node object by the motion delta
              prevPos.copy(newPos);
              newPos.copy(initPos); // reset child back to its initial position
            }
  
            const node = nodeObj.__data;
            const newPos = nodeObj.position;
            const translate = {x: newPos.x - node.x, y: newPos.y - node.y, z: newPos.z - node.z};
            // Move fx/fy/fz (and x/y/z) of nodes based on object new position
            ['x', 'y', 'z'].forEach(c => node[`f${c}`] = node[c] = newPos[c]);
  
            this.resetCountdown();  // prevent freeze while dragging
  
            node.__dragged = true;
            state.onNodeDrag(node, translate);
          });
  
          dragControls.addEventListener('dragend', function (event) {
            delete(event.object.__initialPos); // remove tracking attributes
            delete(event.object.__prevPos);
  
            const node = {key: getGraphObj(event.object).__key, attributes: getGraphObj(event.object).__data};
  
            // dispose previous controls if needed
            if (node.attributes.__disposeControlsAfterDrag) {
              dragControls.dispose();
              state.graph.removeNodeAttribute(node.key, "__disposeControlsAfterDrag");
            }
  
            const initFixedPos = node.attributes.__initialFixedPos;
            const initPos = node.attributes.__initialPos;
            const translate = {x: initPos.x - node.attributes.x, y: initPos.y - node.attributes.y, z: initPos.z - node.attributes.z};
            if (initFixedPos) {
              ['x', 'y', 'z'].forEach(c => {
                const fc = `f${c}`;
                if (initFixedPos[fc] === undefined) {
                  delete(node.attributes[fc])
                }
              });
              delete(node.attributes.__initialFixedPos);
              delete(node.attributes.__initialPos);
              if (node.attributes.__dragged) {
                delete(node.attributes.__dragged);
                state.onNodeDragEnd(node, translate);
              }
            }
  
            this.resetCountdown();  // let the engine readjust after releasing fixed nodes
  
            if (state.enableNavigationControls) {
              controls.enabled = true; // Re-enable controls
              controls.domElement && controls.domElement.ownerDocument && controls.domElement.ownerDocument.dispatchEvent(
                // simulate mouseup to ensure the controls don't take over after dragend
                new PointerEvent('pointerup', { pointerType: 'touch' })
              );
            }
  
            // clear cursor
            renderer.domElement.classList.remove('grabbable');
          });
        }
      }, 
      triggerUpdate: false 
    },
    onEngineTick: { default: () => {}, triggerUpdate: false },
    onEngineStop: { default: () => {}, triggerUpdate: false },

    // NEW BELOW
    nodeLabel: { default: 'name', triggerUpdate: false },
    linkLabel: { default: 'name', triggerUpdate: false },
    linkHoverPrecision: { 
      default: 1, 
      onChange: (p, state) => state.renderObjs.lineHoverPrecision(p), 
      triggerUpdate: false },
    enableNavigationControls: {
      default: true,
      onChange(enable, state) {
        const controls = state.renderObjs.controls();
        if (controls) {
          controls.enabled = enable;
          // trigger mouseup on re-enable to prevent sticky controls
          enable && controls.domElement && controls.domElement.dispatchEvent(new PointerEvent('pointerup'));
        }
      },
      triggerUpdate: false
    },
    enableNodeDrag: { default: true, triggerUpdate: false },
    onNodeDrag: { default: () => {}, triggerUpdate: false },
    onNodeDragEnd: { default: () => {}, triggerUpdate: false },
    onNodeClick: { triggerUpdate: false },
    onNodeRightClick: { triggerUpdate: false },
    onNodeHover: { triggerUpdate: false },
    onLinkClick: { triggerUpdate: false },
    onLinkRightClick: { triggerUpdate: false },
    onLinkHover: { triggerUpdate: false },
    onBackgroundClick: { triggerUpdate: false },
    onBackgroundRightClick: { triggerUpdate: false },
    ...linkedRenderObjsProps
  },

  methods: {
    nodeAdded: function(state, node) {
      graphEvents.nodeAddedHandler(state, node);
      return this;
    },
    edgeAdded: function(state, edge) {
      graphEvents.edgeAddedHandler(state, edge);
      return this;
    },
    nodeAttributesUpdated: function(state, attrUpdate) {
      graphEvents.nodeAttributesUpdatedHandler(state, attrUpdate);
      return this;
    },
    edgeAttributesUpdated: function(state, attrUpdate) {
      graphEvents.edgeAttributesUpdatedHandler(state, attrUpdate);
      return this;
    },
    nodeDropped: function(state, node) {
      graphEvents.nodeDroppedHandler(state, node);
      return this;
    },
    edgeDropped: function(state, edge) {
      graphEvents.edgeDroppedHandler(state, edge);
      return this;
    },
    cleared: function(state) {
      graphEvents.clearHandler(state);
      return this;
    },
    refresh: function(state) {
      state._flushObjects = true;
      state._rerender();
      return this;
    },
    // reset cooldown state
    resetCountdown: function(state) {
      state.cntTicks = 0;
      state.startTickTime = new Date();
      state.engineRunning = true;
      return this;
    },
    tickFrame: function(state) {

      if (state.engineRunning) { layoutTick(); }
      updateArrows();
      updatePhotons();

      return this;

      //

      function layoutTick() {
        if (
          ++state.cntTicks > state.cooldownTicks ||
          (new Date()) - state.startTickTime > state.cooldownTime
        ) {
          state.engineRunning = false; // Stop ticking graph
          state.onEngineStop();
        } else {
          state.layout.step(); // Tick it
          state.onEngineTick();
        }

        const nodeThreeObjectExtendAccessor = accessorFn(state.nodeThreeObjectExtend);

        // Update nodes position
        state.graph.forEachNode((key, attributes) => {
          const node = { key, attributes };
          const obj = node.attributes.__threeObj;
          if (!obj) return;

          const pos = state.layout.getNodePosition(node.key);

          const extendedObj = nodeThreeObjectExtendAccessor(node);
          if (!state.nodePositionUpdate
            || !state.nodePositionUpdate(extendedObj ? obj.children[0] : obj, { x: pos.x, y: pos.y, z: pos.z }, node) // pass child custom object if extending the default
            || extendedObj) {
            obj.position.x = pos.x;
            obj.position.y = pos.y || 0;
            obj.position.z = pos.z || 0;
          }
        });

        // Update links position
        const linkWidthAccessor = accessorFn(state.linkWidth);
        const linkCurvatureAccessor = accessorFn(state.linkCurvature);
        const linkCurveRotationAccessor = accessorFn(state.linkCurveRotation);
        const linkThreeObjectExtendAccessor = accessorFn(state.linkThreeObjectExtend);
        state.graph.forEachEdge((key, attributes) => {
          const edge = { key, attributes };
          const lineObj = edge.attributes.__lineObj;
          if (!lineObj) return;

          const pos = state.layout.getEdgePosition(edge.key);
          const start = pos.from;
          const end = pos.to;

          if (!start || !end || !start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          calcLinkCurve(edge); // calculate link curve for all links, including custom replaced, so it can be used in directional functionality

          const extendedObj = linkThreeObjectExtendAccessor(edge);
          if (state.linkPositionUpdate && state.linkPositionUpdate(
              extendedObj ? lineObj.children[1] : lineObj, // pass child custom object if extending the default
              { start: { x: start.x, y: start.y, z: start.z }, end: { x: end.x, y: end.y, z: end.z } },
              edge)
          && !extendedObj) {
            // exit if successfully custom updated position of non-extended obj
            return;
          }

          const curveResolution = 30; // # line segments
          const curve = edge.attributes.__curve;

          // select default line obj if it's an extended group
          const line = lineObj.children.length ? lineObj.children[0] : lineObj;

          if (line.type === 'Line') { // Update line geometry
            if (!curve) { // straight line
              let linePos = line.geometry.getAttribute('position');
              if (!linePos || !linePos.array || linePos.array.length !== 6) {
                line.geometry[setAttributeFn]('position', linePos = new BufferAttribute(new Float32Array(2 * 3), 3));
              }

              linePos.array[0] = start.x;
              linePos.array[1] = start.y || 0;
              linePos.array[2] = start.z || 0;
              linePos.array[3] = end.x;
              linePos.array[4] = end.y || 0;
              linePos.array[5] = end.z || 0;

              linePos.needsUpdate = true;

            } else { // bezier curve line
              line.geometry.setFromPoints(curve.getPoints(curveResolution));
            }
            line.geometry.computeBoundingSphere();

          } else if (line.type === 'Mesh') { // Update cylinder geometry

            if (!curve) { // straight tube
              if (!line.geometry.type.match(/^Cylinder(Buffer)?Geometry$/)) {
                const linkWidth = Math.ceil(linkWidthAccessor(edge) * 10) / 10;
                const r = linkWidth / 2;

                const geometry = new CylinderGeometry(r, r, 1, state.linkResolution, 1, false);
                geometry[applyMatrix4Fn](new Matrix4().makeTranslation(0, 1 / 2, 0));
                geometry[applyMatrix4Fn](new Matrix4().makeRotationX(Math.PI / 2));

                line.geometry.dispose();
                line.geometry = geometry;
              }

              const vStart = new Vector3(start.x, start.y || 0, start.z || 0);
              const vEnd = new Vector3(end.x, end.y || 0, end.z || 0);
              const distance = vStart.distanceTo(vEnd);

              line.position.x = vStart.x;
              line.position.y = vStart.y;
              line.position.z = vStart.z;

              line.scale.z = distance;

              line.parent.localToWorld(vEnd); // lookAt requires world coords
              line.lookAt(vEnd);
            } else { // curved tube
              if (!line.geometry.type.match(/^Tube(Buffer)?Geometry$/)) {
                // reset object positioning
                line.position.set(0, 0, 0);
                line.rotation.set(0, 0, 0);
                line.scale.set(1, 1, 1);
              }

              const linkWidth = Math.ceil(linkWidthAccessor(edge) * 10) / 10;
              const r = linkWidth / 2;

              const geometry = new TubeGeometry(curve, curveResolution, r, state.linkResolution, false);

              line.geometry.dispose();
              line.geometry = geometry;
            }
          }
        });

        //

        function calcLinkCurve(edge) {
          const pos = state.layout.getEdgePosition(edge.key);
          const start = pos['from'];
          const end = pos['to'];

          if (!start || !end || !start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          const curvature = linkCurvatureAccessor(edge);

          if (!curvature) {
            edge.attributes.__curve = null; // Straight line

          } else { // bezier curve line (only for line types)
            const vStart = new Vector3(start.x, start.y || 0, start.z || 0);
            const vEnd= new Vector3(end.x, end.y || 0, end.z || 0);

            const l = vStart.distanceTo(vEnd); // line length

            let curve;
            const curveRotation = linkCurveRotationAccessor(edge);

            if (l > 0) {
              const dx = end.x - start.x;
              const dy = end.y - start.y || 0;

              const vLine = new Vector3()
                .subVectors(vEnd, vStart);

              const cp = vLine.clone()
                .multiplyScalar(curvature)
                .cross((dx !== 0 || dy !== 0) ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0)) // avoid cross-product of parallel vectors (prefer Z, fallback to Y)
                .applyAxisAngle(vLine.normalize(), curveRotation) // rotate along line axis according to linkCurveRotation
                .add((new Vector3()).addVectors(vStart, vEnd).divideScalar(2));

              curve = new QuadraticBezierCurve3(vStart, cp, vEnd);
            } else { // Same point, draw a loop
              const d = curvature * 70;
              const endAngle = -curveRotation; // Rotate clockwise (from Z angle perspective)
              const startAngle = endAngle + Math.PI / 2;

              curve = new CubicBezierCurve3(
                vStart,
                new Vector3(d * Math.cos(startAngle), d * Math.sin(startAngle), 0).add(vStart),
                new Vector3(d * Math.cos(endAngle), d * Math.sin(endAngle), 0).add(vStart),
                vEnd
              );
            }

            edge.attributes.__curve = curve;
          }
        }
      }

      function updateArrows() {
        // update link arrow position
        const arrowRelPosAccessor = accessorFn(state.linkDirectionalArrowRelPos);
        const arrowLengthAccessor = accessorFn(state.linkDirectionalArrowLength);
        const nodeValAccessor = accessorFn(state.nodeVal);

        state.graph.forEachEdge((key, attributes) => {
          const edge = {key, attributes};
          const arrowObj = edge.attributes.__arrowObj;
          if (!arrowObj) return;

          const pos = state.layout.getEdgePosition(edge.key);
          const startNode = {key: pos['from'], attributes: state.graph.getNodeAttributes(pos['from'])};
          const endNode = {key: pos['to'], attributes: state.graph.getNodeAttributes(pos['to'])};

          // TODO: check if node.attributes should have 'x' property. Where is the position really stored?
          if (!startNode.key || !endNode || !startNode.attributes.hasOwnProperty('x') || !endNode.attributes.hasOwnProperty('x')) return; // skip invalid link

          const startR = Math.cbrt(Math.max(0, nodeValAccessor(startNode) || 1)) * state.nodeRelSize;
          const endR = Math.cbrt(Math.max(0, nodeValAccessor(endNode) || 1)) * state.nodeRelSize;

          const arrowLength = arrowLengthAccessor(edge);
          const arrowRelPos = arrowRelPosAccessor(edge);

          const getPosAlongLine = edge.attributes.__curve
            ? t => edge.attributes.__curve.getPoint(t) // interpolate along bezier curve
            : t => {
            // straight line: interpolate linearly
            const iplt = (dim, start, end, t) => start[dim] + (end[dim] - start[dim]) * t || 0;
            return {
              x: iplt('x', startNodeAttrs, endNodeAttrs, t),
              y: iplt('y', startNodeAttrs, endNodeAttrs, t),
              z: iplt('z', startNodeAttrs, endNodeAttrs, t)
            }
          };

          const lineLen = edge.attributes.__curve
            ? edge.attributes.__curve.getLength()
            : Math.sqrt(['x', 'y', 'z'].map(dim => Math.pow((endNode.attributes[dim] || 0) - (startNode.attributes[dim] || 0), 2)).reduce((acc, v) => acc + v, 0));

          const posAlongLine = startR + arrowLength + (lineLen - startR - endR - arrowLength) * arrowRelPos;

          const arrowHead = getPosAlongLine(posAlongLine / lineLen);
          const arrowTail = getPosAlongLine((posAlongLine - arrowLength) / lineLen);

          ['x', 'y', 'z'].forEach(dim => arrowObj.position[dim] = arrowTail[dim]);

          const headVec = new Vector3(...['x', 'y', 'z'].map(c => arrowHead[c]));
          arrowObj.parent.localToWorld(headVec); // lookAt requires world coords
          arrowObj.lookAt(headVec);
        });
      }

      function updatePhotons() {
        // update link particle positions
        const particleSpeedAccessor = accessorFn(state.linkDirectionalParticleSpeed);
        state.graph.forEachEdge((key, attributes) => {
          const edge = { key, attributes };
          const cyclePhotons = edge.attributes.__photonsObj && edge.attributes.__photonsObj.children;
          const singleHopPhotons = edge.attributes.__singleHopPhotonsObj && edge.attributes.__singleHopPhotonsObj.children;

          if ((!singleHopPhotons || !singleHopPhotons.length) && (!cyclePhotons || !cyclePhotons.length)) return;

          const pos = state.layout.getEdgePosition(edge.key);
          const start = pos['from'];
          const end = pos['to'];

          if (!start || !end || !start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          const particleSpeed = particleSpeedAccessor(edge);

          const getPhotonPos = edge.attributes.__curve
            ? t => edge.attributes.__curve.getPoint(t) // interpolate along bezier curve
            : t => {
              // straight line: interpolate linearly
              const iplt = (dim, start, end, t) => start[dim] + (end[dim] - start[dim]) * t || 0;
              return {
                x: iplt('x', start, end, t),
                y: iplt('y', start, end, t),
                z: iplt('z', start, end, t)
              }
            };

          const photons = [...(cyclePhotons || []), ...(singleHopPhotons || []),];

          photons.forEach((photon, idx) => {
            const singleHop = photon.parent.__linkThreeObjType === 'singleHopPhotons';

            if (!photon.hasOwnProperty('__progressRatio')) {
              photon.__progressRatio = singleHop ? 0 : (idx / cyclePhotons.length);
            }

            photon.__progressRatio += particleSpeed;

            if (photon.__progressRatio >=1) {
              if (!singleHop) {
                photon.__progressRatio = photon.__progressRatio % 1;
              } else {
                // remove particle
                photon.parent.remove(photon);
                emptyObject(photon);
                return;
              }
            }

            const photonPosRatio = photon.__progressRatio;

            const pos = getPhotonPos(photonPosRatio);
            ['x', 'y', 'z'].forEach(dim => photon.position[dim] = pos[dim]);
          });
        });
      }
    },
    emitParticle: function(state, edge) {
      if (edge.key && state.graph.hasEdge(edge.key)) {
        const singleHopPhotons = createBaseThreePhotons();
        singleHopPhotons.geometry = createThreePhotonsGeometry(state, edge, singleHopPhotons);
        singleHopPhotons.material = createThreePhotonsMaterial(state, edge, singleHopPhotons);
        singleHopPhotons.__linkThreeObjType = 'singleHopPhotons';
        singleHopPhotons.__data = edge.attributes;
        singleHopPhotons.__key = edge.key;
        singleHopPhotons.add(new Mesh(singleHopPhotons.geometry, singleHopPhotons.material));
        edge.attributes.__singleHopPhotonsObj = singleHopPhotons;
        state.graphScene.add(singleHopPhotons);
      }

      return this;
    },
    getGraphBbox: function(state, nodeFilter = () => true) {
      if (!state.initialised) return null;

      // recursively collect all nested geometries bboxes
      const bboxes = (function getBboxes(obj) {
        const bboxes = [];

        if (obj.geometry) {
          obj.geometry.computeBoundingBox();
          const box = new Box3();
          box.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
          bboxes.push(box);
        }
        return bboxes.concat(...(obj.children || [])
          .filter(obj => !obj.hasOwnProperty('__graphObjType') ||
            (obj.__graphObjType === 'node' && nodeFilter(obj.__key, obj.__data)) // exclude filtered out nodes
          )
          .map(getBboxes));
      })(state.graphScene);

      if (!bboxes.length) return null;

      // extract global x,y,z min/max
      return Object.assign(...['x', 'y', 'z'].map(c => ({
        [c]: [
          d3Min(bboxes, bb => bb.min[c]),
          d3Max(bboxes, bb => bb.max[c])
        ]
      })));
    },
    setGraphListeners: function(state) {
      console.log("Setting forcegraph-kapsule graph listeners...");
      const listenersMap = {
        "nodeAdded": this.nodeAdded,
        "edgeAdded": this.edgeAdded,
        "nodeAttributesUpdated": this.nodeAttributesUpdated,
        "edgeAttributesUpdated": this.edgeAttributesUpdated,
        "nodeDropped": this.nodeDropped,
        "edgeDropped": this.edgeDropped,
        "cleared": this.cleared
      }
      Object.entries(listenersMap).forEach(([eventName, listener]) => {
        state.graph.on(eventName, listener);
      });
      console.log("Number of nodeAdded listeners: ", state.graph.listeners("nodeAdded").length);
    },
    removeGraphListeners: function(state) {
      console.log("Removing forcegraph-kapsule graph listeners...");
      const listenersMap = {
        "nodeAdded": this.nodeAdded,
        "edgeAdded": this.edgeAdded,
        "nodeAttributesUpdated": this.nodeAttributesUpdated,
        "edgeAttributesUpdated": this.edgeAttributesUpdated,
        "nodeDropped": this.nodeDropped,
        "edgeDropped": this.edgeDropped,
        "cleared": this.cleared
      }
      Object.entries(listenersMap).forEach(([eventName, listener]) => {
        state.graph.removeAllListeners(eventName);
      });
      console.log("Number of nodeAdded listeners: ", state.graph.listeners("nodeAdded").length);
    },
    // New Below
    zoomToFit: function(state, transitionDuration, padding, ...bboxArgs) {
      state.renderObjs.fitToBbox(
        this.getGraphBbox(...bboxArgs),
        transitionDuration,
        padding
      );
      return this;
    },
    pauseAnimation: function(state) {
      if (state.animationFrameRequestId !== null) {
        cancelAnimationFrame(state.animationFrameRequestId);
        state.animationFrameRequestId = null;
      }
      return this;
    },
    resumeAnimation: function(state) {
      if (state.animationFrameRequestId === null) {
        this._animationCycle();
      }
      return this;
    },
    _animationCycle(state) {
      stats.update();
      if (state.enablePointerInteraction) {
        // reset canvas cursor (override dragControls cursor)
        this.renderer().domElement.style.cursor = null;
      }
  
      // Frame cycle
      this.tickFrame();
      state.renderObjs.tick();
      state.animationFrameRequestId = requestAnimationFrame(this._animationCycle);
    },
    scene: state => state.renderObjs.scene(), // Expose scene
    camera: state => state.renderObjs.camera(), // Expose camera
    renderer: state => state.renderObjs.renderer(), // Expose renderer
    controls: state => state.renderObjs.controls(), // Expose controls
    _destructor: function() {
      this.pauseAnimation();
      this.graph(new MultiDirectedGraph());
    },
    ...linkedRenderObjsMethods
  },

  stateInit: ({ controlType, rendererConfig, extraRenderers, useWebGPU }) => ({
    engineRunning: false,
    sphereGeometries: {}, // indexed by nodeVal and nodeResolution
    sphereMaterials: {}, // indexed by color and nodeOpacity
    cylinderGeometries: {}, // indexed by linkWidth and linkResolution
    lambertLineMaterials: {}, // indexed by color and linkOpacity
    basicLineMaterials: {}, // indexed by color and linkOpacity
    particleGeometries: {}, // indexed by particleWidth
    particleMaterials: {}, // indexed by linkColor
    controlType,
    rendererConfig,
    extraRenderers,
    renderObjs: ThreeRenderObjects({ controlType, rendererConfig, extraRenderers, useWebGPU })
    .lights([
      new AmbientLight(0xcccccc, Math.PI),
      new DirectionalLight(0xffffff, 0.6 * Math.PI)
    ]),
    infoElem: document.createElement('div')
  }),

  init(domNode, state) {
    state.graph = state.graph();
    // Main three object to manipulate
    state.graphScene = new Group();
    state.renderObjs.objects([state.graphScene]);
    
    this.setGraphListeners();

    // Create forcelayout once
    state.layout = createlayout(state.graph, { dimensions: state.numDimensions, ...state.ngraphPhysics });

    // ---New Below---

    // Wipe DOM
    domNode.innerHTML = '';

    // Add relative container
    domNode.appendChild(state.container = document.createElement('div'));
    state.container.style.position = 'relative';

    // Add renderObjs
    const roDomNode = document.createElement('div');
    state.container.appendChild(roDomNode);
    state.renderObjs(roDomNode);
    const camera = state.renderObjs.camera();
    const renderer = state.renderObjs.renderer();
    const controls = state.renderObjs.controls();
    controls.enabled = !!state.enableNavigationControls;
    state.lastSetCameraZ = camera.position.z;

    // Add info space
    state.container.appendChild(state.infoElem);
    state.infoElem.className = 'graph-info-msg';
    state.infoElem.textContent = '';

    // Add stats
    stats = new Stats();
    document.body.appendChild(stats.domElement);
    
    state.renderObjs
      .hoverOrderComparator((a, b) => {
        // Prioritize graph objects
        const aObj = getGraphObj(a);
        if (!aObj) return 1;
        const bObj = getGraphObj(b);
        if (!bObj) return -1;

        // Prioritize nodes over links
        const isNode = o => o.__graphObjType === 'node';
        return isNode(bObj) - isNode(aObj);
      })
      .tooltipContent(obj => {
        const graphObj = getGraphObj(obj);
        return graphObj ? accessorFn(state[`${graphObj.__graphObjType}Label`])(graphObj.__data) || '' : '';
      })
      .hoverDuringDrag(false)
      .onHover(obj => {
        // Update tooltip and trigger onHover events
        const hoverObj = getGraphObj(obj);

        if (hoverObj !== state.hoverObj) {
          const prevObjType = state.hoverObj ? state.hoverObj.__graphObjType : null;
          const prevObjData = state.hoverObj ? state.hoverObj.__data : null;
          const objType = hoverObj ? hoverObj.__graphObjType : null;
          const objData = hoverObj ? hoverObj.__data : null;
          if (prevObjType && prevObjType !== objType) {
            // Hover out
            const fn = state[`on${prevObjType === 'node' ? 'Node' : 'Link'}Hover`];
            fn && fn(null, prevObjData);
          }
          if (objType) {
            // Hover in
            const fn = state[`on${objType === 'node' ? 'Node' : 'Link'}Hover`];
            fn && fn(objData, prevObjType === objType ? prevObjData : null);
          }

          // set pointer if hovered object is clickable
          renderer.domElement.classList[
            ((hoverObj && state[`on${objType === 'node' ? 'Node' : 'Link'}Click`]) || (!hoverObj && state.onBackgroundClick)) ? 'add' : 'remove'
          ]('clickable');

          state.hoverObj = hoverObj;
        }
      })
      .clickAfterDrag(false)
      .onClick((obj, ev) => {
        const graphObj = getGraphObj(obj);
        if (graphObj) {
          const fn = state[`on${graphObj.__graphObjType === 'node' ? 'Node' : 'Link'}Click`];
          fn && fn(graphObj.__data, ev);
        } else {
          state.onBackgroundClick && state.onBackgroundClick(ev);
        }
      })
      .onRightClick((obj, ev) => {
        // Handle right-click events
        const graphObj = getGraphObj(obj);
        if (graphObj) {
          const fn = state[`on${graphObj.__graphObjType === 'node' ? 'Node' : 'Link'}RightClick`];
          fn && fn(graphObj.__data, ev);
        } else {
          state.onBackgroundRightClick && state.onBackgroundRightClick(ev);
        }
      });
      
    // Kick-off renderer
    this._animationCycle();
  },

  update(state, changedProps) {
    state.engineRunning = false; // pause simulation
    state.onUpdate(state);

    const hasAnyPropChanged = propList => propList.some(p => changedProps.hasOwnProperty(p));

    state.graph.forEachNode((key, attributes) => {
      refreshNode(state, changedProps, {key, attributes});
    });
    state.graph.forEachEdge((key, attributes, source, target, srcAttrs, tgtAttrs, directed) => {
      refreshEdge(state, changedProps, {key, attributes, source, target, directed});
    });

    if (state._flushObjects) {
      state.sphereGeometries = {};
      state.sphereMaterials = {};
      state.cylinderGeometries = {};
      state.lambertLineMaterials = {};
      state.basicLineMaterials = {};
      state.particleGeometries = {}; 
      state.particleMaterials = {};
    }

    state._flushObjects = false; // reset objects refresh flag

    // simulation engine
    if (hasAnyPropChanged([
      'graph',
      'nodeId',
      'linkSource',
      'linkTarget',
      'numDimensions',
      'forceEngine'
    ])) {
      state.engineRunning = false; // Pause simulation

      for (let i = 0; i < state.warmupTicks; i++) {
        if (state.layout.step()) break; // layout['step']()???
      } // Initial ticks before starting to render

      this.resetCountdown();
    }

    state.engineRunning = true; // resume simulation

    state.onFinishUpdate(state);
  }
});

function getGraphObj(object) {
  let obj = object;
  // recurse up object chain until finding the graph object
  while (obj && !obj.hasOwnProperty('__graphObjType')) {
    obj = obj.parent;
  }
  return obj;
}
