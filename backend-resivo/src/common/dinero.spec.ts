import { redondear, subtotal } from './dinero.js';

describe('dinero', () => {
  it('rounds to 2 decimals', () => {
    expect(redondear(0.1 + 0.2)).toBe(0.3);
    expect(redondear(2713954.0999999996)).toBe(2713954.1);
    expect(redondear(229199.96000000002)).toBe(229199.96);
    expect(redondear(1.005)).toBe(1.01);
    expect(redondear(-7700)).toBe(-7700);
  });

  it('calculates the subtotal of a producto', () => {
    expect(subtotal({ cantidad: 3, precio: 0.1 })).toBe(0.3);
    expect(subtotal({ cantidad: 4, precio: 1250.75 })).toBe(5003);
    expect(subtotal({ cantidad: 1, precio: -1200 })).toBe(-1200);
  });
});
