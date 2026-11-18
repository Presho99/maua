import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import Loader from "../Loader";
import {
  customerFor,
  dateTime,
  downloadReport,
  money,
  orderActivity,
  shopActivity,
  title,
} from "../lib/admin-report";

const tabs = {
  orders: "Orders",
  payments: "Payments",
  users: "Customers & admins",
  flowers: "Products",
  notifications: "Email previews",
  activity: "Activity",
  sessions: "Sign-in sessions",
};
const transitions = {
  awaiting_payment: ["cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
};
const shortId = (id) => `#${id.slice(0, 8).toUpperCase()}`;
function Badge({ value }) {
  return <span className={`status-badge status-${value}`}>{title(value)}</span>;
}

function Table({ headers, children }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th scope="col" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Timeline({ events }) {
  return (
    <ol className="order-timeline">
      {events.map((event) => (
        <li key={event.id}>
          <div>
            <strong>{event.event}</strong>
            <time dateTime={event.date}>{dateTime(event.date)}</time>
          </div>
          <p>{event.detail}</p>
          <small>{event.actor}</small>
        </li>
      ))}
    </ol>
  );
}

export default function Admin() {
  const [database, setDatabase] = useState(null);
  const [tab, setTab] = useState("orders");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  async function load() {
    const data = await api("/admin/database");
    setDatabase(data);
    setUpdatedAt(new Date().toISOString());
  }
  useEffect(() => {
    let active = true;
    let inFlight = false;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await api("/admin/database");
        if (active) {
          setDatabase(data);
          setUpdatedAt(new Date().toISOString());
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        inFlight = false;
      }
    }
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  async function update(path, body, method = "PATCH") {
    setBusy(true);
    setError("");
    try {
      await api(`/admin/${path}`, { method, body: JSON.stringify(body) });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function exportRecords() {
    setExporting(true);
    setError("");
    try {
      await downloadReport(database);
    } catch {
      setError("Unable to create the Excel report. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  async function refreshRecords() {
    setBusy(true);
    setError("");
    try {
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const records = database
    ? tab === "activity"
      ? shopActivity(database)
      : database[tab]
    : [];
  const rows = (records || []).filter((row) => {
    const customer = database && customerFor(database, row.userId);
    return (
      `${Object.values(row)
        .filter((value) => typeof value !== "object")
        .join(
          " ",
        )} ${customer?.name || ""} ${customer?.email || ""} ${(row.items || []).map((item) => item.flower.name).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (tab !== "orders" || status === "all" || row.status === status)
    );
  });
  const selectedOrder =
    tab === "orders" &&
    (rows.find((order) => order.id === selectedId) || rows[0]);
  return (
    <main className="admin-page home">
      <p className="eyebrow">MAUA OPERATIONS</p>
      <div className="admin-heading">
        <div>
          <h1>Shop dashboard</h1>
          <p>
            Follow each order from checkout to delivery, manage your shop and
            download reports.
          </p>
        </div>
        {database && (
          <button
            className="admin-export"
            disabled={exporting}
            onClick={exportRecords}
          >
            {exporting ? (
              <Loader inline label="Creating Excel file…" />
            ) : (
              "Download Excel report"
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
          <button onClick={refreshRecords} disabled={busy}>
            Try again
          </button>
        </p>
      )}
      {!database && !error && <Loader label="Loading dashboard…" />}
      {database && (
        <>
          <div className="admin-metrics">
            {[
              ["Orders received", database.orders.length],
              [
                "Awaiting payment",
                database.orders.filter(
                  (order) => order.status === "awaiting_payment",
                ).length,
              ],
              [
                "To prepare / deliver",
                database.orders.filter((order) =>
                  ["confirmed", "preparing"].includes(order.status),
                ).length,
              ],
              ["Simulated sales", money(database.summary.revenue)],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="admin-toolbar">
            <label>
              Search {tabs[tab].toLowerCase()}
              <input
                type="search"
                placeholder="Customer, product, receipt or order number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {tab === "orders" && (
              <label>
                Order status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {[
                    "awaiting_payment",
                    "confirmed",
                    "preparing",
                    "delivered",
                    "cancelled",
                  ].map((value) => (
                    <option value={value} key={value}>
                      {title(value)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button disabled={busy} onClick={refreshRecords}>
              {busy ? <Loader inline label="Updating…" /> : "Refresh"}
            </button>
            <small>
              Updates every 30 seconds · Last updated {dateTime(updatedAt)}
            </small>
          </div>
          <nav className="admin-tabs" aria-label="Shop management">
            {Object.entries(tabs).map(([name, label]) => (
              <button
                key={name}
                aria-pressed={tab === name}
                onClick={() => {
                  setTab(name);
                  setSearch("");
                }}
              >
                {label} (
                {name === "activity"
                  ? shopActivity(database).length
                  : database[name].length}
                )
              </button>
            ))}
          </nav>
          <div className="admin-section-heading">
            <h2>{tabs[tab]}</h2>
            <span>
              {rows.length} {rows.length === 1 ? "record" : "records"}
            </span>
          </div>
          {tab === "flowers" && (
            <details className="admin-add-product">
              <summary>Add a product</summary>
              <ProductForm
                busy={busy}
                onSave={(body) => update("flowers", body, "POST")}
              />
            </details>
          )}

          {!rows.length && (
            <div className="admin-empty">
              <h3>
                {search || (status !== "all" && tab === "orders")
                  ? "No matching records"
                  : "Nothing here yet"}
              </h3>
              <p>
                {tab === "orders"
                  ? "Customer orders will appear here as soon as checkout is started."
                  : "New shop activity will appear here automatically."}
              </p>
            </div>
          )}
          {!!rows.length && tab === "orders" && (
            <>
              <Table
                headers={[
                  "Order",
                  "Customer",
                  "Placed",
                  "Total",
                  "Status",
                  "Payment",
                  "Details",
                ]}
              >
                {rows.map((order) => {
                  const user = customerFor(database, order.userId);
                  return (
                    <tr
                      key={order.id}
                      className={
                        selectedOrder?.id === order.id ? "selected-row" : ""
                      }
                    >
                      <th scope="row">{shortId(order.id)}</th>
                      <td>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </td>
                      <td>{dateTime(order.date)}</td>
                      <td>{money(order.total)}</td>
                      <td>
                        <Badge value={order.status} />
                      </td>
                      <td>
                        {order.payment ? (
                          <>
                            <Badge value="approved" />
                            <small>{order.payment.receipt}</small>
                          </>
                        ) : (
                          "Not paid"
                        )}
                      </td>
                      <td>
                        <button
                          aria-label={`View order ${shortId(order.id)}`}
                          onClick={() => setSelectedId(order.id)}
                        >
                          View order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </Table>
              {selectedOrder && (
                <OrderDetails
                  order={selectedOrder}
                  database={database}
                  busy={busy}
                  update={update}
                />
              )}
            </>
          )}
          {!!rows.length && tab === "payments" && (
            <Table
              headers={[
                "Customer / order",
                "Phone",
                "Amount",
                "Status",
                "Started",
                "Completed",
                "Receipt",
              ]}
            >
              {rows.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <strong>
                      {customerFor(database, payment.userId).name}
                    </strong>
                    <button
                      className="admin-link"
                      onClick={() => {
                        setTab("orders");
                        setStatus("all");
                        setSearch("");
                        setSelectedId(payment.orderId);
                      }}
                    >
                      {shortId(payment.orderId)}
                    </button>
                  </td>
                  <td>{payment.phone}</td>
                  <td>
                    {money(payment.amount)}
                    <small>Simulation</small>
                  </td>
                  <td>
                    <Badge value={payment.status} />
                  </td>
                  <td>{dateTime(payment.date)}</td>
                  <td>{dateTime(payment.completedAt)}</td>
                  <td>{payment.receipt || "—"}</td>
                </tr>
              ))}
            </Table>
          )}
          {!!rows.length && tab === "users" && (
            <Table
              headers={["Name", "Email", "Orders", "Saved products", "Role"]}
            >
              {rows.map((user) => (
                <tr key={user.id}>
                  <th scope="row">{user.name}</th>
                  <td>{user.email}</td>
                  <td>
                    {
                      database.orders.filter(
                        (order) => order.userId === user.id,
                      ).length
                    }
                  </td>
                  <td>{user.wishlist?.length || 0}</td>
                  <td>
                    <select
                      aria-label={`Role for ${user.email}`}
                      value={user.role}
                      disabled={busy}
                      onChange={(e) =>
                        update(`users/${user.id}/role`, {
                          role: e.target.value,
                        })
                      }
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {tab === "flowers" && (
            <div className="admin-products">
              {rows.map((flower) => (
                <article className="admin-product" key={flower.id}>
                  <img src={flower.image} alt={flower.name} />
                  <div>
                    <h3>{flower.name}</h3>
                    <p>{flower.description}</p>
                    <strong>{money(flower.price)}</strong>
                    <p>
                      <Badge
                        value={
                          flower.active === false ? "unavailable" : "available"
                        }
                      />
                    </p>
                    <details>
                      <summary>Edit product</summary>
                      <ProductForm
                        key={JSON.stringify(flower)}
                        flower={flower}
                        busy={busy}
                        onSave={(body) => update(`flowers/${flower.id}`, body)}
                      />
                      <button
                        className="admin-delete"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete ${flower.name}? Historical orders will be preserved.`,
                            )
                          )
                            update(`flowers/${flower.id}`, undefined, "DELETE");
                        }}
                      >
                        Delete product
                      </button>
                    </details>
                  </div>
                </article>
              ))}
            </div>
          )}
          {tab === "notifications" && (
            <div className="admin-records">
              {rows.map((message) => (
                <article className="notification-card" key={message.id}>
                  <div className="admin-section-heading">
                    <h3>{message.subject}</h3>
                    <Badge value="simulated" />
                  </div>
                  <p>To: {message.to}</p>
                  <p>
                    {dateTime(message.date)} · Order {shortId(message.orderId)}
                  </p>
                  <blockquote>{message.body}</blockquote>
                  <small>Email preview only. No email was sent.</small>
                </article>
              ))}
            </div>
          )}
          {tab === "activity" && <Timeline events={rows} />}
          {!!rows.length && tab === "sessions" && (
            <Table headers={["Account", "Email", "Expires", "Access"]}>
              {rows.map((session, index) => {
                const user = customerFor(database, session.userId);
                return (
                  <tr key={`${session.userId}-${index}`}>
                    <th scope="row">{user.name}</th>
                    <td>{user.email}</td>
                    <td>{dateTime(session.expires)}</td>
                    <td>
                      <button
                        disabled={busy}
                        onClick={() =>
                          update(
                            `sessions/${session.userId}`,
                            undefined,
                            "DELETE",
                          )
                        }
                      >
                        Sign out all sessions
                      </button>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
          <p className="admin-report-note">
            Excel reports include all orders, order items, payments, customers,
            products, email previews and activity, including records outside
            your current filters. Payments shown here are simulated.
          </p>
        </>
      )}
    </main>
  );
}

function OrderDetails({ order, database, busy, update }) {
  const user = customerFor(database, order.userId);
  const payments = database.payments.filter(
    (payment) => payment.orderId === order.id,
  );
  return (
    <section
      className="admin-order-detail"
      aria-label={`Order details ${shortId(order.id)}`}
    >
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">ORDER DETAILS</p>
          <h2>{shortId(order.id)}</h2>
          <small title={order.id}>Placed {dateTime(order.date)}</small>
        </div>
        <Badge value={order.status} />
      </div>
      <div className="order-facts">
        <div>
          <span>Customer</span>
          <strong>{user.name}</strong>
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </div>
        <div>
          <span>Delivery</span>
          <strong>{title(order.shipping)}</strong>
          <small>{money(order.delivery)}</small>
        </div>
        <div>
          <span>Payment</span>
          <strong>
            {order.payment ? "Approved · Simulation" : "Awaiting payment"}
          </strong>
          <small>{order.payment?.receipt || "No approved receipt yet"}</small>
        </div>
        <div>
          <span>Order total</span>
          <strong>{money(order.total)}</strong>
        </div>
      </div>
      <h3>Bouquets ordered</h3>
      <div className="admin-order-items">
        {order.items.map((item) => (
          <div key={item.flower.id}>
            <img src={item.flower.image} alt={item.flower.name} />
            <div>
              <strong>{item.flower.name}</strong>
              <small>
                {item.quantity} × {money(item.flower.price)}
              </small>
            </div>
            <strong>{money(item.quantity * Number(item.flower.price))}</strong>
          </div>
        ))}
      </div>
      {(transitions[order.status] || []).length > 0 && (
        <label className="admin-order-action">
          Update fulfillment
          <select
            aria-label={`Status for order ${order.id}`}
            disabled={busy}
            value=""
            onChange={(e) => {
              if (e.target.value)
                update(`orders/${order.id}`, { status: e.target.value });
            }}
          >
            <option value="">Choose next step</option>
            {transitions[order.status].map((value) => (
              <option key={value} value={value}>
                {value === "preparing"
                  ? "Start preparing"
                  : value === "delivered"
                    ? "Mark as delivered"
                    : "Cancel order"}
              </option>
            ))}
          </select>
        </label>
      )}
      <h3>Payment attempts</h3>
      {payments.length ? (
        <ul className="order-payment-attempts">
          {payments.map((payment) => (
            <li key={payment.id}>
              <Badge value={payment.status} />
              <span>
                {payment.phone} · {money(payment.amount)}
              </span>
              <small>
                {dateTime(payment.completedAt || payment.date)}
                {payment.receipt ? ` · ${payment.receipt}` : ""}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-muted">
          The customer has not started a payment yet.
        </p>
      )}
      <h3>Order journey</h3>
      <Timeline events={orderActivity(database, order)} />
    </section>
  );
}
function ProductForm({ flower, busy, onSave }) {
  return (
    <form
      className="product-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const body = Object.fromEntries(
          ["name", "description", "image", "family", "origin", "symbols"].map(
            (key) => [key, data.get(key)],
          ),
        );
        body.price = Number(data.get("price"));
        ["active", "bestSeller", "newArrival"].forEach((key) => {
          body[key] = data.get(key) === "on";
        });
        onSave(body);
      }}
    >
      <h3>{flower ? "Edit product" : "Add product"}</h3>
      {["name", "description", "image", "family", "origin", "symbols"].map(
        (key) => (
          <label key={key}>
            {
              {
                name: "Name",
                description: "Description",
                image: "Image URL",
                family: "Flower family",
                origin: "Origin",
                symbols: "Meaning",
              }[key]
            }
            <input
              name={key}
              defaultValue={flower?.[key] || ""}
              required={["name", "description", "image"].includes(key)}
              maxLength="2000"
              placeholder={
                key === "image" ? "/assets/rose.jpeg or https://…" : ""
              }
            />
          </label>
        ),
      )}
      <label>
        Price (KES)
        <input
          name="price"
          type="number"
          min="0.01"
          max="1000000"
          step="0.01"
          defaultValue={flower?.price}
          required
        />
      </label>
      {["active", "bestSeller", "newArrival"].map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            name={key}
            defaultChecked={
              key === "active" ? flower?.active !== false : !!flower?.[key]
            }
          />
          {
            {
              active: "Available in shop",
              bestSeller: "Best seller",
              newArrival: "New arrival",
            }[key]
          }
        </label>
      ))}
      <button disabled={busy}>{flower ? "Save product" : "Add product"}</button>
    </form>
  );
}
