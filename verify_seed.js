const API_URL = "http://127.0.0.1:54321/rest/v1";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

async function run() {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const venuesRes = await fetch(`${API_URL}/venues?select=*`, { headers });
  if (!venuesRes.ok) {
    throw new Error(`Failed to fetch venues: ${await venuesRes.text()}`);
  }
  const venues = await venuesRes.json();
  console.log(`Found ${venues.length} venues.`);

  const bookingsRes = await fetch(`${API_URL}/bookings?select=*`, { headers });
  if (!bookingsRes.ok) {
    throw new Error(`Failed to fetch bookings: ${await bookingsRes.text()}`);
  }
  const bookings = await bookingsRes.json();
  console.log(`Found ${bookings.length} bookings.`);

  console.log("Testing exclusion constraint...");

  const today = new Date().toISOString().split("T")[0];
  const body = {
    requester_id: "00000000-0000-0000-0000-000000000001",
    venue_id: "30000000-0000-0000-0000-000000000004",
    event_name: "Overlap Test",
    start_at: `${today}T11:00:00Z`,
    end_at: `${today}T13:00:00Z`,
    status: "CONFIRMED",
  };

  const insertRes = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!insertRes.ok) {
    const error = await insertRes.json();
    console.log(
      "Expected error on overlap:",
      error.message || error.details || error
    );
  } else {
    const inserted = await insertRes.json();
    console.log(
      "WARNING: Overlap insertion succeeded! Constraint might be broken."
    );
    console.log("Inserted booking:", inserted);
  }

  const verifyRes = await fetch(
    `${API_URL}/bookings?event_name=eq.Overlap%20Test&select=*`,
    { headers }
  );
  if (!verifyRes.ok) {
    throw new Error(
      `Failed to verify Overlap Test booking: ${await verifyRes.text()}`
    );
  }
  const overlapBookings = await verifyRes.json();
  console.log(
    `Verified 'Overlap Test' booking count: ${overlapBookings.length}`
  );
}

run().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
