import { v4 as uuidv4 } from "uuid";

export function newOrderId(): string {
  return uuidv4();
}
