# homebridge-sensor-group

This Homebridge plugin creates a **virtual grouped contact sensor** that combines multiple physical sensors into a single state. If **any** window/door is open, the grouped sensor shows **OPEN**, otherwise **CLOSED**.

## Features
- Event-driven: Instant updates when any sensor changes
- Supports multiple groups
- Works with HomeKit automations (e.g., turn off HVAC/thermostat if any window is open, turn on HVAC/thermostat if all windows are closed.)

## Installation
```bash
npm install -g homebridge-sensor-group
```

## Example Config
```json
{
  "platform": "SensorGroup",
  "groups": [
    {
      "groupName": "All Windows",
      "sensorNames": ["Kitchen Window", "Dining Room Window"]
    }
  ]
}
```

Restart Homebridge, and you’ll see a virtual contact sensor in HomeKit for each group.
