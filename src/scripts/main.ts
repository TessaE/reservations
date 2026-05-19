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