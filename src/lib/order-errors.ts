// Turns the database's short error codes into messages a customer can act on.
export function describeOrderError(message: string): string {
  if (message.includes("invalid_table")) {
    return "This table's QR code is no longer valid. Please scan it again or ask a team member.";
  }
  if (message.includes("item_unavailable")) {
    return "One or more items are no longer available. Please check the menu and your cart, then try again.";
  }
  if (message.includes("too_many_open_orders")) {
    return "You already have several open orders. Please wait until some are delivered before ordering again.";
  }
  if (message.includes("invalid_items")) {
    return "Something is wrong with the items in your cart. Please review it and try again.";
  }
  if (message.includes("notes_too_long")) {
    return "Your note is too long. Please keep it under 300 characters.";
  }
  if (message.includes("not_authenticated")) {
    return "We couldn't verify your session. Please try again.";
  }
  return "We couldn't place your order. Please check your connection and try again.";
}
