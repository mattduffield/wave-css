# WC-VIN-Listener Component Documentation

The `wc-vin-listener` is a utility web component that automatically populates form fields when a VIN is decoded by the `wc-vin-decoder` component.

## Features

- Automatic field population from VIN decoder events
- Smart field name mapping
- Support for wrapper pattern or direct field pattern
- Automatic MSRP value transformation (removes $, commas)
- Dynamic array field creation (images, etc.)
- Support for all VIN decoder response fields
- Multiple listener groups on same page

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import { WcVinListener } from './wc-vin-listener.js';
```

## Basic Usage

### Wrapper Pattern (Recommended)
```html
<wc-vin-listener vin-group="vehicle">
  <wc-input name="vehicle.year" lbl-label="Year"></wc-input>
  <wc-input name="vehicle.make" lbl-label="Make"></wc-input>
  <wc-input name="vehicle.model" lbl-label="Model"></wc-input>
</wc-vin-listener>
```

### Direct Field Pattern
```html
<!-- Apply to individual fields -->
<wc-input name="vehicle.year" lbl-label="Year" vin-listener="vehicle"></wc-input>
<wc-input name="vehicle.make" lbl-label="Make" vin-listener="vehicle"></wc-input>
```

## Props & Attributes

### Core Attributes
- `vin-group`: VIN group identifier (must match wc-vin-decoder's vin-group)
- `array-fields`: Comma-separated list of array fields to create dynamically (e.g., "images" or "images,photos")

### Direct Field Attribute
- `vin-listener`: Add to individual wc-input/wc-select elements (alternative to wrapper pattern)

## Array Fields Support

### Dynamic Array Creation
The component can automatically create indexed hidden inputs for array fields without needing placeholder elements:

```html
<wc-vin-listener vin-group="vehicle" array-fields="images">
  <!-- Regular fields -->
  <wc-input name="vehicle.year" lbl-label="Year"></wc-input>
  <wc-input name="vehicle.make" lbl-label="Make"></wc-input>

  <!-- NO placeholder needed for images! -->
  <!-- Component will automatically create:
       vehicle.images.0, vehicle.images.1, etc. -->
</wc-vin-listener>
```

### Multiple Array Fields
```html
<wc-vin-listener vin-group="vehicle" array-fields="images,photos,documents">
  <!-- All specified arrays will be created dynamically -->
</wc-vin-listener>
```

### What Gets Created
When VIN decoder returns:
```json
{
  "images": [
    "https://example.com/image1.png",
    "https://example.com/image2.png",
    "https://example.com/image3.png"
  ]
}
```

The component automatically creates:
```html
<input type="hidden" name="vehicle.images.0" value="https://example.com/image1.png">
<input type="hidden" name="vehicle.images.1" value="https://example.com/image2.png">
<input type="hidden" name="vehicle.images.2" value="https://example.com/image3.png">
```

## Field Mapping

The component maps field names to VIN decoder response fields. All variations are supported:

### Vehicle Information
- `*.year`, `*.yr` → year
- `*.make`, `*.manufacturer` → make
- `*.model`, `*.mdl` → model
- `*.trim` → trim
- `*.series` → series
- `*.vin` → vin

### Body & Dimensions
- `*.bodyClass`, `*.body_class`, `*.bodyType` → bodyClass
- `*.doors` → doors
- `*.wheels` → wheels
- `*.seats` → seats
- `*.vehicleType`, `*.vehicle_type` → vehicleType

### Engine & Drivetrain
- `*.engineCylinders`, `*.cylinders` → engineCylinders
- `*.displacementCC`, `*.displacement_cc` → displacementCC
- `*.displacementCI`, `*.displacement_ci` → displacementCI
- `*.displacementL`, `*.displacement`, `*.displacement_l` → displacementL
- `*.transmissionStyle`, `*.transmission` → transmissionStyle
- `*.transmissionSpeeds`, `*.transmission_speeds` → transmissionSpeeds
- `*.driveType`, `*.drive_type`, `*.drivetrain` → driveType
- `*.axles` → axles
- `*.fuelType`, `*.fuel_type`, `*.fuel` → fuelType

### Brakes
- `*.brakeSystemType`, `*.brake_system_type`, `*.brakes` → brakeSystemType
- `*.antilockBrakingSystem`, `*.abs` → antilockBrakingSystem

### Pricing
- `*.msrp`, `*.price` → msrp (auto-strips $, commas)
- `*.basePrice`, `*.base_price` → basePrice (auto-strips $, commas)
- `*.msrpSource`, `*.msrp_source` → msrpSource

### Manufacturer
- `*.manufacturerName`, `*.manufacturer` → manufacturerName
- `*.engineManufacturer`, `*.engine_manufacturer` → engineManufacturer
- `*.plantCompanyName`, `*.plant` → plantCompanyName
- `*.plantCountry`, `*.plant_country` → plantCountry
- `*.plantState`, `*.plant_state` → plantState

### Metadata
- `*.errorCode`, `*.error_code` → errorCode
- `*.errorText`, `*.error_text`, `*.errorMessage` → errorText
- `*.images` → images (array)
- `*.timestamp` → timestamp

## Value Transformations

### MSRP/Price Fields
Automatically strips dollar signs, commas, and spaces:
```javascript
// API returns: "$30,895"
// Component sets: "30895" (clean number for input type="number")
```

### Array Fields
Creates indexed hidden inputs (see Array Fields Support above)

## Complete Example

```html
<form>
  <!-- VIN Decoder -->
  <wc-vin-decoder
    name="vehicle.vin"
    lbl-label="VIN"
    api-url="https://vin-decoder-api.com/api/vin"
    vin-group="vehicle"
    required>
  </wc-vin-decoder>

  <!-- VIN Listener with array support -->
  <wc-vin-listener vin-group="vehicle" array-fields="images">

    <!-- Basic Info -->
    <div class="row gap-2">
      <wc-input name="vehicle.year" lbl-label="Year" class="col" required></wc-input>
      <wc-input name="vehicle.make" lbl-label="Make" class="col" required></wc-input>
      <wc-input name="vehicle.model" lbl-label="Model" class="col" required></wc-input>
    </div>

    <!-- Detailed Info -->
    <div class="row gap-2">
      <wc-input name="vehicle.trim" lbl-label="Trim" class="col"></wc-input>
      <wc-input name="vehicle.series" lbl-label="Series" class="col"></wc-input>
      <wc-input name="vehicle.msrp" lbl-label="MSRP" type="currency" class="col"></wc-input>
    </div>

    <!-- Body -->
    <div class="row gap-2">
      <wc-input name="vehicle.bodyClass" lbl-label="Body Class" class="col"></wc-input>
      <wc-input name="vehicle.doors" lbl-label="Doors" type="number" class="col"></wc-input>
      <wc-input name="vehicle.seats" lbl-label="Seats" type="number" class="col"></wc-input>
    </div>

    <!-- Engine -->
    <div class="row gap-2">
      <wc-input name="vehicle.engineCylinders" lbl-label="Cylinders" type="number" class="col"></wc-input>
      <wc-input name="vehicle.displacementL" lbl-label="Displacement (L)" class="col"></wc-input>
      <wc-input name="vehicle.fuelType" lbl-label="Fuel Type" class="col"></wc-input>
    </div>

    <!-- Transmission -->
    <div class="row gap-2">
      <wc-input name="vehicle.transmissionStyle" lbl-label="Transmission" class="col"></wc-input>
      <wc-input name="vehicle.transmissionSpeeds" lbl-label="Speeds" type="number" class="col"></wc-input>
      <wc-input name="vehicle.driveType" lbl-label="Drive Type" class="col"></wc-input>
    </div>

    <!-- Brakes -->
    <div class="row gap-2">
      <wc-input name="vehicle.brakeSystemType" lbl-label="Brake System" class="col"></wc-input>
      <wc-input name="vehicle.antilockBrakingSystem" lbl-label="ABS" class="col"></wc-input>
    </div>

    <!-- Images array will be created automatically as:
         vehicle.images.0, vehicle.images.1, etc. -->
  </wc-vin-listener>

  <button type="submit">Save Vehicle</button>
</form>
```

## Hidden Fields Pattern

For fields you want saved but not displayed:

```html
<wc-vin-listener vin-group="vehicle" array-fields="images">
  <!-- Visible fields -->
  <wc-input name="vehicle.year" lbl-label="Year"></wc-input>

  <!-- Hidden fields -->
  <input type="hidden" name="vehicle.manufacturerName">
  <input type="hidden" name="vehicle.plantCountry">
  <input type="hidden" name="vehicle.timestamp">

  <!-- Array fields created automatically (no placeholder needed) -->
</wc-vin-listener>
```

## Multiple Vehicles on Same Page

Use different `vin-group` values:

```html
<!-- Vehicle 1 -->
<wc-vin-decoder name="vehicle1.vin" vin-group="vehicle1"></wc-vin-decoder>
<wc-vin-listener vin-group="vehicle1" array-fields="images">
  <wc-input name="vehicle1.year" lbl-label="Year"></wc-input>
  <wc-input name="vehicle1.make" lbl-label="Make"></wc-input>
</wc-vin-listener>

<!-- Vehicle 2 -->
<wc-vin-decoder name="vehicle2.vin" vin-group="vehicle2"></wc-vin-decoder>
<wc-vin-listener vin-group="vehicle2" array-fields="images">
  <wc-input name="vehicle2.year" lbl-label="Year"></wc-input>
  <wc-input name="vehicle2.make" lbl-label="Make"></wc-input>
</wc-vin-listener>
```

## Form Submission

When the form is submitted, all fields (including dynamically created array fields) are included:

```
POST /api/vehicle
{
  "vehicle": {
    "vin": "1C4RJFJT5JC136463",
    "year": "2018",
    "make": "JEEP",
    "model": "Grand Cherokee",
    "msrp": "30895",  // Note: cleaned number
    "images": [       // Backend receives as array
      "https://example.com/image1.png",
      "https://example.com/image2.png",
      "https://example.com/image3.png"
    ]
  }
}
```

## How It Works

1. **VIN Decoder fires event**: When VIN is decoded, `wc-vin-decoder` broadcasts `vin-decoder:change` event
2. **Listener catches event**: `wc-vin-listener` listens for events matching its `vin-group`
3. **Field matching**: Component finds all form fields and matches their names to VIN data
4. **Value transformation**: Applies transformations (MSRP cleaning, etc.)
5. **Array creation**: Dynamically creates indexed inputs for array fields
6. **Update fields**: Sets values on all matched fields
7. **Trigger change events**: Fires change events so other listeners can react

## Best Practices

1. **Always match vin-group**: Ensure `vin-group` matches between decoder and listener
2. **Use array-fields attribute**: Explicitly declare which fields are arrays
3. **Name fields consistently**: Use dot notation (e.g., `vehicle.year`, `vehicle.make`)
4. **Hide unnecessary fields**: Use `type="hidden"` for fields user shouldn't edit
5. **Validate on backend**: Always validate VIN data on the server

## Troubleshooting

### Fields not updating?
- Check `vin-group` matches between decoder and listener
- Verify field names match mapping (see Field Mapping section)
- Check browser console for errors

### Array fields not created?
- Ensure `array-fields` attribute is set
- Verify field name is in the comma-separated list
- Check that API is returning an array for that field

### MSRP showing with $ and commas?
- Change input to `type="number"` or `type="currency"`
- Component automatically strips formatting for number inputs

## Browser Support

Requires browsers that support:
- Custom Elements v1
- ES6+ JavaScript
- DOM APIs (querySelector, addEventListener)
