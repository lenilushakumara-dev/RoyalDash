// Paste your deployed Google Apps Script web app URL here.
const API_URL = "https://script.google.com/macros/s/AKfycbxsGwslG1PSoESDogue5ODeS-pOJ3HdQWG7au7vBJ9QGa1oiBF-VWXJBzUjiz-M-vrT5A/exec";

const COLORS = {
  base: "#264653",
  baseDark: "#1d3540",
  income: "#2a9d8f",
  incomeDark: "#1f756c",
  expense: "#f4a261",
  expenseDark: "#a5531e",
  profit: "#2a9d8f",
  profitDark: "#1f756c",
  pending: "#90e0ef",
  pendingDark: "#0b7285",
  cancelled: "#e76f51",
  cancelledDark: "#a33f2b",
  ink: "#111827",
  muted: "#64748b",
  line: "#e2e8f0",
  surface: "#ffffff"
};

const SAMPLE_DATA = {
  bookings: [
    {
      "Booking ID": "B001",
      Date: "2026-06-07",
      "Time Slot": "Afternoon",
      "Total Price": 27000,
      Status: "Confirmed",
      "Driver Salary": 5000,
      Fuel: 4500,
      Decoration: 7000,
      "Other Job Expense": 0,
      "Other Explanation": "",
      Note: "New decoration"
    },
    {
      "Booking ID": "B002",
      Date: "2026-06-15",
      "Time Slot": "Morning",
      "Total Price": 24000,
      Status: "Pending",
      "Driver Salary": 4500,
      Fuel: 3500,
      Decoration: 5500,
      "Other Job Expense": "",
      "Other Explanation": "",
      Note: "Hotel pickup"
    },
    {
      "Booking ID": "B003",
      Date: "2026-06-23",
      "Time Slot": "Full Day",
      "Total Price": 42000,
      Status: "Confirmed",
      "Driver Salary": 7000,
      Fuel: 7500,
      Decoration: 9000,
      "Other Job Expense": 1500,
      "Other Explanation": "Parking",
      Note: ""
    },
    {
      "Booking ID": "B004",
      Date: "2026-06-25",
      "Time Slot": "Night",
      "Total Price": 18000,
      Status: "Cancelled",
      "Driver Salary": 0,
      Fuel: 0,
      Decoration: 0,
      "Other Job Expense": 0,
      "Other Explanation": "",
      Note: "Customer changed date"
    },
    {
      "Booking ID": "B005",
      Date: "2026-07-05",
      "Time Slot": "Afternoon",
      "Total Price": 30000,
      Status: "Pending",
      "Driver Salary": 5000,
      Fuel: 4200,
      Decoration: 6500,
      "Other Job Expense": 0,
      "Other Explanation": "",
      Note: ""
    }
  ],
  businessExpenses: [
    {
      Date: "2026-06-01",
      "Expense Type": "Ads",
      Amount: 10000,
      Explanation: "Facebook ad campaign"
    },
    {
      Date: "2026-06-12",
      "Expense Type": "Car Wash",
      Amount: 2500,
      Explanation: "Monthly deep clean"
    },
    {
      Date: "2026-06-20",
      "Expense Type": "Maintenance",
      Amount: 8500,
      Explanation: "Oil and inspection"
    },
    {
      Date: "2026-07-02",
      "Expense Type": "Insurance",
      Amount: 15000,
      Explanation: "Quarterly payment"
    }
  ]
};

const state = {
  bookings: [],
  businessExpenses: [],
  selectedDate: new Date(2026, 5, 1),
  charts: {}
};

const els = {
  selectedPeriod: document.querySelector("#selectedPeriod"),
  headerProfit: document.querySelector("#headerProfit"),
  monthSelect: document.querySelector("#monthSelect"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  statusBanner: document.querySelector("#statusBanner"),
  calendarGrid: document.querySelector("#calendarGrid"),
  bookingTableWrap: document.querySelector("#bookingTableWrap"),
  bookingCards: document.querySelector("#bookingCards"),
  expenseBreakdownTableWrap: document.querySelector("#expenseBreakdownTableWrap"),
  expenseBreakdownCards: document.querySelector("#expenseBreakdownCards"),
  jobExpenseTableWrap: document.querySelector("#jobExpenseTableWrap"),
  jobExpenseCards: document.querySelector("#jobExpenseCards"),
  expenseTableWrap: document.querySelector("#expenseTableWrap"),
  expenseCards: document.querySelector("#expenseCards"),
  bookingListMeta: document.querySelector("#bookingListMeta"),
  expenseBreakdownMeta: document.querySelector("#expenseBreakdownMeta"),
  jobExpenseListMeta: document.querySelector("#jobExpenseListMeta"),
  expenseListMeta: document.querySelector("#expenseListMeta"),
  investorSummary: document.querySelector("#investorSummary")
};

const kpiIds = [
  "expectedIncome",
  "confirmedIncome",
  "pendingIncome",
  "jobExpenses",
  "businessExpenses",
  "totalExpenses",
  "expectedProfit",
  "confirmedProfit",
  "bookingCount",
  "averageBookingPrice",
  "profitMargin",
  "confirmationRate"
];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  buildMonthSelect();
  attachEvents();
  await loadData();
  setInitialMonth();
  render();
}

async function loadData() {
  if (!hasApiUrl()) {
    state.bookings = normalizeBookings(SAMPLE_DATA.bookings);
    state.businessExpenses = normalizeExpenses(SAMPLE_DATA.businessExpenses);
    showBanner(
      "Add your Google Apps Script URL in script.js to connect live Google Sheet data. Sample data is showing for now.",
      "warning"
    );
    return;
  }

  showBanner("Loading Google Sheet data...", "");

  try {
    const response = await fetchWithTimeout(API_URL, 8000);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    state.bookings = normalizeBookings(data.bookings || []);
    state.businessExpenses = normalizeExpenses(data.businessExpenses || []);
    showBanner("", "");
  } catch (error) {
    state.bookings = [];
    state.businessExpenses = [];
    showBanner(
      `Could not load Google Sheet data. Check the API URL and deployment settings. ${error.message}`,
      "error"
    );
  }
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function hasApiUrl() {
  return API_URL && API_URL !== "PASTE_GOOGLE_APPS_SCRIPT_URL_HERE";
}

function attachEvents() {
  els.prevMonth.addEventListener("click", () => {
    state.selectedDate = addMonths(state.selectedDate, -1);
    syncMonthSelect();
    render();
  });

  els.nextMonth.addEventListener("click", () => {
    state.selectedDate = addMonths(state.selectedDate, 1);
    syncMonthSelect();
    render();
  });

  els.monthSelect.addEventListener("change", (event) => {
    const [year, month] = event.target.value.split("-").map(Number);
    state.selectedDate = new Date(year, month - 1, 1);
    render();
  });
}

function buildMonthSelect() {
  const today = new Date();
  const start = new Date(today.getFullYear() - 2, 0, 1);
  const end = new Date(today.getFullYear() + 2, 11, 1);
  const options = [];

  for (let date = start; date <= end; date = addMonths(date, 1)) {
    const value = monthKey(date);
    options.push(`<option value="${value}">${formatMonthYear(date)}</option>`);
  }

  els.monthSelect.innerHTML = options.join("");
}

function setInitialMonth() {
  const today = new Date();
  state.selectedDate = new Date(today.getFullYear(), today.getMonth(), 1);
  syncMonthSelect();
}

function syncMonthSelect() {
  const key = monthKey(state.selectedDate);
  const hasOption = [...els.monthSelect.options].some((option) => option.value === key);

  if (!hasOption) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = formatMonthYear(state.selectedDate);
    els.monthSelect.appendChild(option);
  }

  els.monthSelect.value = key;
}

function render() {
  const model = getMonthModel(state.selectedDate);

  els.selectedPeriod.textContent = formatMonthYear(state.selectedDate);
  renderKpis(model);
  renderInvestorSummary(model);
  renderCalendar(model);
  renderBookingList(model);
  renderExpenseBreakdownList(model);
  renderJobExpenseList(model);
  renderExpenseList(model);
  renderCharts(model);
}

function renderExpenseBreakdownList(model) {
  const rows = getExpenseBreakdownRows(model);
  els.expenseBreakdownMeta.textContent = `${formatCurrency(model.totals.totalExpenses)} total expenses in ${formatMonthYear(
    model.selectedDate
  )}.`;

  els.expenseBreakdownTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Expense Category</th>
          <th>Amount</th>
          <th>Share of Total</th>
        </tr>
      </thead>
      <tbody>${rows.map(renderExpenseBreakdownRow).join("")}</tbody>
    </table>
  `;

  els.expenseBreakdownCards.innerHTML = rows.map(renderExpenseBreakdownCard).join("");
}

function getExpenseBreakdownRows(model) {
  const total = model.totals.totalExpenses;
  const businessTypeRows = getBusinessExpenseTypeRows(model);
  const rows = [
    { category: "Driver Salary", amount: sum(model.monthlyBookings, "driverSalary") },
    { category: "Fuel", amount: sum(model.monthlyBookings, "fuel") },
    { category: "Decoration", amount: sum(model.monthlyBookings, "decoration") },
    { category: "Other Job Expense", amount: sum(model.monthlyBookings, "otherJobExpense") },
    ...businessTypeRows,
    { category: "Total Expenses", amount: total, isTotal: true }
  ];

  return rows.map((row) => ({
    ...row,
    percent: total ? (row.amount / total) * 100 : 0
  }));
}

function getBusinessExpenseTypeRows(model) {
  const totalsByType = model.monthlyExpenses.reduce((totals, expense) => {
    const type = expense.expenseType || "Other";
    totals[type] = (totals[type] || 0) + expense.amount;
    return totals;
  }, {});

  const rows = Object.entries(totalsByType)
    .map(([category, amount]) => ({
      category: normalizeExpenseBreakdownLabel(category),
      amount
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  if (!rows.some((row) => row.category === "Ads Spending")) {
    rows.unshift({ category: "Ads Spending", amount: 0 });
  }

  return rows;
}

function normalizeExpenseBreakdownLabel(category) {
  return category.toLowerCase() === "ads" ? "Ads Spending" : category;
}

function renderExpenseBreakdownRow(row) {
  return `
    <tr>
      <td>${row.isTotal ? "<strong>Total Expenses</strong>" : escapeHtml(row.category)}</td>
      <td>${row.isTotal ? `<strong>${formatCurrency(row.amount)}</strong>` : formatCurrency(row.amount)}</td>
      <td>${row.isTotal ? "<strong>100%</strong>" : formatPercent(row.percent)}</td>
    </tr>
  `;
}

function renderExpenseBreakdownCard(row) {
  return `
    <article class="detail-card">
      <h3>${escapeHtml(row.category)}</h3>
      <div class="detail-grid">
        ${detailItem("Amount", formatCurrency(row.amount))}
        ${detailItem("Share", row.isTotal ? "100%" : formatPercent(row.percent))}
      </div>
    </article>
  `;
}

function getMonthModel(selectedDate) {
  const selectedKey = monthKey(selectedDate);
  const monthlyBookings = state.bookings.filter((booking) => monthKey(booking.date) === selectedKey);
  const monthlyExpenses = state.businessExpenses.filter((expense) => monthKey(expense.date) === selectedKey);
  const monthlyJobExpenseRows = buildJobExpenseRows(monthlyBookings);
  const allBusinessExpenses = [...monthlyJobExpenseRows, ...monthlyExpenses];
  const activeBookings = monthlyBookings.filter((booking) => booking.status !== "Cancelled");
  const confirmedBookings = monthlyBookings.filter((booking) => booking.status === "Confirmed");
  const pendingBookings = monthlyBookings.filter((booking) => booking.status === "Pending");

  const confirmedIncome = sum(confirmedBookings, "totalPrice");
  const pendingIncome = sum(pendingBookings, "totalPrice");
  const expectedIncome = confirmedIncome + pendingIncome;
  const jobExpenses = sum(monthlyBookings, "jobExpenseTotal");
  const businessExpenses = sum(monthlyExpenses, "amount");
  const totalExpenses = sum(allBusinessExpenses, "amount");
  const expectedProfit = expectedIncome - totalExpenses;
  const confirmedProfit = confirmedIncome - totalExpenses;
  const averageBookingPrice = activeBookings.length ? expectedIncome / activeBookings.length : 0;
  const profitMargin = expectedIncome ? (expectedProfit / expectedIncome) * 100 : 0;
  const confirmationRate = activeBookings.length ? (confirmedBookings.length / activeBookings.length) * 100 : 0;

  return {
    selectedDate,
    selectedKey,
    monthlyBookings,
    monthlyExpenses,
    monthlyJobExpenseRows,
    allBusinessExpenses,
    activeBookings,
    confirmedBookings,
    pendingBookings,
    totals: {
      expectedIncome,
      confirmedIncome,
      pendingIncome,
      jobExpenses,
      businessExpenses,
      totalExpenses,
      expectedProfit,
      confirmedProfit,
      bookingCount: monthlyBookings.length,
      averageBookingPrice,
      profitMargin,
      confirmationRate
    }
  };
}

function buildJobExpenseRows(bookings) {
  return bookings
    .filter((booking) => booking.jobExpenseTotal > 0)
    .map((booking) => ({
      date: booking.date,
      expenseType: `Job Expense${booking.bookingId ? ` - ${booking.bookingId}` : ""}`,
      amount: booking.jobExpenseTotal,
      explanation: [
        `Driver ${formatCurrency(booking.driverSalary)}`,
        `Fuel ${formatCurrency(booking.fuel)}`,
        `Decoration ${formatCurrency(booking.decoration)}`,
        `Other ${formatCurrency(booking.otherJobExpense)}`,
        booking.timeSlot ? `Slot: ${booking.timeSlot}` : ""
      ].filter(Boolean).join("; ")
    }));
}

function renderKpis(model) {
  const totals = model.totals;

  setText("expectedIncome", formatCurrency(totals.expectedIncome));
  setText("confirmedIncome", formatCurrency(totals.confirmedIncome));
  setText("pendingIncome", formatCurrency(totals.pendingIncome));
  setText("jobExpenses", formatCurrency(totals.jobExpenses));
  setText("businessExpenses", formatCurrency(totals.businessExpenses));
  setText("totalExpenses", formatCurrency(totals.totalExpenses));
  setText("expectedProfit", formatCurrency(totals.expectedProfit));
  setText("confirmedProfit", formatCurrency(totals.confirmedProfit));
  setText("bookingCount", String(totals.bookingCount));
  setText("averageBookingPrice", formatCurrency(totals.averageBookingPrice));
  setText("profitMargin", formatPercent(totals.profitMargin));
  setText("confirmationRate", formatPercent(totals.confirmationRate));

  els.headerProfit.textContent = formatCurrency(totals.expectedProfit);
}

function renderInvestorSummary(model) {
  const month = formatMonthYear(model.selectedDate);
  const totals = model.totals;

  els.investorSummary.textContent = `In ${month}, Royal Eye Wedding Car has ${formatCurrency(
    totals.expectedIncome
  )} expected income, ${formatCurrency(totals.totalExpenses)} total expenses, and ${formatCurrency(
    totals.expectedProfit
  )} expected profit. Confirmation rate is ${formatPercent(totals.confirmationRate)}, with average booking value of ${formatCurrency(
    totals.averageBookingPrice
  )}.`;
}

function renderCalendar(model) {
  const year = model.selectedDate.getFullYear();
  const month = model.selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const byDate = groupBy(model.monthlyBookings, (booking) => dateKey(booking.date));
  const parts = [];

  for (let index = 0; index < cells; index += 1) {
    const dayNumber = index - startDay + 1;
    const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const dayDate = new Date(year, month, Math.max(dayNumber, 1));
    const bookings = isCurrentMonth ? byDate[dateKey(dayDate)] || [] : [];

    parts.push(`
      <article class="calendar-day${isCurrentMonth ? "" : " muted"}">
        <span class="day-number">${isCurrentMonth ? dayNumber : ""}</span>
        ${bookings.map(renderCalendarBooking).join("")}
      </article>
    `);
  }

  els.calendarGrid.innerHTML = parts.join("");
}

function renderCalendarBooking(booking) {
  return `
    <div class="booking-pill ${statusClass(booking.status)}">
      <strong>${escapeHtml(booking.timeSlot || "No slot")}</strong>
      <span>${formatCurrency(booking.totalPrice)} - ${escapeHtml(booking.status)}</span>
      <span>Profit ${formatCurrency(booking.jobProfit)}</span>
    </div>
  `;
}

function renderBookingList(model) {
  const bookings = [...model.monthlyBookings].sort((a, b) => a.date - b.date);
  els.bookingListMeta.textContent = `${bookings.length} booking${bookings.length === 1 ? "" : "s"} in ${formatMonthYear(model.selectedDate)}.`;

  if (!bookings.length) {
    const empty = `<div class="empty-state">No bookings found for this month.</div>`;
    els.bookingTableWrap.innerHTML = empty;
    els.bookingCards.innerHTML = empty;
    return;
  }

  els.bookingTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time Slot</th>
          <th>Total Price</th>
          <th>Status</th>
          <th>Driver</th>
          <th>Fuel</th>
          <th>Decoration</th>
          <th>Other</th>
          <th>Explanation</th>
          <th>Job Profit</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>${bookings.map(renderBookingRow).join("")}</tbody>
    </table>
  `;

  els.bookingCards.innerHTML = bookings.map(renderBookingCard).join("");
}

function renderBookingRow(booking) {
  return `
    <tr>
      <td>${formatDate(booking.date)}</td>
      <td>${escapeHtml(booking.timeSlot)}</td>
      <td>${formatCurrency(booking.totalPrice)}</td>
      <td><span class="badge ${statusClass(booking.status)}">${escapeHtml(booking.status)}</span></td>
      <td>${formatCurrency(booking.driverSalary)}</td>
      <td>${formatCurrency(booking.fuel)}</td>
      <td>${formatCurrency(booking.decoration)}</td>
      <td>${formatCurrency(booking.otherJobExpense)}</td>
      <td>${escapeHtml(booking.otherExplanation || "-")}</td>
      <td>${formatCurrency(booking.jobProfit)}</td>
      <td>${escapeHtml(booking.note || "-")}</td>
    </tr>
  `;
}

function renderBookingCard(booking) {
  return `
    <article class="detail-card">
      <h3>${formatDate(booking.date)} - ${escapeHtml(booking.timeSlot)}</h3>
      <div class="detail-grid">
        ${detailItem("Total Price", formatCurrency(booking.totalPrice))}
        ${detailItem("Status", `<span class="badge ${statusClass(booking.status)}">${escapeHtml(booking.status)}</span>`)}
        ${detailItem("Driver Salary", formatCurrency(booking.driverSalary))}
        ${detailItem("Fuel", formatCurrency(booking.fuel))}
        ${detailItem("Decoration", formatCurrency(booking.decoration))}
        ${detailItem("Other Expense", formatCurrency(booking.otherJobExpense))}
        ${detailItem("Other Explanation", escapeHtml(booking.otherExplanation || "-"))}
        ${detailItem("Job Profit", formatCurrency(booking.jobProfit))}
        ${detailItem("Note", escapeHtml(booking.note || "-"))}
      </div>
    </article>
  `;
}

function renderExpenseList(model) {
  const expenses = [...model.monthlyExpenses].sort((a, b) => a.date - b.date);
  els.expenseListMeta.textContent = `${formatCurrency(model.totals.businessExpenses)} general business expenses in ${formatMonthYear(
    model.selectedDate
  )}.`;

  if (!expenses.length) {
    const empty = `<div class="empty-state">No business expenses found for this month.</div>`;
    els.expenseTableWrap.innerHTML = empty;
    els.expenseCards.innerHTML = empty;
    return;
  }

  els.expenseTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Expense Type</th>
          <th>Amount</th>
          <th>Explanation</th>
        </tr>
      </thead>
      <tbody>${expenses.map(renderExpenseRow).join("")}</tbody>
    </table>
  `;

  els.expenseCards.innerHTML = expenses.map(renderExpenseCard).join("");
}

function renderJobExpenseList(model) {
  const expenses = [...model.monthlyJobExpenseRows].sort((a, b) => a.date - b.date);
  els.jobExpenseListMeta.textContent = `${formatCurrency(model.totals.jobExpenses)} job expenses in ${formatMonthYear(
    model.selectedDate
  )}.`;

  if (!expenses.length) {
    const empty = `<div class="empty-state">No job expenses found for this month.</div>`;
    els.jobExpenseTableWrap.innerHTML = empty;
    els.jobExpenseCards.innerHTML = empty;
    return;
  }

  els.jobExpenseTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Expense Type</th>
          <th>Amount</th>
          <th>Explanation</th>
        </tr>
      </thead>
      <tbody>${expenses.map(renderExpenseRow).join("")}</tbody>
    </table>
  `;

  els.jobExpenseCards.innerHTML = expenses.map(renderExpenseCard).join("");
}

function renderExpenseRow(expense) {
  return `
    <tr>
      <td>${formatDate(expense.date)}</td>
      <td>${escapeHtml(expense.expenseType)}</td>
      <td>${formatCurrency(expense.amount)}</td>
      <td>${escapeHtml(expense.explanation || "-")}</td>
    </tr>
  `;
}

function renderExpenseCard(expense) {
  return `
    <article class="detail-card">
      <h3>${formatDate(expense.date)} - ${escapeHtml(expense.expenseType)}</h3>
      <div class="detail-grid">
        ${detailItem("Amount", formatCurrency(expense.amount))}
        ${detailItem("Explanation", escapeHtml(expense.explanation || "-"))}
      </div>
    </article>
  `;
}

function renderCharts(model) {
  if (!window.Chart) {
    renderFallbackCharts(model);
    return;
  }

  renderMonthlyChart();
  renderExpenseBreakdownChart(model);
  renderStatusChart(model);
  renderSlotChart(model);
}

function renderFallbackCharts(model) {
  const monthKeys = getAvailableMonthKeys();
  const monthlyValues = monthKeys.map((key) => {
    const totals = getMonthModel(parseMonthKey(key)).totals;
    return {
      label: formatMonthYear(parseMonthKey(key)).slice(0, 3),
      income: totals.expectedIncome,
      expenses: totals.totalExpenses,
      profit: totals.expectedProfit
    };
  });

  drawFallbackBars("monthlyChart", monthlyValues);
  drawFallbackBreakdownBars("expenseChart", getExpenseBreakdown(model), true);
  drawFallbackBreakdownBars("statusChart", {
    Confirmed: model.monthlyBookings.filter((booking) => booking.status === "Confirmed").length,
    Pending: model.monthlyBookings.filter((booking) => booking.status === "Pending").length,
    Cancelled: model.monthlyBookings.filter((booking) => booking.status === "Cancelled").length
  }, false, getStatusColors());
  drawFallbackBreakdownBars("slotChart", getSlotBreakdown(model));
}

function renderMonthlyChart() {
  const monthKeys = getAvailableMonthKeys();
  const labels = monthKeys.map((key) => formatMonthYear(parseMonthKey(key)));
  const values = monthKeys.map((key) => {
    const model = getMonthModel(parseMonthKey(key));
    return model.totals;
  });

  upsertChart("monthlyChart", {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Income", data: values.map((item) => item.expectedIncome), backgroundColor: COLORS.income },
        { label: "Expenses", data: values.map((item) => item.totalExpenses), backgroundColor: COLORS.expense },
        { label: "Profit", data: values.map((item) => item.expectedProfit), backgroundColor: COLORS.profit }
      ]
    },
    options: chartOptions({ stacked: false })
  });
}

function renderExpenseBreakdownChart(model) {
  renderBarBreakdownChart("expenseChart", getExpenseBreakdown(model), true);
}

function renderStatusChart(model) {
  const breakdown = {
    Confirmed: model.monthlyBookings.filter((booking) => booking.status === "Confirmed").length,
    Pending: model.monthlyBookings.filter((booking) => booking.status === "Pending").length,
    Cancelled: model.monthlyBookings.filter((booking) => booking.status === "Cancelled").length
  };

  renderBarBreakdownChart("statusChart", breakdown, false, getStatusColors());
}

function renderSlotChart(model) {
  renderBarBreakdownChart("slotChart", getSlotBreakdown(model));
}

function getStatusColors() {
  return {
    Confirmed: COLORS.profit,
    Pending: COLORS.pending,
    Cancelled: COLORS.cancelled
  };
}

function getExpenseBreakdown(model) {
  const breakdown = {
    Driver: sum(model.monthlyBookings, "driverSalary"),
    Fuel: sum(model.monthlyBookings, "fuel"),
    Decoration: sum(model.monthlyBookings, "decoration"),
    "Other Job": sum(model.monthlyBookings, "otherJobExpense")
  };

  model.monthlyExpenses.forEach((expense) => {
    breakdown[expense.expenseType] = (breakdown[expense.expenseType] || 0) + expense.amount;
  });

  return breakdown;
}

function getSlotBreakdown(model) {
  const breakdown = {
    Morning: 0,
    Afternoon: 0,
    Night: 0,
    "Full Day": 0
  };

  model.monthlyBookings.forEach((booking) => {
    breakdown[booking.timeSlot] = (breakdown[booking.timeSlot] || 0) + 1;
  });

  return breakdown;
}

function drawFallbackBars(id, values) {
  const canvas = document.getElementById(id);
  const context = prepareCanvas(canvas);
  const width = canvas.width;
  const height = canvas.height;
  const padding = 36;
  const bottom = height - 34;
  const max = Math.max(1, ...values.flatMap((item) => [item.income, item.expenses, item.profit]));
  const colors = [COLORS.income, COLORS.expense, COLORS.profit];

  context.clearRect(0, 0, width, height);
  context.fillStyle = COLORS.ink;
  context.font = "13px Arial";
  context.fillText("Offline chart view", padding, 18);

  values.forEach((item, index) => {
    const groupWidth = (width - padding * 2) / Math.max(values.length, 1);
    const startX = padding + index * groupWidth + 8;
    const barWidth = Math.max(10, (groupWidth - 18) / 3);
    [item.income, item.expenses, item.profit].forEach((value, barIndex) => {
      const barHeight = Math.max(2, (Math.max(value, 0) / max) * (height - 86));
      context.fillStyle = colors[barIndex];
      context.fillRect(startX + barIndex * barWidth, bottom - barHeight, barWidth - 2, barHeight);
    });
    context.fillStyle = COLORS.muted;
    context.fillText(item.label, startX, height - 10);
  });

  drawLegend(context, [
    ["Income", colors[0]],
    ["Expenses", colors[1]],
    ["Profit", colors[2]]
  ], padding, 34);
}

function drawFallbackBreakdownBars(id, data, currencyLabels = false, colorMap = {}) {
  const canvas = document.getElementById(id);
  const context = prepareCanvas(canvas);
  const entries = Object.entries(data).filter(([, value]) => value > 0);
  const safeEntries = entries.length ? entries : [["No data", 1]];
  const colors = [COLORS.income, COLORS.pending, COLORS.expense, COLORS.cancelled, COLORS.base, COLORS.incomeDark, COLORS.profitDark];
  const width = canvas.width;
  const height = canvas.height;
  const padding = 34;
  const chartTop = 28;
  const chartBottom = Math.max(112, height - 82);
  const max = Math.max(1, ...safeEntries.map(([, value]) => value));

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = COLORS.line;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding, chartBottom);
  context.lineTo(width - padding, chartBottom);
  context.stroke();

  safeEntries.forEach(([label, value], index) => {
    const groupWidth = (width - padding * 2) / Math.max(safeEntries.length, 1);
    const barWidth = Math.max(18, Math.min(46, groupWidth * 0.55));
    const x = padding + index * groupWidth + (groupWidth - barWidth) / 2;
    const barHeight = Math.max(2, (value / max) * (chartBottom - chartTop));
    const y = chartBottom - barHeight;
    context.fillStyle = entries.length ? colorMap[label] || colors[index % colors.length] : COLORS.line;
    context.fillRect(x, y, barWidth, barHeight);
    context.fillStyle = COLORS.muted;
    context.font = "11px Arial";
    context.fillText(String(label).slice(0, 10), x - 4, chartBottom + 18);
  });

  const legend = safeEntries.map(([label, value], index) => [
    `${label}: ${currencyLabels && entries.length ? formatCurrency(value) : value}`,
    entries.length ? colorMap[label] || colors[index % colors.length] : COLORS.line
  ]);
  drawLegend(context, legend, 16, height - 54);
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width));
  canvas.height = Math.max(1, Math.floor(rect.height));
  return canvas.getContext("2d");
}

function drawLegend(context, items, x, y) {
  context.font = "12px Arial";
  items.forEach(([label, color], index) => {
    const rowY = y + index * 18;
    context.fillStyle = color;
    context.fillRect(x, rowY - 10, 10, 10);
    context.fillStyle = COLORS.ink;
    context.fillText(label, x + 16, rowY);
  });
}

function renderBarBreakdownChart(id, data, currencyLabels = false, colorMap = {}) {
  const entries = Object.entries(data).filter(([, value]) => value > 0);
  const labels = entries.length ? entries.map(([label]) => label) : ["No data"];
  const values = entries.length ? entries.map(([, value]) => value) : [1];
  const fallbackColors = [COLORS.income, COLORS.pending, COLORS.expense, COLORS.cancelled, COLORS.base, COLORS.incomeDark, COLORS.profitDark];
  const barColors = labels.map((label, index) => entries.length ? colorMap[label] || fallbackColors[index % fallbackColors.length] : COLORS.line);

  upsertChart(id, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total",
          data: values,
          backgroundColor: barColors,
          borderRadius: 6,
          borderWidth: 0,
          maxBarThickness: 52
        }
      ]
    },
    options: chartOptions({ breakdownLine: true, currencyLabels })
  });
}

function upsertChart(id, config) {
  const context = document.getElementById(id);

  if (state.charts[id]) {
    state.charts[id].destroy();
  }

  state.charts[id] = new Chart(context, config);
}

function chartOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          color: COLORS.ink,
          font: { family: "Arial" }
        }
      },
      tooltip: {
        callbacks: {
          label(context) {
            const value = context.parsed.y ?? context.parsed ?? 0;
            const label = context.dataset?.label || context.label || "";
            return `${label}: ${typeof value === "number" && value > 20 ? formatCurrency(value) : value}`;
          }
        }
      }
    },
    scales: extra.stacked === false
      ? {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { callback: (value) => formatCompactCurrency(value) } }
        }
      : extra.breakdownLine
        ? {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                callback: (value) => extra.currencyLabels ? formatCompactCurrency(value) : value
              }
            }
          }
      : undefined,
    cutout: extra.cutout
  };
}

function normalizeBookings(bookings) {
  return bookings
    .map((row) => {
      const date = parseSheetDate(getValue(row, "Date"));
      const status = normalizeStatus(getValue(row, "Status"));
      const booking = {
        bookingId: asText(getValue(row, "Booking ID")),
        date,
        timeSlot: asText(getValue(row, "Time Slot")),
        totalPrice: toNumber(getValue(row, "Total Price")),
        status,
        driverSalary: toNumber(getValue(row, "Driver Salary")),
        fuel: toNumber(getValue(row, "Fuel")),
        decoration: toNumber(getValue(row, "Decoration")),
        otherJobExpense: toNumber(getValue(row, "Other Job Expense")),
        otherExplanation: asText(getValue(row, "Other Explanation")),
        note: asText(getValue(row, "Note"))
      };

      booking.jobExpenseTotal = booking.driverSalary + booking.fuel + booking.decoration + booking.otherJobExpense;
      booking.jobProfit = booking.totalPrice - booking.jobExpenseTotal;
      return booking;
    })
    .filter((booking) => booking.date);
}

function normalizeExpenses(expenses) {
  return expenses
    .map((row) => ({
      date: parseSheetDate(getValue(row, "Date")),
      expenseType: asText(getValue(row, "Expense Type")) || "Other",
      amount: toNumber(getValue(row, "Amount")),
      explanation: asText(getValue(row, "Explanation"))
    }))
    .filter((expense) => expense.date);
}

function getValue(row, key) {
  if (!row) {
    return "";
  }

  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return row[key];
  }

  const normalizedKey = normalizeKey(key);
  const foundKey = Object.keys(row).find((candidate) => normalizeKey(candidate) === normalizedKey);
  return foundKey ? row[foundKey] : "";
}

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeStatus(value) {
  const status = asText(value).toLowerCase();
  if (status === "confirmed") return "Confirmed";
  if (status === "pending") return "Pending";
  if (status === "cancelled" || status === "canceled") return "Cancelled";
  return status ? status[0].toUpperCase() + status.slice(1) : "Pending";
}

function parseSheetDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 86400000);
  }

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function asText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function showBanner(message, type) {
  els.statusBanner.textContent = message;
  els.statusBanner.className = `status-banner${message ? " show" : ""}${type ? ` ${type}` : ""}`;
}

function sum(items, key) {
  return items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function getAvailableMonthKeys() {
  const keys = new Set([
    monthKey(state.selectedDate),
    ...state.bookings.map((booking) => monthKey(booking.date)),
    ...state.businessExpenses.map((expense) => monthKey(expense.date))
  ]);

  return [...keys].sort();
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function formatCurrency(value) {
  const rounded = Math.round(Number(value) || 0);
  return `Rs. ${rounded.toLocaleString("en-US")}`;
}

function formatCompactCurrency(value) {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 1000000) return `Rs. ${Math.round(number / 100000) / 10}M`;
  if (Math.abs(number) >= 1000) return `Rs. ${Math.round(number / 1000)}K`;
  return `Rs. ${number}`;
}

function formatPercent(value) {
  const number = Number(value) || 0;
  return `${Math.round(number)}%`;
}

function statusClass(status) {
  if (status === "Confirmed") return "status-confirmed";
  if (status === "Pending") return "status-pending";
  return "status-cancelled";
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
