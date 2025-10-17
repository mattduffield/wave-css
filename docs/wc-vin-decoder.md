# WC-VIN-Decoder Component Documentation

The `wc-vin-decoder` is a specialized web component that validates and decodes Vehicle Identification Numbers (VINs) using an external API, automatically populating vehicle information fields.

## Features

- Automatic VIN validation (17 characters)
- Real-time VIN decoding via API
- Vehicle type icon support (auto, motorcycle, duotone variants)
- Loading spinner during API calls
- Optional database lookup before API call
- Event broadcasting for form field population
- Error handling and validation
- Auto-uppercase conversion
- Required/disabled state styling

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import { WcVinDecoder } from './wc-vin-decoder.js';
```

## Basic Usage

```html
<wc-vin-decoder
  name="vehicle.vin"
  lbl-label="VIN"
  placeholder="Enter VIN..."
  api-url="https://vin-decoder-ligipcg4jq-uc.a.run.app/api/vin"
  vin-group="vehicle"
  required>
</wc-vin-decoder>
```

## Props & Attributes

### Core Attributes
- `name`: Input field name (required)
- `lbl-label`: Label text
- `lbl-class`: Custom label CSS classes
- `elt-class`: Custom element CSS classes
- `placeholder`: Placeholder text
- `value`: VIN value

### VIN Decoder Specific
- `api-url`: VIN decoder API endpoint (required)
- `vin-group`: Group identifier for broadcasting (default: "default")
- `database-endpoint`: Optional database lookup URL (checked before API)
- `vehicle-type`: Vehicle icon type - "auto", "motorcycle", "auto-dualtone", "motorcycle-dualtone"

### State Attributes
- `disabled`: Disables the input
- `readonly`: Makes the input read-only
- `required`: Makes the field required
- `autofocus`: Automatically focus the input

### Validation Attributes
- `tooltip`: Validation tooltip message
- `tooltip-position`: Tooltip position (top, bottom, left, right)

## Vehicle Type Icons

The component supports different vehicle icons:

```html
<!-- Standard auto icon (default) -->
<wc-vin-decoder
  name="vehicle.vin"
  lbl-label="VIN"
  vehicle-type="auto">
</wc-vin-decoder>

<!-- Motorcycle icon -->
<wc-vin-decoder
  name="vehicle.vin"
  lbl-label="VIN"
  vehicle-type="motorcycle">
</wc-vin-decoder>

<!-- Duotone auto icon -->
<wc-vin-decoder
  name="vehicle.vin"
  lbl-label="VIN"
  vehicle-type="auto-dualtone">
</wc-vin-decoder>

<!-- Duotone motorcycle icon -->
<wc-vin-decoder
  name="vehicle.vin"
  lbl-label="VIN"
  vehicle-type="motorcycle-dualtone">
</wc-vin-decoder>
```

## API Integration

### API Endpoint
The component expects a REST API that:
1. Accepts VIN as URL parameter: `{api-url}/{vin}`
2. Returns JSON response with vehicle data

### API Response Format
```json
{
  "success": true,
  "data": {
    "vin": "1C4RJFJT5JC136463",
    "make": "JEEP",
    "model": "Grand Cherokee",
    "year": "2018",
    "trim": "Summit",
    "series": "WK",
    "bodyClass": "Sport Utility Vehicle (SUV)",
    "doors": "4",
    "wheels": "4",
    "seats": "5",
    "vehicleType": "MULTIPURPOSE PASSENGER VEHICLE (MPV)",
    "engineCylinders": "8",
    "displacementCC": "5700.0",
    "displacementCI": "347.83534133997",
    "displacementL": "5.7",
    "transmissionStyle": "Automatic",
    "transmissionSpeeds": "8",
    "driveType": "4WD/4-Wheel Drive/4x4",
    "axles": "2",
    "fuelType": "Gasoline",
    "manufacturerName": "FCA US LLC",
    "engineManufacturer": "FCA",
    "plantCompanyName": "Jefferson North Assembly",
    "plantCountry": "UNITED STATES (USA)",
    "plantState": "MICHIGAN",
    "basePrice": "53995.00",
    "antilockBrakingSystem": "Standard",
    "brakeSystemType": "Hydraulic",
    "errorCode": "0",
    "errorText": "0 - VIN decoded clean",
    "msrp": "$30,895",
    "msrpSource": "Cars.com",
    "images": [
      "https://platform.cstatic-images.com/.../image1.png",
      "https://platform.cstatic-images.com/.../image2.png"
    ],
    "timestamp": "2025-10-16T19:30:53.123Z"
  }
}
```

## Event Broadcasting

The component broadcasts a `vin-decoder:change` event when VIN is successfully decoded:

```javascript
// Event detail structure
{
  vinGroup: "vehicle",  // From vin-group attribute
  data: {
    // All vehicle data from API response
    year: "2018",
    make: "JEEP",
    model: "Grand Cherokee",
    // ... etc
  }
}
```

## Usage with wc-vin-listener

Combine with `wc-vin-listener` to automatically populate form fields:

```html
<wc-vin-decoder
  name="vehicle.vin"
  lbl-label="VIN"
  api-url="https://vin-decoder-api.com/api/vin"
  vin-group="vehicle"
  required>
</wc-vin-decoder>

<wc-vin-listener vin-group="vehicle" array-fields="images">
  <wc-input name="vehicle.year" lbl-label="Year"></wc-input>
  <wc-input name="vehicle.make" lbl-label="Make"></wc-input>
  <wc-input name="vehicle.model" lbl-label="Model"></wc-input>
  <wc-input name="vehicle.msrp" lbl-label="MSRP" type="currency"></wc-input>
</wc-vin-listener>
```

## Database Lookup (Optional)

For performance, you can check a local database before calling the external API:

```html
<wc-vin-decoder
  name="vehicle.vin"
  lbl-label="VIN"
  api-url="https://vin-decoder-api.com/api/vin"
  database-endpoint="/api/vehicle/lookup"
  vin-group="vehicle">
</wc-vin-decoder>
```

The component will:
1. First check `database-endpoint` with VIN
2. If found, use cached data
3. If not found, call external `api-url`

## Error Handling

The component emits a `vin-decoder:error` event on failures:

```javascript
document.addEventListener('vin-decoder:error', (e) => {
  console.error('VIN decode failed:', e.detail.error);
});
```

## Styling

### Required Field Indicator
Required fields automatically display an asterisk:
```html
<wc-vin-decoder name="vehicle.vin" lbl-label="VIN" required>
  <!-- Label will show: VIN * -->
</wc-vin-decoder>
```

### Disabled State
```html
<wc-vin-decoder name="vehicle.vin" lbl-label="VIN" disabled>
</wc-vin-decoder>
```

### Loading Spinner
A FontAwesome spinner icon appears during API calls automatically.

## Complete Example

```html
<div class="col gap-2">
  <wc-vin-decoder
    name="vehicle.vin"
    lbl-label="Vehicle VIN"
    placeholder="Enter 17-character VIN..."
    api-url="https://vin-decoder-api.com/api/vin"
    database-endpoint="/api/vehicle/lookup"
    vin-group="vehicle"
    vehicle-type="auto-dualtone"
    tooltip="VIN must be exactly 17 characters"
    required>
  </wc-vin-decoder>

  <wc-vin-listener vin-group="vehicle" array-fields="images">
    <div class="row gap-2">
      <wc-input name="vehicle.year" lbl-label="Year" class="col" required></wc-input>
      <wc-input name="vehicle.make" lbl-label="Make" class="col" required></wc-input>
      <wc-input name="vehicle.model" lbl-label="Model" class="col" required></wc-input>
    </div>

    <div class="row gap-2">
      <wc-input name="vehicle.trim" lbl-label="Trim" class="col"></wc-input>
      <wc-input name="vehicle.msrp" lbl-label="MSRP" type="currency" class="col"></wc-input>
    </div>

    <div class="row gap-2">
      <wc-input name="vehicle.bodyClass" lbl-label="Body Class" class="col"></wc-input>
      <wc-input name="vehicle.doors" lbl-label="Doors" type="number" class="col"></wc-input>
      <wc-input name="vehicle.seats" lbl-label="Seats" type="number" class="col"></wc-input>
    </div>
  </wc-vin-listener>
</div>
```

## Best Practices

1. **Always use with wc-vin-listener**: Automatically populate fields instead of manual handling
2. **Implement database caching**: Use `database-endpoint` to reduce external API calls
3. **Set appropriate vin-group**: Use unique groups for multiple vehicles on same page
4. **Handle errors gracefully**: Listen for `vin-decoder:error` events
5. **Validate VIN format**: Component handles this, but backend should also validate

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Fetch API
- ES6+ JavaScript
- CSS Custom Properties
