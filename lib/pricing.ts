import { House, Destination, PriceCalculation } from '@/types';

// Weekend days: Friday (5) and Saturday (6)
const WEEKEND_DAYS = [5, 6];

export function calculateTotalPrice(
  house: House,
  checkIn: Date,
  checkOut: Date,
  guests: number,
  destination?: Destination
): PriceCalculation {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return {
      nightlyTotal: 0,
      cleaningFee: 0,
      touristTax: 0,
      total: 0,
      nights: 0,
      weekdayNights: 0,
      weekendNights: 0,
    };
  }

  let weekdayNights = 0;
  let weekendNights = 0;
  let nightlyTotal = 0;

  const currentDate = new Date(checkIn);
  for (let i = 0; i < nights; i++) {
    const dayOfWeek = currentDate.getDay();
    if (WEEKEND_DAYS.includes(dayOfWeek)) {
      weekendNights++;
      nightlyTotal += house.pricing.weekendPrice;
    } else {
      weekdayNights++;
      nightlyTotal += house.pricing.weekdayPrice;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const cleaningFee = house.pricing.cleaningFee;
  const touristTaxPerPersonPerNight = destination?.touristTaxPerPersonPerNight || 1.5;
  const touristTax = touristTaxPerPersonPerNight * guests * nights;
  const total = nightlyTotal + cleaningFee + touristTax;

  return {
    nightlyTotal,
    cleaningFee,
    touristTax,
    total,
    nights,
    weekdayNights,
    weekendNights,
  };
}
