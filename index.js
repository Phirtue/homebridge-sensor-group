// homebridge-sensor-group (index.js)
// A Homebridge dynamic platform plugin to create grouped contact sensors

let Service, Characteristic, apiGlobal;

class SensorGroupPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config || {};
    this.api = api;
    this.accessories = {};

    apiGlobal = api; // global ref for uuid

    this.api.on('didFinishLaunching', () => {
      // v2: getAccessories() | v1: accessories || []
      this.allAccessories = this.api.getAccessories ? this.api.getAccessories() : (this.api.accessories || []);
      (this.config.groups || []).forEach((group) => this.setupGroup(group));
    });
  }

  configureAccessory(accessory) {
    this.accessories[accessory.UUID] = accessory;
  }

  // Find UUIDs for child names
  _resolveChildUUIDs(groupCfg) {
    let uuids = [];
    if (Array.isArray(groupCfg.childNames)) {
      const wanted = groupCfg.childNames.map((n) => n.toLowerCase().trim());
      this.allAccessories.forEach((acc) => {
        const svc = acc.getService && acc.getService(Service.ContactSensor);
        if (svc && wanted.includes(acc.displayName.toLowerCase().trim())) {
          uuids.push(acc.UUID);
        }
      });
    }
    return [...new Set(uuids)];
  }

  setupGroup(groupCfg) {
    if (!groupCfg || !groupCfg.name) return;
    const childUUIDs = this._resolveChildUUIDs(groupCfg);
    if (!childUUIDs.length) return;

    const uuid = this.api.hap.uuid.generate(`sensor-group:${groupCfg.name}`);
    let accessory = this.accessories[uuid];

    if (!accessory) {
      accessory = new this.api.platformAccessory(groupCfg.name, uuid);
      accessory.addService(Service.ContactSensor, groupCfg.name);
      this.api.registerPlatformAccessories('homebridge-sensor-group', 'SensorGroup', [accessory]);
      this.accessories[uuid] = accessory;
    }
    accessory.context.groupCfg = { ...groupCfg, children: childUUIDs };

    // Update state on child change (listen for changes)
    childUUIDs.forEach((id) => {
      const child = this.api.getAccessoryByUUID(id);
      if (!child) return;
      child.getService(Service.ContactSensor)
           .getCharacteristic(Characteristic.ContactSensorState)
           .on('change', () => this.updateGroupState(accessory));
    });

    this.updateGroupState(accessory);
  }

  // Update grouped state: open if any child open, closed only if all closed
  updateGroupState(groupAcc) {
    const { children } = groupAcc.context.groupCfg;
    const anyOpen = children.some((id) => {
      const child = this.api.getAccessoryByUUID(id);
      if (!child) return true;
      const v = child.getService(Service.ContactSensor)
                     .getCharacteristic(Characteristic.ContactSensorState).value;
      return v === Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    });
    const svc = groupAcc.getService(Service.ContactSensor);
    const desired = anyOpen ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
                            : Characteristic.ContactSensorState.CONTACT_DETECTED;
    svc.updateCharacteristic(Characteristic.ContactSensorState, desired);
  }
}

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform('homebridge-sensor-group', 'SensorGroup', SensorGroupPlatform, true);
};
