const TRANSACTIONS_KEY = "ledgerlyTransactions";
const BUDGETS_KEY = "ledgerlyMonthlyBudgets";

const incomeCategories = [
  "Salary",
  "Bonus",
  "Freelance",
  "Gift",
  "Other income"
];

const expenseCategories = [
  "Food & dining",
  "Groceries",
  "Rent / Housing",
  "Utilities / Bills",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Insurance",
  "Subscriptions",
  "Other expense"
];

const spendingGroupRules = {
  "Food & dining": "Needs",
  "Groceries": "Needs",
  "Utilities / Bills": "Needs",
  "Insurance": "Needs",

  "Rent / Housing": "Rent / Housing",

  "Transport": "Transport",

  "Entertainment": "Entertainment",
  "Subscriptions": "Entertainment",

  "Shopping": "Shopping",

  "Health": "Health",

  "Education": "Education",

  "Other expense": "Other"
};

const chartColours = {
  "Needs": "#2563eb",
  "Rent / Housing": "#7c3aed",
  "Transport": "#0891b2",
  "Entertainment": "#db2777",
  "Shopping": "#ea580c",
  "Health": "#16a34a",
  "Education": "#ca8a04",
  "Other": "#64748b"
};

const selectedMonthInput = document.getElementById("selected-month");
const monthTitle = document.getElementById("month-title");

const incomeTotal = document.getElementById("income-total");
const expenseTotal = document.getElementById("expense-total");
const balanceTotal = document.getElementById("balance-total");

const transactionList = document.getElementById("transaction-list");
const categoryBreakdown = document.getElementById("category-breakdown");
const transactionFilter = document.getElementById("transaction-filter");

const budgetEmptyState = document.getElementById("budget-empty-state");
const budgetContent = document.getElementById("budget-content");
const budgetSpent = document.getElementById("budget-spent");
const budgetLimit = document.getElementById("budget-limit");
const budgetProgress = document.getElementById("budget-progress");
const budgetStatus = document.getElementById("budget-status");

const insightsEmptyState = document.getElementById("insights-empty-state");
const insightsContent = document.getElementById("insights-content");
const spendingDonut = document.getElementById("spending-donut");
const donutTotal = document.getElementById("donut-total");
const spendingLegend = document.getElementById("spending-legend");

const transactionModal = document.getElementById("transaction-modal");
const budgetModal = document.getElementById("budget-modal");

const transactionForm = document.getElementById("transaction-form");
const transactionCategory = document.getElementById("transaction-category");
const transactionDate = document.getElementById("transaction-date");

const budgetForm = document.getElementById("budget-form");
const budgetAmount = document.getElementById("budget-amount");

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function getTransactions() {
  const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
  return savedTransactions ? JSON.parse(savedTransactions) : [];
}

function saveTransactions(transactions) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

function getBudgets() {
  const savedBudgets = localStorage.getItem(BUDGETS_KEY);
  return savedBudgets ? JSON.parse(savedBudgets) : {};
}

function saveBudgets(budgets) {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

function createId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR"
  }).format(amount);
}

function formatMonth(monthValue) {
  const [year, month] = monthValue.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-SG", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTransactionDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function selectedMonthTransactions() {
  return getTransactions().filter((transaction) => {
    return transaction.date.startsWith(selectedMonthInput.value);
  });
}

function getSpendingGroup(category) {
  return spendingGroupRules[category] || "Other";
}

function updateCategoryOptions() {
  const selectedType = document.querySelector(
    'input[name="transaction-type"]:checked'
  ).value;

  const categories =
    selectedType === "income" ? incomeCategories : expenseCategories;

  transactionCategory.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    transactionCategory.appendChild(option);
  });
}

function renderSummary() {
  const transactions = selectedMonthTransactions();

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  incomeTotal.textContent = formatCurrency(income);
  expenseTotal.textContent = formatCurrency(expenses);
  balanceTotal.textContent = formatCurrency(income - expenses);

  monthTitle.textContent = `${formatMonth(selectedMonthInput.value)} summary`;
}

function renderBudget() {
  const budgets = getBudgets();
  const budget = Number(budgets[selectedMonthInput.value] || 0);

  const expenses = selectedMonthTransactions()
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  if (!budget || budget <= 0) {
    budgetEmptyState.classList.remove("hidden");
    budgetContent.classList.add("hidden");
    return;
  }

  budgetEmptyState.classList.add("hidden");
  budgetContent.classList.remove("hidden");

  const percentage = Math.min((expenses / budget) * 100, 100);
  const remaining = budget - expenses;

  budgetSpent.textContent = `${formatCurrency(expenses)} spent`;
  budgetLimit.textContent = `of ${formatCurrency(budget)}`;
  budgetProgress.style.width = `${percentage}%`;

  if (expenses > budget) {
    budgetProgress.style.background = "#dc2626";
    budgetStatus.textContent = `${formatCurrency(Math.abs(remaining))} above the limit.`;
  } else {
    budgetProgress.style.background = "#2563eb";
    budgetStatus.textContent = `${formatCurrency(remaining)} remaining in the selected limit.`;
  }
}

function renderCategories() {
  const expenses = selectedMonthTransactions().filter(
    (transaction) => transaction.type === "expense"
  );

  categoryBreakdown.innerHTML = "";

  if (expenses.length === 0) {
    categoryBreakdown.innerHTML = `
      <div class="empty-state">
        No expense categories to show for this month.
      </div>
    `;
    return;
  }

  const totals = {};

  expenses.forEach((transaction) => {
    totals[transaction.category] =
      (totals[transaction.category] || 0) + transaction.amount;
  });

  const categoryEntries = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const highestAmount = categoryEntries[0][1];

  categoryEntries.forEach(([category, amount]) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = category;

    const track = document.createElement("div");
    track.className = "category-track";

    const fill = document.createElement("div");
    fill.className = "category-fill";
    fill.style.width = `${(amount / highestAmount) * 100}%`;

    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "category-amount";
    value.textContent = formatCurrency(amount);

    row.append(name, track, value);
    categoryBreakdown.appendChild(row);
  });
}

function renderMonthlyInsights() {
  const expenses = selectedMonthTransactions().filter(
    (transaction) => transaction.type === "expense"
  );

  if (expenses.length === 0) {
    insightsEmptyState.classList.remove("hidden");
    insightsContent.classList.add("hidden");
    return;
  }

  insightsEmptyState.classList.add("hidden");
  insightsContent.classList.remove("hidden");

  const groupTotals = {};

  expenses.forEach((transaction) => {
    const group = getSpendingGroup(transaction.category);

    groupTotals[group] =
      (groupTotals[group] || 0) + transaction.amount;
  });

  const totalExpenses = Object.values(groupTotals).reduce(
    (total, amount) => total + amount,
    0
  );

  const groups = Object.entries(groupTotals).sort(
    (a, b) => b[1] - a[1]
  );

  donutTotal.textContent = formatCurrency(totalExpenses);

  let currentDegree = 0;

  const gradientParts = groups.map(([group, amount]) => {
    const percentage = (amount / totalExpenses) * 100;
    const degree = (percentage / 100) * 360;

    const startDegree = currentDegree;
    const endDegree = currentDegree + degree;

    currentDegree = endDegree;

    const colour = chartColours[group] || chartColours.Other;

    return `${colour} ${startDegree}deg ${endDegree}deg`;
  });

  spendingDonut.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  spendingLegend.innerHTML = "";

  groups.forEach(([group, amount]) => {
    const percentage = (amount / totalExpenses) * 100;
    const colour = chartColours[group] || chartColours.Other;

    const row = document.createElement("div");
    row.className = "legend-row";

    const colourDot = document.createElement("span");
    colourDot.className = "legend-colour";
    colourDot.style.backgroundColor = colour;

    const groupName = document.createElement("span");
    groupName.className = "legend-name";
    groupName.textContent = group;

    const values = document.createElement("span");
    values.className = "legend-value";
    values.innerHTML = `
      <strong>${percentage.toFixed(1)}%</strong><br>
      ${formatCurrency(amount)}
    `;

    row.append(colourDot, groupName, values);
    spendingLegend.appendChild(row);
  });
}

function renderTransactions() {
  const filter = transactionFilter.value;

  const transactions = selectedMonthTransactions()
    .filter((transaction) => {
      return filter === "all" || transaction.type === filter;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    transactionList.innerHTML = `
      <div class="empty-state">
        No transactions found for this month.
      </div>
    `;
    return;
  }

  transactions.forEach((transaction) => {
    const item = document.createElement("article");
    item.className = "transaction-item";

    const left = document.createElement("div");
    left.className = "transaction-left";

    const icon = document.createElement("div");
    icon.className = `transaction-icon ${transaction.type}`;
    icon.textContent = transaction.type === "income" ? "↓" : "↑";

    const details = document.createElement("div");

    const name = document.createElement("p");
    name.className = "transaction-name";
    name.textContent = transaction.name;

    const meta = document.createElement("p");
    meta.className = "transaction-meta";
    meta.textContent = `${transaction.category} · ${formatTransactionDate(transaction.date)}`;

    details.append(name, meta);
    left.append(icon, details);

    const right = document.createElement("div");
    right.className = "transaction-right";

    const amount = document.createElement("span");
    amount.className = `transaction-amount ${transaction.type}`;
    amount.textContent = `${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      deleteTransaction(transaction.id);
    });

    right.append(amount, deleteButton);
    item.append(left, right);

    transactionList.appendChild(item);
  });
}

function renderAll() {
  renderSummary();
  renderBudget();
  renderCategories();
  renderMonthlyInsights();
  renderTransactions();
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function deleteTransaction(id) {
  const confirmed = window.confirm("Delete this transaction?");

  if (!confirmed) {
    return;
  }

  const updatedTransactions = getTransactions().filter(
    (transaction) => transaction.id !== id
  );

  saveTransactions(updatedTransactions);
  renderAll();
}

function exportSelectedMonth() {
  const transactions = selectedMonthTransactions().sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (transactions.length === 0) {
    window.alert("There are no transactions to export for this month.");
    return;
  }

  const rows = [
    ["Date", "Type", "Description", "Category", "Amount"],
    ...transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.name,
      transaction.category,
      transaction.amount.toFixed(2)
    ])
  ];

  const csv = rows
    .map((row) => {
      return row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",");
    })
    .join("\n");

  const file = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(file);
  link.download = `ledgerly-${selectedMonthInput.value}.csv`;

  link.click();

  URL.revokeObjectURL(link.href);
}

selectedMonthInput.value = getCurrentMonthValue();
transactionDate.value = new Date().toISOString().slice(0, 10);

document
  .querySelectorAll('input[name="transaction-type"]')
  .forEach((radio) => {
    radio.addEventListener("change", updateCategoryOptions);
  });

document
  .getElementById("open-transaction-modal")
  .addEventListener("click", () => {
    transactionForm.reset();

    transactionDate.value = new Date()
      .toISOString()
      .slice(0, 10);

    document.querySelector(
      'input[name="transaction-type"][value="expense"]'
    ).checked = true;

    updateCategoryOptions();
    openModal(transactionModal);
  });

document
  .getElementById("set-budget-button")
  .addEventListener("click", () => {
    const budgets = getBudgets();

    budgetAmount.value =
      budgets[selectedMonthInput.value] || "";

    openModal(budgetModal);
  });

document
  .getElementById("edit-budget-button")
  .addEventListener("click", () => {
    const budgets = getBudgets();

    budgetAmount.value =
      budgets[selectedMonthInput.value] || "";

    openModal(budgetModal);
  });

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.dataset.closeModal;
    closeModal(document.getElementById(modalId));
  });
});

selectedMonthInput.addEventListener("change", renderAll);

transactionFilter.addEventListener("change", renderTransactions);

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("transaction-name").value.trim();
  const amount = Number(
    document.getElementById("transaction-amount").value
  );

  const date = transactionDate.value;

  const type = document.querySelector(
    'input[name="transaction-type"]:checked'
  ).value;

  if (!name || !amount || amount <= 0 || !date) {
    return;
  }

  const transactions = getTransactions();

  transactions.push({
    id: createId(),
    name: name,
    amount: amount,
    date: date,
    type: type,
    category: transactionCategory.value
  });

  saveTransactions(transactions);

  closeModal(transactionModal);
  renderAll();
});

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const budgets = getBudgets();
  const amount = Number(budgetAmount.value);

  if (amount > 0) {
    budgets[selectedMonthInput.value] = amount;
  } else {
    delete budgets[selectedMonthInput.value];
  }

  saveBudgets(budgets);

  closeModal(budgetModal);
  renderBudget();
});

document
  .getElementById("export-button")
  .addEventListener("click", exportSelectedMonth);

updateCategoryOptions();
renderAll();