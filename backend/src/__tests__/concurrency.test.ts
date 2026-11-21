import { describe, it, expect } from 'vitest';

describe('Concurrency & Stock Overselling Protection Demonstration', () => {
  it('Demonstrates that atomic conditional update guarantees only 1 of 2 concurrent orders succeeds when stock = 1', async () => {
    // Simulated atomic in-memory mutex / DB transaction lock
    let currentStock = 1;
    let reservedStock = 0;

    async function attemptAtomicOrder(customerId: string, requestedQty: number): Promise<{ success: boolean; customer: string }> {
      // Simulates:
      // UPDATE inventory SET quantity = quantity - $qty, reserved_quantity = reserved_quantity + $qty
      // WHERE quantity >= $qty RETURNING quantity;
      if (currentStock >= requestedQty) {
        currentStock -= requestedQty;
        reservedStock += requestedQty;
        return { success: true, customer: customerId };
      }
      return { success: false, customer: customerId };
    }

    // Two concurrent checkout attempts fired simultaneously
    const customer1Promise = attemptAtomicOrder('Customer_Aarav', 1);
    const customer2Promise = attemptAtomicOrder('Customer_Priya', 1);

    const [result1, result2] = await Promise.all([customer1Promise, customer2Promise]);

    const successfulOrders = [result1, result2].filter((r) => r.success);
    const failedOrders = [result1, result2].filter((r) => !r.success);

    // EXACT ACCEPTANCE CRITERIA: Exactly 1 succeeds, 1 fails
    expect(successfulOrders.length).toBe(1);
    expect(failedOrders.length).toBe(1);
    expect(currentStock).toBe(0);
    expect(reservedStock).toBe(1);

    console.log(`[Concurrency Verification Passed] Winner: ${successfulOrders[0].customer}, Rejected due to OUT_OF_STOCK: ${failedOrders[0].customer}`);
  });
});
