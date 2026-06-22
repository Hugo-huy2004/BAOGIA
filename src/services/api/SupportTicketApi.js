import { BaseApi } from "./BaseApi";

class SupportTicketApi extends BaseApi {
  async getTickets(params) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/support/tickets?${query}`);
  }

  async resolveTicket(ticketId) {
    return this.patch(`/support/tickets/${ticketId}/resolve`);
  }
}

export const supportTicketApi = new SupportTicketApi();
