# Stadium View Integration Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend CoreService is running on `http://localhost:5007`
2. Frontend Next.js app is running on `http://localhost:3000`
3. Database has at least one stadium with a seating plan

### Test 1: API Endpoint Verification

#### Using Swagger UI
1. Navigate to `http://localhost:5007/swagger`
2. Find `GET /api/stadiums/{stadiumId}/seating-plans`
3. Enter a valid stadium ID
4. Click "Execute"
5. **Expected**: Response with array of seating plans

#### Using curl
```bash
# Get seating plans for a stadium
curl -X GET "http://localhost:5007/api/stadiums/{STADIUM_ID}/seating-plans" \
  -H "Authorization: Bearer {YOUR_TOKEN}"

# Get full seating plan details
curl -X GET "http://localhost:5007/api/seating-plans/{SEATING_PLAN_ID}" \
  -H "Authorization: Bearer {YOUR_TOKEN}"
```

**Expected Response Structure**:
```json
{
  "success": true,
  "data": {
    "seatingPlanId": "guid",
    "stadiumId": "guid",
    "name": "string",
    "description": "string",
    "fieldConfigMetadata": "json-string",
    "totalCapacity": 50000,
    "sections": [
      {
        "sectionId": "guid",
        "name": "Section A",
        "type": "Seated",
        "capacity": 5000,
        "seatType": "Standard",
        "color": "#4169E1",
        "posX": 100,
        "posY": 200,
        "rows": 50,
        "seatsPerRow": 100,
        "geometryType": "arc",
        "geometryData": "{\"innerRadius\":150,\"outerRadius\":200,\"startAngle\":0,\"endAngle\":1.57}"
      }
    ],
    "landmarks": [
      {
        "featureId": "guid",
        "type": "GATE",
        "label": "Main Entrance",
        "posX": 0,
        "posY": 0,
        "width": 50,
        "height": 50
      }
    ]
  },
  "message": null,
  "error": null
}
```

### Test 2: Frontend Integration

#### Browser Testing
1. Open browser to `http://localhost:3000`
2. Log in as Event Manager
3. Navigate to `/event-manager/stadiums`
4. Click on any stadium
5. **Expected**: Stadium layout view loads with canvas

#### Console Verification
Open browser DevTools (F12) and check:

**Network Tab**:
- Request to `/api/core/stadiums/{id}/seating-plans` - Status 200
- Request to `/api/core/seating-plans/{id}` - Status 200
- Response includes `sections` and `landmarks` arrays

**Console Tab**:
- No errors (red messages)
- Optional: Info messages about data loading

### Test 3: Visual Verification

#### Canvas Rendering
- [ ] Canvas displays with dark background
- [ ] Sections render as colored shapes (arcs or rectangles)
- [ ] Field/stage area renders in center
- [ ] Landmarks render as icons

#### Interactivity
- [ ] Hover over section shows tooltip
- [ ] Tooltip displays section name, type, capacity
- [ ] Zoom controls work (+ / - buttons)
- [ ] Pan works (click and drag)
- [ ] Reset view button works

#### Capacity Panel
- [ ] Total capacity displays correctly
- [ ] Breakdown by seat type shows
- [ ] Section count displays (Seated vs Standing)
- [ ] Landmark count displays

#### Legend
- [ ] Color legend shows seat types
- [ ] Landmark icons display with labels

### Test 4: Error Handling

#### Test Missing Seating Plan
1. Navigate to a stadium without a seating plan
2. **Expected**: Error message "No seating plan found for this stadium"

#### Test Invalid Stadium ID
1. Navigate to `/event-manager/stadiums/00000000-0000-0000-0000-000000000000`
2. **Expected**: Error message or redirect

#### Test API Failure
1. Stop the backend service
2. Refresh the stadium detail page
3. **Expected**: Falls back to mock data OR shows error message

### Test 5: Performance Verification

#### Load Time
1. Open DevTools Network tab
2. Navigate to stadium detail page
3. Check timing:
   - **API Response**: < 500ms
   - **Canvas Render**: < 2 seconds
   - **Total Page Load**: < 3 seconds

#### Interaction Performance
1. Hover over multiple sections rapidly
2. **Expected**: Smooth tooltip updates, no lag
3. Zoom in/out multiple times
4. **Expected**: 60 FPS, no stuttering
5. Pan around the canvas
6. **Expected**: Smooth dragging

### Test 6: Data Validation

#### Check Geometry Parsing
Open browser console and run:
```javascript
// This should be available in the component
console.log(seatingPlan.sections[0].geometry);
```

**Expected**: Parsed object, not JSON string
```javascript
{
  innerRadius: 150,
  outerRadius: 200,
  startAngle: 0,
  endAngle: 1.57
}
```

#### Check Field Config
```javascript
console.log(seatingPlan.fieldConfig);
```

**Expected**: Parsed field configuration
```javascript
{
  field: {
    centerX: 0,
    centerY: 0,
    width: 600,
    height: 300,
    rotation: 0
  }
}
```

## Common Issues & Solutions

### Issue: Blank Canvas
**Symptoms**: Canvas renders but no sections visible
**Debug**:
```javascript
// In browser console
console.log(seatingPlan.sections.length); // Should be > 0
console.log(seatingPlan.sections[0]); // Check structure
```
**Solutions**:
- Verify sections array is populated
- Check geometry data is valid
- Verify canvas dimensions are set

### Issue: Tooltip Not Showing
**Symptoms**: Hover over sections but no tooltip
**Debug**:
- Check browser console for errors
- Verify `onHoverChange` callback is firing
**Solutions**:
- Check hit detection logic in StadiumCanvas
- Verify tooltip component is rendered

### Issue: Wrong Capacity Numbers
**Symptoms**: Capacity doesn't match expected values
**Debug**:
```javascript
// Calculate total from sections
const total = seatingPlan.sections.reduce((sum, s) => sum + s.capacity, 0);
console.log('Calculated:', total, 'Stored:', seatingPlan.totalCapacity);
```
**Solutions**:
- Verify database capacity values
- Check normalization logic

## Automated Testing (Optional)

### API Integration Test
```bash
# Create a test script: test-api.sh
#!/bin/bash

STADIUM_ID="your-stadium-id"
TOKEN="your-auth-token"
BASE_URL="http://localhost:5007"

echo "Testing Stadium View API Integration..."

# Test 1: Get seating plans
echo "1. Fetching seating plans..."
RESPONSE=$(curl -s -X GET "$BASE_URL/api/stadiums/$STADIUM_ID/seating-plans" \
  -H "Authorization: Bearer $TOKEN")

echo $RESPONSE | jq '.success'

# Test 2: Get seating plan details
PLAN_ID=$(echo $RESPONSE | jq -r '.data[0].seatingPlanId')
echo "2. Fetching seating plan details for $PLAN_ID..."
DETAIL=$(curl -s -X GET "$BASE_URL/api/seating-plans/$PLAN_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $DETAIL | jq '.data.sections | length'
echo $DETAIL | jq '.data.landmarks | length'

echo "Integration test complete!"
```

### Frontend Component Test
```typescript
// __tests__/StadiumLayoutView.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import StadiumLayoutView from '@/components/stadium/StadiumLayoutView';
import { coreService } from '@/services/coreService';

jest.mock('@/services/coreService');

describe('StadiumLayoutView Integration', () => {
  it('fetches and displays seating plan', async () => {
    const mockSeatingPlans = {
      success: true,
      data: [{ seatingPlanId: 'plan-1', name: 'Main Plan' }]
    };
    
    const mockSeatingPlan = {
      seatingPlanId: 'plan-1',
      name: 'Main Plan',
      sections: [],
      landmarks: []
    };

    (coreService.getSeatingPlans as jest.Mock).mockResolvedValue(mockSeatingPlans);
    (coreService.getStadiumViewSeatingPlan as jest.Mock).mockResolvedValue(mockSeatingPlan);

    render(<StadiumLayoutView stadiumId="stadium-1" />);

    await waitFor(() => {
      expect(screen.getByText('Main Plan')).toBeInTheDocument();
    });
  });
});
```

## Success Criteria

✅ All API endpoints return 200 status
✅ Sections and landmarks arrays are populated
✅ Canvas renders visual elements
✅ Hover interactions work smoothly
✅ Capacity calculations are correct
✅ No console errors
✅ Performance meets requirements (< 500ms API, < 2s render)
✅ Error states display appropriately

## Sign-off

- [ ] Backend API tested and verified
- [ ] Frontend integration tested and verified
- [ ] Visual rendering confirmed
- [ ] Interactions tested
- [ ] Performance validated
- [ ] Error handling verified

**Tested by**: _______________
**Date**: _______________
**Status**: _______________
