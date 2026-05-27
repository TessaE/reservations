import { createClient } from "@supabase/supabase-js";

// Format dates using the browser's locale and timezone
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const time = date.toLocaleTimeString(undefined, { timeStyle: "short" });

  if (dateDay.getTime() === today.getTime()) {
    return `Today, ${time}`;
  }
  if (dateDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow, ${time}`;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Apply formatting to all date elements
document.querySelectorAll(".format-date").forEach((el) => {
  const timestamp = (el as HTMLElement).dataset.timestamp;
  if (timestamp) {
    el.textContent = formatDate(timestamp);
  }
});

const nameInput = document.getElementById("user-name") as HTMLInputElement;
const durationSelect = document.getElementById("reserve-duration") as HTMLSelectElement;
const dialog = document.getElementById("confirm-dialog") as HTMLDialogElement;
const confirmYes = document.getElementById("confirm-yes") as HTMLButtonElement;
const confirmNo = document.getElementById("confirm-no") as HTMLButtonElement;

// Load name from localStorage
const storedName = localStorage.getItem("reservations-user-name");
if (storedName) {
  nameInput.value = storedName;
}

// Load duration from localStorage
const storedDuration = localStorage.getItem("reservations-duration");
if (storedDuration) {
  durationSelect.value = storedDuration;
}

// Save name to localStorage on input
nameInput.addEventListener("input", () => {
  localStorage.setItem("reservations-user-name", nameInput.value);
  updateButtons();
});

// Save duration to localStorage on change
durationSelect.addEventListener("change", () => {
  localStorage.setItem("reservations-duration", durationSelect.value);
});

// Show/hide buttons based on current user name
function updateButtons() {
  const currentName = nameInput.value.trim().toLowerCase();

  document.querySelectorAll(".end-reservation-btn").forEach((btn) => {
    const reservedBy = ((btn as HTMLElement).dataset.reservedBy ?? "").toLowerCase();
    (btn as HTMLElement).hidden = currentName !== reservedBy;
  });

  document.querySelectorAll(".reserve-btn").forEach((btn) => {
    const reservedBy = ((btn as HTMLElement).dataset.reservedBy ?? "").toLowerCase();
    const hasReservation = (btn as HTMLElement).dataset.hasReservation === "true";
    (btn as HTMLElement).hidden = hasReservation && currentName === reservedBy;
  });
}

updateButtons();

// End reservation logic
document.querySelectorAll(".end-reservation-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const env = (btn as HTMLElement).dataset.env!;
    const reservedBy = (btn as HTMLElement).dataset.reservedBy!;

    const response = await fetch("/api/end-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environment: env, reserved_by: reservedBy }),
    });

    if (response.ok) {
      window.location.reload();
    } else {
      const data = await response.json();
      alert(`Failed to end reservation: ${data.error}`);
    }
  });
});

// Reserve logic
let pendingEnv: string | null = null;

function getUntil(from: Date): Date {
  const value = durationSelect.value;
  if (value === "eod") {
    const eod = new Date(from);
    eod.setHours(23, 59, 59, 999);
    return eod;
  }
  return new Date(from.getTime() + Number(value) * 60 * 1000);
}

async function reserve(environment: string, force: boolean) {
  const name = nameInput.value.trim();
  if (!name) {
    alert("Please enter your name first.");
    return;
  }

  const now = new Date();
  const until = getUntil(now);

  const response = await fetch("/api/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      environment,
      reserved_by: name,
      reserved_from: now.toISOString(),
      reserved_until: until.toISOString(),
      force,
    }),
  });

  if (response.ok) {
    window.location.reload();
  } else {
    const data = await response.json();
    alert(`Failed to reserve: ${data.error}`);
  }
}

document.querySelectorAll(".reserve-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const env = (btn as HTMLElement).dataset.env!;
    const hasReservation = (btn as HTMLElement).dataset.hasReservation === "true";

    if (hasReservation) {
      pendingEnv = env;
      const reservedBy = (btn as HTMLElement).dataset.reservedBy ?? "Your colleague";
      document.getElementById("confirm-name")!.textContent = reservedBy;
      dialog.showModal();
    } else {
      reserve(env, false);
    }
  });
});

confirmYes.addEventListener("click", () => {
  dialog.close();
  if (pendingEnv) {
    reserve(pendingEnv, true);
    pendingEnv = null;
  }
});

confirmNo.addEventListener("click", () => {
  dialog.close();
  pendingEnv = null;
});

// Reload when the tab becomes visible again (e.g. after being idle in background)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    window.location.reload();
  }
});

// Set timers to reload when reservations expire
document.querySelectorAll(".env-card[data-expires]").forEach((card) => {
  const expires = (card as HTMLElement).dataset.expires;
  if (expires) {
    const msUntilExpiry = new Date(expires).getTime() - Date.now();
    if (msUntilExpiry > 0) {
      setTimeout(() => window.location.reload(), msUntilExpiry + 1000);
    }
  }
});

// Real-time: reload page when any reservation changes
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

supabase
  .channel("reservations-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "reservations" },
    () => {
      window.location.reload();
    }
  )
  .subscribe();
