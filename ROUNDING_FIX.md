# Rounding and Global Discount Fix for Invoice and Quote Calculations

## Problems Found

### Problem 1: Line-Item Discount Rounding
When adding discounts to line items, the individual line totals were displayed rounded to 2 decimal places, but the sum was calculated using unrounded values. This caused discrepancies where the total could be higher than the sum of the displayed line items.

#### Example of the Issue
- Item 1: 3 × €10.00 with 5% discount = €28.50 (displayed)
- Item 2: 2 × €15.00 with 10% discount = €27.00 (displayed)
- **Expected Sum**: €55.50
- **Actual Sum**: €55.5000000001 (due to floating point arithmetic)

### Problem 2: Global Discount Not Applied to Totals ⚠️
The global discount was being stored in the database but **was not being applied to the calculated totals**. This meant:
- The overview pages ("Alle Rechnungen" and "Alle Angebote") showed incorrect totals
- The stored `subtotal`, `taxAmount`, and `total` fields did not account for global discounts
- Only the frontend PDF preview showed correct totals (because it calculated them client-side)

#### Example of the Issue
- Items subtotal (after line discounts): €100.00
- Global discount: 10%
- **Expected subtotal**: €90.00
- **Expected tax (20%)**: €18.00
- **Expected total**: €108.00
- **Actual stored total**: €120.00 (global discount ignored!)

## Solution
Implemented proper rounding at the calculation level and fixed global discount application to ensure that:
1. Each line item is rounded to 2 decimal places immediately after applying discounts
2. Global discount is applied to the subtotal (after line-item discounts)
3. Tax is calculated on the discounted subtotal
4. Backend and frontend calculations are consistent

## Changes Made

### Backend Changes

#### 1. `/backend/src/quotes/quotes.service.ts`
- **Updated `calculateTotals()` method** to:
  - Accept discount parameter for line items
  - Accept globalDiscount parameter
  - Apply line-by-line rounding before summing
  - Apply global discount to subtotal before calculating tax
- **Updated `create()` method** to:
  - Pass globalDiscount to calculateTotals
  - Calculate item totals with proper rounding
- **Updated `update()` method** to:
  - Pass globalDiscount to calculateTotals
  - Calculate item totals with proper rounding

```typescript
// Before - No global discount applied
private calculateTotals(items: { quantity: number; unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  // ...
}

// After - Global discount applied with rounding
private calculateTotals(items: { quantity: number; unitPrice: number; discount?: number }[], taxRate: number, globalDiscount: number = 0) {
  // Calculate items subtotal with line-item discounts and rounding
  const itemsSubtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice;
    const discountAmount = item.discount ? (lineTotal * item.discount) / 100 : 0;
    const itemTotal = lineTotal - discountAmount;
    const roundedItemTotal = Math.round(itemTotal * 100) / 100;
    return sum + roundedItemTotal;
  }, 0);

  // Apply global discount to the subtotal
  const globalDiscountAmount = (itemsSubtotal * globalDiscount) / 100;
  const subtotal = itemsSubtotal - globalDiscountAmount;

  // Calculate tax on the discounted subtotal
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  // ...
}
```

#### 2. `/backend/src/invoices/invoices.service.ts`
- **Updated `calculateTotals()` method** to:
  - Accept globalDiscount parameter (already had line-item discount support)
  - Apply global discount to subtotal before calculating tax
- **Updated `create()` method** to pass globalDiscount to calculateTotals
- **Updated `update()` method** to pass globalDiscount to calculateTotals

### Frontend Changes

#### 3. `/src/pages/Quotes/CreateQuote.tsx`
- **Updated `updateItem()` function** to round `netAmount` to 2 decimal places

```typescript
// Before
item.netAmount = item.quantity * item.unitPrice * discountMultiplier;

// After
const rawAmount = item.quantity * item.unitPrice * discountMultiplier;
item.netAmount = Math.round(rawAmount * 100) / 100;
```

#### 4. `/src/pages/Invoices/CreateInvoice.tsx`
- **Updated `updateItem()` function** to round `netAmount` to 2 decimal places
- **Updated invoice loading logic** to round `netAmount` when parsing existing invoices

```typescript
// Before
item.netAmount = item.quantity * item.unitNetPrice * discountMultiplier;

// After
const rawNetAmount = item.quantity * item.unitNetPrice * discountMultiplier;
item.netAmount = Math.round(rawNetAmount * 100) / 100;
```

#### 5. PDF Preview Components
- `/src/components/common/InvoicePDFPreview.tsx` - No changes needed ✓
- `/src/components/common/QuotePDFPreview.tsx` - No changes needed ✓
- Both components already use `item.netAmount` from the items array, which now contains properly rounded values

## Testing Recommendations

1. **Test Case 1: Line-Item Discount Rounding**
   - Create an invoice/quote with items that have line-item discounts
   - Verify that individual line totals match the sum

2. **Test Case 2: Multiple Line-Item Discounts**
   - Add several items with different discount percentages
   - Ensure the total matches the sum of displayed line items

3. **Test Case 3: Global Discount Application** ⭐ (NEW)
   - Create an invoice/quote with items
   - Apply a global discount (e.g., 10%)
   - Verify that:
     - The subtotal reflects the global discount
     - Tax is calculated on the discounted subtotal
     - The total in the overview page matches the detail page
     - The stored total in the database is correct

4. **Test Case 4: Combined Discounts** ⭐ (NEW)
   - Apply both line-item discounts AND global discount
   - Verify calculation order: line items → line discounts → sum → global discount → tax
   - Check overview pages show correct totals

5. **Test Case 5: Load Existing Invoice/Quote**
   - Load an existing invoice with discounts
   - Ensure values display correctly and calculations remain accurate

6. **Test Case 6: Overview Pages** ⭐ (NEW)
   - Navigate to "Alle Rechnungen" and "Alle Angebote"
   - Verify totals match those shown in detail pages
   - Check that global discounts are properly reflected

5. **Test Case 5: PDF Generation**
   - Generate PDFs for invoices and quotes with discounts
   - Verify that PDF totals match the UI display and overview pages

## Impact
- **Breaking Changes**: None - existing data remains valid but may need recalculation
- **Database**: No migration needed - only calculation logic changed
- **Backward Compatibility**: Existing invoices/quotes with global discounts will need to be re-saved to recalculate totals correctly
- **Important**: Consider running a script to recalculate totals for existing records with globalDiscount > 0

## Important Note
**Existing invoices and quotes with global discounts have incorrect totals stored in the database.** They were saved without the global discount being applied to the total. To fix this:
- Option 1: Re-save each affected invoice/quote (will trigger recalculation)
- Option 2: Create a migration script to recalculate and update all existing records
- Option 3: Accept that old records have incorrect totals (not recommended)

## Date Fixed
December 2, 2025 (Updated with global discount fix)
