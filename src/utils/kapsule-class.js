// (ForceGraph, Group, true)
export default function(kapsule, baseClass = Object, initKapsuleWithSelf = false) {

  class FromKapsule extends baseClass {
    constructor(...args) {
      console.log("running constructor");
      super(...args);
      console.log("setting __kapsuleInstance");
      this.__kapsuleInstance = kapsule()(...[...(initKapsuleWithSelf ? [this] : []), ...args]);
      // this.__kapsuleInstance.removeGraphListeners();
      console.log("nodeAdded listeners:", this.__kapsuleInstance.graph().listeners("nodeAdded").length);
      console.log("edgeAdded listeners:", this.__kapsuleInstance.graph().listeners("edgeAdded").length);
      console.log("__kapsuleInstance set.");
    }
  }

  // attach kapsule props/methods to class prototype
  console.log("attaching props/methods to class prototype");
  Object.keys(kapsule())
    .forEach(m => FromKapsule.prototype[m] = function(...args) {
      console.log("executing attached prop/method:", m);
      const returnVal = this.__kapsuleInstance[m](...args);
      return returnVal === this.__kapsuleInstance
        ? this  // chain based on this class, not the kapsule obj
        : returnVal;
    });
  console.log("props/methods attached");

  return FromKapsule;

}
