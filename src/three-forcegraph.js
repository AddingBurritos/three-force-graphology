import { Group } from 'three';

import ForceGraph from './forcegraph-kapsule.js';
import fromKapsule from './utils/kapsule-class.js';

export default fromKapsule(ForceGraph, Group, true);
