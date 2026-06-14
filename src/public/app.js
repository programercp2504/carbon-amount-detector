/**
 * EcoFootprint Frontend Controller
 */

// Application State
let state = {
  inputs: {
    electricity: 300,
    electricityGreen: false,
    gas: 0,
    heatingOil: 0,
    carDistance: 8000,
    carFuel: 'petrol',
    transitHours: 2,
    flightHours: 0,
    dietType: 'average',
    wasteGenerated: 40,
    recyclingRate: 30,
    shoppingHabits: 'average'
  },
  breakdown: {
    energy: 1386, // default pre-populated averages
    transport: 1484.8,
    diet: 1700,
    waste: 640
  },
  total: 5210.8,
  actionLogs: [], // logged daily actions
  actionsList: [], // loaded from API
  monthlyGoalSaved: 0,
  monthlyGoalTarget: 100 // target kg CO2e to save per month
};

// SVG Donut Chart Configuration
const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40 -> ~251.327

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initializes the application state, loads local storage, and renders UI components.
 */
async function initApp() {
  loadFromLocalStorage();
  setupEventListeners();
  
  // Load actions list from Express API
  await fetchActions();
  
  // Update all UI values and render charts
  syncSlidersToLabels();
  syncInputsToForm();
  updateUI();
}

/* ==========================================================================
   State Management & LocalStorage
   ========================================================================== */

function saveToLocalStorage() {
  localStorage.setItem('eco_state', JSON.stringify({
    inputs: state.inputs,
    breakdown: state.breakdown,
    total: state.total,
    actionLogs: state.actionLogs,
    monthlyGoalSaved: state.monthlyGoalSaved
  }));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('eco_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.inputs = parsed.inputs || state.inputs;
      state.breakdown = parsed.breakdown || state.breakdown;
      state.total = parsed.total || state.total;
      state.actionLogs = parsed.actionLogs || state.actionLogs;
      state.monthlyGoalSaved = parsed.monthlyGoalSaved || 0;
    } catch (e) {
      console.error('Error parsing localStorage state:', e);
    }
  }
}

/**
 * Fetch actions from API
 */
async function fetchActions() {
  try {
    const response = await fetch('/api/actions');
    const result = await response.json();
    if (result.success) {
      state.actionsList = result.data;
    }
  } catch (err) {
    console.error('Failed to fetch actions list:', err);
    // Fallback actions list in case of network issues
    state.actionsList = [
      { id: 'green_energy', title: 'Switch to Green Energy', category: 'energy', difficulty: 'Easy', annualSavingsKg: 1200, impactLevel: 'High', description: 'Switch your power grid option to renewable resources.' },
      { id: 'public_transit', title: 'Commute via Public Transit', category: 'transport', difficulty: 'Medium', annualSavingsKg: 800, impactLevel: 'High', description: 'Replace vehicle commutes with train or bus trips.' },
      { id: 'plant_diet', title: 'Adopt a Plant-Based Diet', category: 'diet', difficulty: 'Hard', annualSavingsKg: 1000, impactLevel: 'High', description: 'Switch from meat consumption to organic plants.' },
      { id: 'reduce_waste', title: 'Halve Household Food Waste', category: 'waste', difficulty: 'Medium', annualSavingsKg: 150, impactLevel: 'Medium', description: 'Plan meals, buy only what is needed, and compost.' }
    ];
  }
}

/* ==========================================================================
   UI Event Handlers & Syncing
   ========================================================================== */

function setupEventListeners() {
  // Navigation Tabs switching
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Sliders movement update labels
  const sliders = [
    { id: 'input-electricity', labelId: 'val-electricity', suffix: ' kWh/month' },
    { id: 'input-gas', labelId: 'val-gas', suffix: ' kWh/month' },
    { id: 'input-heatingOil', labelId: 'val-heatingOil', suffix: ' Liters/month' },
    { id: 'input-carDistance', labelId: 'val-carDistance', suffix: ' km/year' },
    { id: 'input-transitHours', labelId: 'val-transitHours', suffix: ' hours/week' },
    { id: 'input-flightHours', labelId: 'val-flightHours', suffix: ' hours/year' },
    { id: 'input-wasteGenerated', labelId: 'val-wasteGenerated', suffix: ' kg/month' },
    { id: 'input-recyclingRate', labelId: 'val-recyclingRate', suffix: ' %' }
  ];

  sliders.forEach(s => {
    const sliderEl = document.getElementById(s.id);
    const labelEl = document.getElementById(s.labelId);
    if (sliderEl && labelEl) {
      sliderEl.addEventListener('input', () => {
        labelEl.textContent = Number(sliderEl.value).toLocaleString() + s.suffix;
      });
    }
  });

  // Form Submission
  const form = document.getElementById('calculator-form');
  form.addEventListener('submit', handleCalculatorSubmit);

  // Clear Logs
  document.getElementById('clear-logs-btn').addEventListener('click', () => {
    state.actionLogs = [];
    state.monthlyGoalSaved = 0;
    saveToLocalStorage();
    updateUI();
  });

  // Data management
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  const fileInput = document.getElementById('import-file');
  const importBtn = document.getElementById('import-data-btn');
  const fileDisplay = document.getElementById('import-file-name');
  
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      fileDisplay.textContent = fileInput.files[0].name;
      importBtn.removeAttribute('disabled');
    } else {
      fileDisplay.textContent = 'No file chosen';
      importBtn.setAttribute('disabled', 'true');
    }
  });

  importBtn.addEventListener('click', importData);
  document.getElementById('reset-app-btn').addEventListener('click', resetApp);
}

/**
 * Tab switching controller
 */
function switchTab(tabId) {
  // Toggle Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Toggle Tab content
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tab-${tabId}`);
  });

  // Set Topbar title dynamically
  const titles = {
    dashboard: { title: 'Personal Dashboard', subtitle: 'Track your carbon journey and log green actions.' },
    calculator: { title: 'Carbon Footprint Calculator', subtitle: 'Input your energy, transport, and consumption details.' },
    actions: { title: 'Action Tracker', subtitle: 'Check off actions today to log carbon savings.' },
    insights: { title: 'Personalized Insights', subtitle: 'Detailed categories analysis and tailored recommendations.' },
    data: { title: 'Data Center & Settings', subtitle: 'Export, import, or reset your local environment.' }
  };

  const header = titles[tabId];
  if (header) {
    document.getElementById('page-title').textContent = header.title;
    document.getElementById('page-subtitle').textContent = header.subtitle;
  }

  // Hook for actions loading
  if (tabId === 'actions') {
    renderActionsList('all');
  } else if (tabId === 'insights') {
    renderInsights();
  }
}

/**
 * Update slider labels on init
 */
function syncSlidersToLabels() {
  const mappings = [
    { id: 'input-electricity', labelId: 'val-electricity', suffix: ' kWh/month' },
    { id: 'input-gas', labelId: 'val-gas', suffix: ' kWh/month' },
    { id: 'input-heatingOil', labelId: 'val-heatingOil', suffix: ' Liters/month' },
    { id: 'input-carDistance', labelId: 'val-carDistance', suffix: ' km/year' },
    { id: 'input-transitHours', labelId: 'val-transitHours', suffix: ' hours/week' },
    { id: 'input-flightHours', labelId: 'val-flightHours', suffix: ' hours/year' },
    { id: 'input-wasteGenerated', labelId: 'val-wasteGenerated', suffix: ' kg/month' },
    { id: 'input-recyclingRate', labelId: 'val-recyclingRate', suffix: ' %' }
  ];

  mappings.forEach(m => {
    const slider = document.getElementById(m.id);
    const label = document.getElementById(m.labelId);
    if (slider && label) {
      slider.value = state.inputs[slider.name] !== undefined ? state.inputs[slider.name] : slider.value;
      label.textContent = Number(slider.value).toLocaleString() + m.suffix;
    }
  });
}

/**
 * Sync checkbox and options on load
 */
function syncInputsToForm() {
  // Checkbox green tariff
  document.getElementById('input-electricityGreen').checked = state.inputs.electricityGreen;
  // Dropdown fuel type
  document.getElementById('input-carFuel').value = state.inputs.carFuel;
  // Diet radio card
  const dietRadio = document.querySelector(`input[name="dietType"][value="${state.inputs.dietType}"]`);
  if (dietRadio) dietRadio.checked = true;
  // Shopping habits button
  const shoppingRadio = document.querySelector(`input[name="shoppingHabits"][value="${state.inputs.shoppingHabits}"]`);
  if (shoppingRadio) shoppingRadio.checked = true;
}

/**
 * Handle Calculator Form Submission
 */
async function handleCalculatorSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  // Build payload
  const payload = {
    electricity: formData.get('electricity'),
    electricityGreen: formData.get('electricityGreen') === 'on',
    gas: formData.get('gas'),
    heatingOil: formData.get('heatingOil'),
    carDistance: formData.get('carDistance'),
    carFuel: formData.get('carFuel'),
    transitHours: formData.get('transitHours'),
    flightHours: formData.get('flightHours'),
    dietType: formData.get('dietType'),
    wasteGenerated: formData.get('wasteGenerated'),
    recyclingRate: formData.get('recyclingRate'),
    shoppingHabits: formData.get('shoppingHabits')
  };

  const calculateBtn = document.getElementById('calculate-btn');
  const errorAlert = document.getElementById('calculator-errors');
  
  calculateBtn.setAttribute('disabled', 'true');
  calculateBtn.innerText = 'Calculating...';
  errorAlert.classList.add('hidden');

  try {
    const response = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update local state
      state.inputs = result.data.inputs;
      state.breakdown = result.data.breakdown;
      state.total = result.data.total;
      
      saveToLocalStorage();
      updateUI();
      
      // Navigate to dashboard
      switchTab('dashboard');
    } else {
      // Validation error
      let errorMsg = '<strong>Validation Error:</strong><br>';
      Object.keys(result.errors).forEach(key => {
        errorMsg += `- ${result.errors[key]}<br>`;
      });
      errorAlert.innerHTML = errorMsg;
      errorAlert.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Calculation API network request failed:', err);
    errorAlert.innerHTML = '<strong>Connection Error:</strong> Could not connect to validation API. Please verify server status.';
    errorAlert.classList.remove('hidden');
  } finally {
    calculateBtn.removeAttribute('disabled');
    calculateBtn.innerHTML = 'Calculate Carbon Footprint <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
  }
}

/* ==========================================================================
   UI Rendering & Rendering Helpers
   ========================================================================== */

/**
 * Updates all dashboard and topbar metrics, renders the SVG donut chart
 */
function updateUI() {
  // Set header carbon footprint value
  const totalRounded = Math.round(state.total);
  document.getElementById('header-footprint-val').textContent = `${totalRounded.toLocaleString()} kg`;
  document.getElementById('header-saved-val').textContent = `${Math.round(state.monthlyGoalSaved)} kg`;

  // Update comparison user value and progress bars
  document.getElementById('compare-user-val').textContent = `${totalRounded.toLocaleString()} kg`;
  
  // Normalize comparison bar (max 10,000 kg for display ratio)
  const userPercent = Math.min((state.total / 10000) * 100, 100);
  document.getElementById('compare-user-fill').style.width = `${userPercent}%`;

  // Render SVG Donut Chart
  renderDonutChart();

  // Render Progress Goal
  const progressPercent = Math.min((state.monthlyGoalSaved / state.monthlyGoalTarget) * 100, 100);
  document.getElementById('goal-progress-fill').style.width = `${progressPercent}%`;
  document.getElementById('goal-saved-val').textContent = `${Math.round(state.monthlyGoalSaved)} kg`;
  
  // Render daily action logs in table
  renderActionLogsTable();

  // Setup dynamic daily tip based on highest emission category
  const categories = Object.keys(state.breakdown);
  const highestCategory = categories.reduce((a, b) => state.breakdown[a] > state.breakdown[b] ? a : b, 'energy');
  const tipBox = document.getElementById('dashboard-quick-tip');
  
  const tips = {
    energy: 'Your home energy represents your largest contribution. Consider upgrading to smart lighting or adjusting your heating schedule.',
    transport: 'Your transit emissions are relatively high. Cycling, carpooling, or walking short trips can make a rapid impact.',
    diet: 'Your diet accounts for a prominent share of greenhouse gas footprint. Eating plant-based meals twice a week reduces emissions.',
    waste: 'Your consumer habits and waste are primary drivers. Try buying second-hand items and improving your sorting rate.'
  };

  tipBox.innerHTML = `<strong>Tip of the Day:</strong> ${tips[highestCategory]}`;
}

/**
 * Custom light weight SVG donut chart generator.
 * Eliminates large external chart package dependencies (improves efficiency).
 */
function renderDonutChart() {
  const svg = document.getElementById('donut-chart');
  
  // Clear dynamically added circles (only retain background track circle)
  while (svg.children.length > 1) {
    svg.removeChild(svg.lastChild);
  }

  const chartValue = document.getElementById('chart-total-val');
  
  if (state.total <= 0) {
    chartValue.textContent = '0';
    return;
  }

  chartValue.textContent = Math.round(state.total).toLocaleString();

  const categories = [
    { name: 'energy', label: 'Home Energy', val: state.breakdown.energy, color: '#00e676' },
    { name: 'transport', label: 'Transport', val: state.breakdown.transport, color: '#0284c7' },
    { name: 'diet', label: 'Diet & Food', val: state.breakdown.diet, color: '#ea580c' },
    { name: 'waste', label: 'Waste & Buying', val: state.breakdown.waste, color: '#94a3b8' }
  ];

  let accumulatedLength = 0;
  const legendContainer = document.getElementById('chart-legend');
  legendContainer.innerHTML = '';

  categories.forEach(cat => {
    const share = cat.val / state.total;
    const percentage = Math.round(share * 100);

    // Create Legend Entry
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-info">
        <span class="legend-color" style="background-color: ${cat.color};"></span>
        <span class="legend-name">${cat.label}</span>
      </div>
      <span class="legend-value">${cat.val.toLocaleString()} kg (${percentage}%)</span>
    `;
    legendContainer.appendChild(legendItem);

    if (cat.val <= 0) return;

    // Draw SVG arc path using circle dashoffset technique
    const strokeLength = share * CIRCUMFERENCE;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '40');
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', cat.color);
    circle.setAttribute('stroke-width', '12');
    circle.setAttribute('stroke-dasharray', `${strokeLength} ${CIRCUMFERENCE}`);
    circle.setAttribute('stroke-dashoffset', (-accumulatedLength).toString());
    circle.style.transition = 'stroke-dashoffset 0.6s ease';
    
    svg.appendChild(circle);

    accumulatedLength += strokeLength;
  });
}

/**
 * Render Action logs table
 */
function renderActionLogsTable() {
  const body = document.getElementById('action-log-body');
  if (state.actionLogs.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">No actions logged yet. Go to the Action Tracker to log daily actions!</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = '';
  // Sort logs by newest date
  const sortedLogs = [...state.actionLogs].reverse();
  
  sortedLogs.forEach(log => {
    const tr = document.createElement('tr');
    const formattedDate = new Date(log.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td><strong>${log.title}</strong></td>
      <td><span class="badge badge-difficulty">${log.category}</span></td>
      <td class="text-green font-bold">-${log.savings} kg</td>
    `;
    body.appendChild(tr);
  });
}

/* ==========================================================================
   Action Tracker Implementation
   ========================================================================== */

/**
 * Render Action Cards inside actions list container.
 */
function renderActionsList(filter = 'all') {
  const container = document.getElementById('actions-list-container');
  container.innerHTML = '';

  // Setup category filter chips click
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-filter') === filter);
    // Bind click dynamically if not already bound (avoid duplicate bindings)
    if (!chip.dataset.bound) {
      chip.addEventListener('click', () => {
        renderActionsList(chip.getAttribute('data-filter'));
      });
      chip.dataset.bound = 'true';
    }
  });

  const filtered = filter === 'all' 
    ? state.actionsList 
    : state.actionsList.filter(a => a.category === filter);

  if (filtered.length === 0) {
    container.innerHTML = `<p class="col-3 text-center text-muted">No actions available in this category.</p>`;
    return;
  }

  filtered.forEach(action => {
    const card = document.createElement('article');
    card.className = 'action-card';

    // Calculate daily representation of savings (Annual savings / 365)
    const dailySavings = Math.round((action.annualSavingsKg / 365) * 10) / 10;

    card.innerHTML = `
      <div class="action-badge-row">
        <span class="badge badge-difficulty">${action.difficulty}</span>
        <span class="badge badge-impact ${action.impactLevel.toLowerCase()}">${action.impactLevel} Impact</span>
      </div>
      <h3>${action.title}</h3>
      <p>${action.description}</p>
      
      <div class="savings-highlight">
        <span class="savings-label">Daily Carbon Saved:</span>
        <span class="savings-value">-${dailySavings} kg CO2e</span>
      </div>
      
      <div class="action-card-footer">
        <button class="btn btn-primary btn-sm log-action-btn" data-id="${action.id}">
          Log Action Today
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Bind Log Action button click handlers
  container.querySelectorAll('.log-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const actionId = btn.getAttribute('data-id');
      logAction(actionId);
    });
  });
}

/**
 * Log action execution
 */
function logAction(actionId) {
  const action = state.actionsList.find(a => a.id === actionId);
  if (!action) return;

  const dailySavings = Math.round((action.annualSavingsKg / 365) * 10) / 10;
  
  // Log into action log state
  const logEntry = {
    id: Date.now().toString(),
    actionId: action.id,
    title: action.title,
    category: action.category,
    savings: dailySavings,
    date: new Date().toISOString()
  };

  state.actionLogs.push(logEntry);
  state.monthlyGoalSaved += dailySavings;

  saveToLocalStorage();
  updateUI();

  // Highlight button feedback
  const btn = document.querySelector(`.log-action-btn[data-id="${actionId}"]`);
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '✔ Logged!';
    btn.style.background = 'var(--accent-emerald)';
    btn.setAttribute('disabled', 'true');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
      btn.removeAttribute('disabled');
    }, 1200);
  }
}

/* ==========================================================================
   Insights Section Generator
   ========================================================================== */

/**
 * Generates categories report dynamically inside insights panels
 */
function renderInsights() {
  const listContainer = document.getElementById('insights-priorities-list');
  const detailsContainer = document.getElementById('insights-category-details');

  listContainer.innerHTML = '';
  detailsContainer.innerHTML = '';

  if (state.total <= 0) {
    detailsContainer.innerHTML = `
      <div class="quick-tip-box">
        <strong>Please Calculate First:</strong> Navigate to the calculator and input your parameters to generate custom insights reports.
      </div>
    `;
    return;
  }

  // 1. Calculate ratios and sort categories by highest contribution
  const categories = [
    { name: 'energy', label: 'Home Energy', val: state.breakdown.energy, color: 'energy' },
    { name: 'transport', label: 'Transport & Travel', val: state.breakdown.transport, color: 'transport' },
    { name: 'diet', label: 'Diet & Food', val: state.breakdown.diet, color: 'diet' },
    { name: 'waste', label: 'Waste & Buying', val: state.breakdown.waste, color: 'waste' }
  ];

  const sortedCategories = [...categories].sort((a, b) => b.val - a.val);

  // 2. Render details panel for each category
  sortedCategories.forEach(cat => {
    const share = cat.val / state.total;
    const percentage = Math.round(share * 100);
    
    const panel = document.createElement('div');
    panel.className = 'insight-panel';

    let evaluation = '';
    let recommendation = '';

    if (cat.name === 'energy') {
      evaluation = cat.val > 1500 
        ? 'Your home energy consumption is higher than average, mostly due to standard heating grid factors or high usage.' 
        : 'Your energy footprint is well-managed. Good work keeping heating and appliance usage optimized.';
      recommendation = 'Consider solar panels, smart thermostat setups, or opting for a 100% certified green electricity tariff to slash energy emissions.';
    } else if (cat.name === 'transport') {
      evaluation = cat.val > 2000 
        ? 'Commuting by combustion vehicles or short-haul flights is generating high transportation emissions.' 
        : 'Your transportation footprint is light. This suggests heavy use of public transit, electric driving, or local travel.';
      recommendation = 'Swap solo car commutes for electric options or public trains. Keep vehicle tire pressures optimal to boost efficiency.';
    } else if (cat.name === 'diet') {
      evaluation = cat.val > 1500 
        ? 'Your food choices (particularly high meat portions) represent a substantial share of total emissions.' 
        : 'Your low-meat or vegan diet is an exceptional asset in minimizing land-use emissions.';
      recommendation = 'Try adding plant-based diet blocks. Shifting from beef to poultry or beans reduces food impact by up to 70%.';
    } else if (cat.name === 'waste') {
      evaluation = cat.val > 500 
        ? 'High waste volumes or heavy electronics/apparel purchases are inflating your consumption emissions.' 
        : 'Diligence in recycling and minimalism is keeping your municipal landfill contributions minimal.';
      recommendation = 'Implement strict recycling sorting, compost vegetable scraps, and utilize thrift shops instead of buying brand new clothes.';
    }

    panel.innerHTML = `
      <div class="insight-panel-header">
        <h3>${cat.label}</h3>
        <span><strong>${percentage}%</strong> of total</span>
      </div>
      <div class="percent-bar-track">
        <div class="percent-bar-fill ${cat.color}" style="width: ${percentage}%;"></div>
      </div>
      <p class="help-text" style="margin-top: 1rem; color: var(--text-secondary);">${evaluation}</p>
      <p class="help-text" style="color: var(--accent-green); font-weight: 500;">💡 Recommendation: ${recommendation}</p>
    `;

    detailsContainer.appendChild(panel);
  });

  // 3. Render Top 3 priority actions based on highest category footprint
  const priorityCategoryName = sortedCategories[0].name;
  const recommendedActions = state.actionsList
    .filter(a => a.category === priorityCategoryName)
    .slice(0, 3);

  if (recommendedActions.length === 0) {
    listContainer.innerHTML = '<p class="text-muted">No specific priority actions identified.</p>';
    return;
  }

  recommendedActions.forEach((action, index) => {
    const item = document.createElement('div');
    item.className = 'priority-item';
    item.innerHTML = `
      <div class="priority-num">${index + 1}</div>
      <div class="priority-details">
        <span class="priority-title">${action.title}</span>
        <span class="priority-desc">${action.description}</span>
        <span class="priority-savings">Est. Savings: -${action.annualSavingsKg} kg CO2e / year</span>
      </div>
    `;
    listContainer.appendChild(item);
  });
}

/* ==========================================================================
   Data Backup Portability (Export, Import, Reset)
   ========================================================================== */

/**
 * Download localStorage settings as a clean backup json file
 */
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(localStorage.getItem('eco_state') || '{}');
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", "ecofootprint_backup.json");
  dlAnchorElem.click();
}

/**
 * Import and parse JSON file, merging settings into localStorage
 */
function importData() {
  const fileInput = document.getElementById('import-file');
  const alertBox = document.getElementById('data-center-alert');

  if (fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      
      // Strict structural checks to prevent prototype pollution or JSON injects
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid backup file shape');
      }

      // Merge and save parsed components
      if (data.inputs) state.inputs = { ...state.inputs, ...data.inputs };
      if (data.breakdown) state.breakdown = { ...state.breakdown, ...data.breakdown };
      if (data.total !== undefined) state.total = Number(data.total);
      if (data.actionLogs) state.actionLogs = Array.isArray(data.actionLogs) ? data.actionLogs : [];
      if (data.monthlyGoalSaved !== undefined) state.monthlyGoalSaved = Number(data.monthlyGoalSaved);

      saveToLocalStorage();
      
      alertBox.textContent = 'Data successfully restored! Reloading application...';
      alertBox.classList.remove('hidden');
      alertBox.className = 'alert-box success';

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('File parsing failed during import:', err);
      alertBox.textContent = 'Import failed. Invalid or corrupted JSON backup file.';
      alertBox.classList.remove('hidden');
      alertBox.className = 'alert-box error';
    }
  };

  reader.readAsText(file);
}

/**
 * Delete local storage config and refresh page
 */
function resetApp() {
  if (confirm('Are you absolutely sure you want to delete all logs and configuration? This cannot be undone.')) {
    localStorage.removeItem('eco_state');
    window.location.reload();
  }
}
