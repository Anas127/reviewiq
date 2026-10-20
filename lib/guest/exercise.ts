import "server-only";
import type { ExerciseBug } from "@/lib/exercise-token";

export const GUEST_EXERCISE_ID = "python-order-address-v1";
export const GUEST_FLOW_VERSION = "guest_try_v1";
export const GUEST_EXERCISE = {
  role: "Backend Engineer",
  language: "Python",
  seniority: "Mid-level",
  description: "This change lets a signed-in customer update the shipping address on an existing order. It receives a transaction-mode database connection and should save the new address before reporting success.",
  task: "Review this change as if it were a pull request. Identify correctness or security problems, explain what could break, and suggest practical fixes.",
  code: `def update_shipping_address(conn, actor_user_id: int, order_id: int, new_address: str) -> bool:
    with conn.cursor() as cursor:
        cursor.execute("SELECT customer_id FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        if order is None:
            return False

        cursor.execute(
            f"UPDATE orders SET shipping_address = '{new_address}' WHERE id = {order_id}"
        )
        return True`,
} as const;

// Never send these planted answers to /try or its session response.
export const GUEST_BUGS: ExerciseBug[] = [
  { id: 1, line: "order = cursor.fetchone()", description: "The code fetches the order owner but never compares customer_id with actor_user_id. Any signed-in user who knows an order ID can change another customer's shipping address." },
  { id: 2, line: "f\"UPDATE orders SET shipping_address = '{new_address}' WHERE id = {order_id}\"", description: "new_address is interpolated directly into SQL, so a crafted address can change the query or execute injected SQL. Use parameterized placeholders for every user-controlled value." },
  { id: 3, line: "return True", description: "The UPDATE is not committed on this ordinary transaction-mode connection. The function reports success even though the change can be rolled back when the connection closes." },
];
