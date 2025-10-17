# WC-Google-Address Component Documentation

The `wc-google-address` is a web component that provides Google Places Autocomplete functionality for address input, with automatic address parsing and form field population.

## Features

- Google Places Autocomplete integration
- Automatic address component parsing
- Street address, city, state, zip extraction
- Latitude/longitude capture
- Formatted address generation
- Zillow-compatible address slug generation
- URL-encoded address for linking
- Map integration support
- Customizable icon
- Event broadcasting for form field population
- Keyboard navigation support

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import { WcGoogleAddress } from './wc-google-address.js';
```

## Basic Usage

```html
<wc-google-address
  name="address.street"
  lbl-label="Street Address"
  api-key="YOUR_GOOGLE_API_KEY"
  address-group="address"
  placeholder="Start typing address..."
  required>
</wc-google-address>
```

## Props & Attributes

### Core Attributes
- `name`: Input field name (required)
- `lbl-label`: Label text
- `lbl-class`: Custom label CSS classes
- `elt-class`: Custom element CSS classes
- `placeholder`: Placeholder text
- `value`: Initial address value
- `api-key`: Google Maps API key (required)

### Google Places Specific
- `address-group`: Group identifier for broadcasting (default: "address")
- `countries`: Restrict to specific countries (e.g., "us" or "us,ca,mx")
- `types`: Place types to return (e.g., "address", "geocode", "establishment")
- `target-map`: ID of wc-google-map to update when address selected
- `icon-name`: FontAwesome icon name (default: "house")

### State Attributes
- `disabled`: Disables the input
- `readonly`: Makes the input read-only
- `required`: Makes the field required
- `autofocus`: Automatically focus the input

### Data Attributes (for pre-population)
- `data-lat`: Initial latitude
- `data-lng`: Initial longitude
- `data-address`: Initial formatted address

## Customizing the Icon

```html
<!-- Default house icon -->
<wc-google-address
  name="address.street"
  lbl-label="Street"
  api-key="YOUR_API_KEY">
</wc-google-address>

<!-- Mailbox icon for mailing address -->
<wc-google-address
  name="mailing_address.street"
  lbl-label="Mailing Address"
  api-key="YOUR_API_KEY"
  icon-name="mailbox">
</wc-google-address>

<!-- Location pin icon -->
<wc-google-address
  name="location.address"
  lbl-label="Location"
  api-key="YOUR_API_KEY"
  icon-name="location-dot">
</wc-google-address>
```

## Event Broadcasting

The component broadcasts a `google-address:change` event when an address is selected:

```javascript
// Event detail structure
{
  addressGroup: "address",
  street: "123 Main St",
  city: "San Francisco",
  state: "CA",
  postal_code: "94102",
  county: "San Francisco",
  country: "United States",
  lat: 37.7749,
  lng: -122.4194,
  formatted_address: "123 Main St, San Francisco, CA 94102, USA",
  formatted_address_encoded: "123%20Main%20St%2C%20San%20Francisco%2C%20CA%2094102%2C%20USA",
  formatted_address_slug: "123-Main-St-San-Francisco-CA-94102",
  place_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcA"
}
```

## Address Formats

### Formatted Address
Standard Google-formatted address:
```
123 Main St, San Francisco, CA 94102, USA
```

### URL-Encoded Address
For use in URL parameters:
```
123%20Main%20St%2C%20San%20Francisco%2C%20CA%2094102%2C%20USA
```

### Address Slug (Zillow-compatible)
Hyphen-separated format, country removed:
```
123-Main-St-San-Francisco-CA-94102
```

## Usage with wc-address-listener

Automatically populate address fields:

```html
<wc-google-address
  name="address.street"
  lbl-label="Street Address"
  api-key="YOUR_GOOGLE_API_KEY"
  address-group="address"
  required>
</wc-google-address>

<wc-address-listener address-group="address">
  <div class="row gap-2">
    <wc-input name="address.apt_suite" lbl-label="Apt/Suite" class="col"></wc-input>
    <wc-input name="address.city" lbl-label="City" class="col" required></wc-input>
    <wc-select name="address.state" lbl-label="State" class="col" required>
      <option value="">Choose...</option>
      <option value="CA">CA</option>
      <option value="NY">NY</option>
    </wc-select>
  </div>

  <div class="row gap-2">
    <wc-input name="address.postal_code" lbl-label="ZIP" class="col" required></wc-input>
    <wc-input name="address.county" lbl-label="County" class="col"></wc-input>
  </div>

  <!-- Hidden fields for additional data -->
  <input type="hidden" name="address.lat">
  <input type="hidden" name="address.lng">
  <input type="hidden" name="address.formatted_address">
  <input type="hidden" name="address.formatted_address_slug">
  <input type="hidden" name="address.place_id">
</wc-address-listener>
```

## Map Integration

Link to a Google Map component:

```html
<wc-google-address
  name="address.street"
  lbl-label="Street"
  api-key="YOUR_GOOGLE_API_KEY"
  address-group="address"
  target-map="address-map">
</wc-google-address>

<wc-google-map
  id="address-map"
  api-key="YOUR_GOOGLE_API_KEY"
  zoom="13"
  map-type="roadmap">
</wc-google-map>
```

The map will automatically update when an address is selected.

## External Links

### Google Maps Link
```html
<a target="_blank"
   href="https://www.google.com/maps/search/?api=1&query={{address.formatted_address_slug}}">
  <wc-fa-icon name="location-pin" size="1rem"></wc-fa-icon>
  View on Google Maps
</a>
```

### Zillow Link
```html
<a target="_blank"
   href="https://www.zillow.com/homes/{{address.formatted_address_slug}}">
  <wc-fa-icon name="house" size="1rem"></wc-fa-icon>
  View on Zillow
</a>
```

## Country Restrictions

Limit autocomplete to specific countries:

```html
<!-- US only -->
<wc-google-address
  name="address.street"
  lbl-label="Street"
  api-key="YOUR_API_KEY"
  countries="us">
</wc-google-address>

<!-- Multiple countries -->
<wc-google-address
  name="address.street"
  lbl-label="Street"
  api-key="YOUR_API_KEY"
  countries="us,ca,mx">
</wc-google-address>
```

## Place Types

Filter by place type:

```html
<!-- Addresses only (default) -->
<wc-google-address
  name="address.street"
  lbl-label="Street"
  api-key="YOUR_API_KEY"
  types="address">
</wc-google-address>

<!-- Any geocodable location -->
<wc-google-address
  name="location"
  lbl-label="Location"
  api-key="YOUR_API_KEY"
  types="geocode">
</wc-google-address>

<!-- Business establishments -->
<wc-google-address
  name="business"
  lbl-label="Business"
  api-key="YOUR_API_KEY"
  types="establishment">
</wc-google-address>
```

## Complete Example

```html
<form>
  <div class="row gap-2">
    <wc-google-address
      name="address.street"
      lbl-label="Street Address"
      class="col-1"
      api-key="AIzaSyDuWOTGr4N8FRsJ9r0MtEkXx-JFXgg_c48"
      address-group="address"
      target-map="address-map"
      countries="us"
      types="address"
      placeholder="Start typing address..."
      icon-name="house"
      required>
    </wc-google-address>

    <a class="flex justify-center items-center"
       target="_blank"
       href="https://www.google.com/maps/search/?api=1&query={{address.formatted_address_slug}}">
      <wc-fa-icon name="location-pin" size="1rem"></wc-fa-icon>
    </a>
  </div>

  <wc-address-listener address-group="address">
    <div class="row gap-2">
      <input type="hidden" name="address.lat">
      <input type="hidden" name="address.lng">
      <input type="hidden" name="address.formatted_address">
      <input type="hidden" name="address.formatted_address_slug">
      <input type="hidden" name="address.place_id">

      <wc-input name="address.apt_suite" lbl-label="Apt/Suite" class="col"></wc-input>
      <wc-input name="address.city" lbl-label="City" class="col" required></wc-input>
      <wc-select name="address.state" lbl-label="State" class="col" required>
        <option value="">Choose...</option>
        <option value="AL">AL</option>
        <option value="CA">CA</option>
        <!-- ... -->
      </wc-select>
    </div>

    <div class="row gap-2">
      <wc-input name="address.postal_code" lbl-label="ZIP" class="col" required></wc-input>
      <wc-input name="address.county" lbl-label="County" class="col"></wc-input>
    </div>
  </wc-address-listener>

  <wc-google-map
    id="address-map"
    api-key="AIzaSyDuWOTGr4N8FRsJ9r0MtEkXx-JFXgg_c48"
    zoom="13"
    map-type="roadmap">
  </wc-google-map>

  <button type="submit">Save Address</button>
</form>
```

## Keyboard Navigation

- **Arrow Down**: Highlight next suggestion
- **Arrow Up**: Highlight previous suggestion
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions dropdown

## Important Notes

### P.O. Boxes
Google Places Autocomplete has limited support for P.O. Box addresses. Users may need to manually enter P.O. Box addresses.

### Apartment/Suite Numbers
Google does not provide apartment or suite numbers. The `apt_suite` field must be entered manually by the user. The component intentionally does not clear this field when an address is selected.

## Best Practices

1. **Always use with wc-address-listener**: Automatically populate address fields
2. **Set appropriate country restrictions**: Improve autocomplete accuracy
3. **Include hidden fields**: Capture lat/lng and place_id for future use
4. **Don't clear apt_suite**: User must manually enter apartment/suite
5. **Link to maps**: Provide quick access to view address on Google Maps

## Troubleshooting

### Autocomplete not appearing?
- Check API key is valid
- Verify API key has Places API enabled in Google Cloud Console
- Check browser console for errors

### Map not updating?
- Verify `target-map` attribute matches map `id`
- Ensure map component exists on page
- Check that both components use same API key

### Fields not populating?
- Check `address-group` matches between address and listener components
- Verify field names in listener match expected patterns
- Check browser console for errors

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Fetch API
- ES6+ JavaScript
- Google Maps JavaScript API
- CSS Custom Properties
