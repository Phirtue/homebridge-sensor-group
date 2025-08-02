import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SensorGroupAccessory } from './platformAccessory';

interface SensorGroupConfig {
  groupName: string;
  sensorNames: string[];
}

export class SensorGroupPlatform implements DynamicPlatformPlugin {
  private readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig & { groups?: SensorGroupConfig[] },
    public readonly api: API,
  ) {
    this.api.on('didFinishLaunching', () => this.discoverAccessories());
  }

  discoverAccessories() {
    if (!this.config.groups) return;

    for (const group of this.config.groups) {
      const uuid = this.api.hap.uuid.generate(group.groupName);
      let accessory = this.accessories.find(acc => acc.UUID === uuid);

      if (!accessory) {
        this.log.info(`Adding new grouped sensor: ${group.groupName}`);
        accessory = new this.api.platformAccessory(group.groupName, uuid);
        new SensorGroupAccessory(this, accessory, group);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      } else {
        this.log.info(`Restoring existing grouped sensor: ${group.groupName}`);
        new SensorGroupAccessory(this, accessory, group);
      }
    }
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.accessories.push(accessory);
  }
}