import { BaseApi } from "./BaseApi";

class BookingApi extends BaseApi {
  async getBookings() {
    return this.get("/bookings");
  }

  async toggleContacted(bookingId, contacted) {
    return this.patch(`/bookings/${bookingId}/contact`, { contacted });
  }

  async deleteBooking(bookingId) {
    return this.delete(`/bookings/${bookingId}`);
  }
}

export const bookingApi = new BookingApi();
