import { scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';
import tinyColor from 'tinycolor2';

const colorStr2Hex = str => isNaN(str) ? parseInt(tinyColor(str).toHex(), 16) : str;
const colorAlpha = str => isNaN(str) ? tinyColor(str).getAlpha(): 1;

const autoColorScale = scaleOrdinal(schemePaired);

// Autoset attribute colorField by colorByAccessor property
// If an object has already a color, don't set it
// Objects can be nodes or links
function autoColorObjects(attributes, colorByAccessor, colorField) {
  if (!colorByAccessor || typeof colorField !== 'string') return;

  attributes.filter(obj => !obj[colorField]).forEach(obj => {
    obj[colorField] = autoColorScale(colorByAccessor(obj));
  });
}

function autoColorNodes(graph, colorByAccessor, colorField) {
  if (!colorByAccessor || typeof colorField !== 'string') return;

  graph.forEachNode( (node, attrs) => {
    if (attrs[colorField]) return;
    graph.setNodeAttribute(node, colorField, autoColorScale(colorByAccessor(attrs)));
  })
}

function getAutoColor(val) {
  return autoColorScale(val);
}

function autoColorEdges(graph, colorByAccessor, colorField) {
  if (!colorByAccessor || typeof colorField !== 'string') return;

  graph.forEachEdge( (edge, attrs, src, dst, srcAttrs, dstAttrs, isUndirected) => {
    if (attrs[colorField]) return;
    graph.setEdgeAttribute(edge, colorField, autoColorScale(colorByAccessor(attrs)));
  }); 
}

export { autoColorObjects, colorStr2Hex, colorAlpha, autoColorNodes, autoColorEdges, getAutoColor };
