import { env } from "../../config";
import { outboundRequest } from "../http-client";

const MIDTRANS_BASE_URL = env.MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

export interface SnapTransactionInput {
  orderId: string;
  grossAmount: number;
  customerEmail: string;
  customerName: string;
  itemName: string;
}

export interface SnapTransactionResult {
  token: string;
  redirect_url: string;
}

function snapAuthHeader(): Record<string, string> {
  // Snap API auth: HTTP Basic, server key as username, empty password.
  const token = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64");
  return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

export function createSnapTransaction(input: SnapTransactionInput): Promise<SnapTransactionResult> {
  return outboundRequest<SnapTransactionResult>(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
    method: "POST",
    headers: snapAuthHeader(),
    body: {
      transaction_details: { order_id: input.orderId, gross_amount: input.grossAmount },
      customer_details: { email: input.customerEmail, first_name: input.customerName },
      item_details: [
        { id: input.orderId, price: input.grossAmount, quantity: 1, name: input.itemName },
      ],
    },
  });
}

export interface NotificationSignaturePayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}

/**
 * Midtrans notification signature: sha512(order_id + status_code + gross_amount + server_key).
 * Wajib dicek sebelum mempercayai payload webhook mana pun — lihat spec.
 */
export function verifyNotificationSignature(payload: NotificationSignaturePayload, serverKey: string): boolean {
  const hasher = new Bun.CryptoHasher("sha512");
  hasher.update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`);
  return hasher.digest("hex") === payload.signature_key;
}
