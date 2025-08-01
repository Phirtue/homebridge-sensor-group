# homebridge-sensor-group

Virtual grouped contact sensor for Homebridge.
Supports both Homebridge v1.x and v2.x without compatibility warnings.

Combines multiple contact sensors (windows/doors) into a single virtual sensor:
- Reports open if any child is open
- Reports closed only when all children are closed

## Features
* Group sensors by display name (`childNames`) or by explicit UUID (`children`)
* UI configuration via correct schema so the Homebridge UI shows form fields
* Failsafe polling (configurable)
* Missing child sensors default the group to OPEN with a one-time log warning
