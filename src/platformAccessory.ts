import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SensorGroupPlatform } from './platform';

interface SensorGroupConfig {
  groupName: string;
  sensorNames: string[];
}

export class SensorGroupAccessory {
  private service: Service;
  private sensorStates: Record<string, boolean> = {};

  constructor(
    private readonly platform: SensorGroupPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly config: SensorGroupConfig,
  ) {
    const { Service, Characteristic } = this.platform.api.hap;

    this.accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'Custom')
      .setCharacteristic(Characteristic.Model, 'GroupedSensor');

    this.service = this.accessory.getService(Service.ContactSensor)
      || this.accessory.addService(Service.ContactSensor);

    this.service.setCharacteristic(Characteristic.Name, config.groupName);

    this.config.sensorNames.forEach(name => (this.sensorStates[name] = false));

    this.platform.api.on('publishExternalAccessories', () => this.subscribeToSensors());
    this.subscribeToSensors();
  }

  private subscribeToSensors() {
    const { Characteristic } = this.platform.api.hap;
    const allAccessories = this.platform.api.accessories || [];
    const sensors = allAccessories.filter(acc => this.config.sensorNames.includes(acc.displayName));

    sensors.forEach(sensor => {
      const service = sensor.getService(this.platform.api.hap.Service.ContactSensor);
      if (!service) return;

      const characteristic = service.getCharacteristic(Characteristic.ContactSensorState);

      characteristic.on('change', change => {
        const isOpen = change.newValue === Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
        this.sensorStates[sensor.displayName] = isOpen;
        this.updateGroupState();
      });

      const initialValue = characteristic.value as CharacteristicValue;
      this.sensorStates[sensor.displayName] =
        initialValue === Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    });

    this.updateGroupState();
  }

  private updateGroupState() {
    const { Characteristic } = this.platform.api.hap;
    const anyOpen = Object.values(this.sensorStates).some(open => open);

    this.service.updateCharacteristic(
      Characteristic.ContactSensorState,
      anyOpen
        ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
        : Characteristic.ContactSensorState.CONTACT_DETECTED,
    );

    this.platform.log.debug(`Group ${this.config.groupName} → ${anyOpen ? 'OPEN' : 'CLOSED'}`);
  }
}