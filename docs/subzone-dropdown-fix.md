# Sub-Zone Dropdown Fix

## Problem
Sub-zones were not appearing in the dropdown despite the API returning correct data with sub-zones. The logs showed:

1. **API Response**: Correctly returned wards with sub-zones (e.g., Ward 1 had 3 sub-zones)
2. **Component Rendering**: All wards showed `subZones: Array(0)` (empty arrays)

## Root Cause
The issue was in the Redux `dataSlice.ts` in the `setWardsWithSubZones` action. The action was:

1. ✅ Correctly storing sub-zones in the normalized `state.locations.subZones` object
2. ❌ **NOT preserving the `subZones` property on the ward objects themselves**

The component was reading wards from `selectWardsArray` which returns `state.locations.wards.data`, but these ward objects had their `subZones` property stripped during Redux storage.

## Solution
Modified the `setWardsWithSubZones` and `setWards` actions in `dataSlice.ts` to:

1. **Preserve the full ward objects** including their `subZones` property in `state.locations.wards`
2. **Continue normalizing sub-zones** separately in `state.locations.subZones` for efficient lookups

### Before (Broken)
```typescript
// Set wards (subZones property was lost)
state.locations.wards = {
  data: action.payload, // Ward objects without subZones
  timestamp: Date.now(),
};
```

### After (Fixed)
```typescript
// Set wards WITH their subZones property preserved for component rendering
state.locations.wards = {
  data: action.payload, // Keep the full ward objects including subZones
  timestamp: Date.now(),
};
```

## Data Flow
1. **API**: Returns wards with `subZones` arrays
2. **RTK Query**: Processes response and dispatches to Redux
3. **Redux**: Now preserves `subZones` on ward objects + normalizes separately
4. **Component**: Reads wards with `subZones` intact for dropdown rendering

## Testing
After the fix, the ward dropdown should show:
- Ward names with sub-zone counts: "Ward 1 - Fort Kochi (3 sub-zones)"
- Sub-zone dropdown populated when ward is selected
- Console logs showing correct sub-zone data throughout the pipeline

## Files Modified
- `client/store/slices/dataSlice.ts` - Fixed `setWardsWithSubZones` and `setWards` actions
- `client/store/api/wardApi.ts` - Enhanced debugging logs