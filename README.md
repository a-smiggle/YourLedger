# Your Ledger

**See where you stand. Plan your next step.**

Your Ledger is a **privacy‑first, client‑side web application** designed to help Australian households understand their **borrowing power, cashflow, and home loan options** using clear, conservative banking assumptions.

The application is designed to feel **professional, trustworthy, and bank‑grade**, with a clear visual hierarchy and mobile‑friendly layout.  
All calculations run locally in the browser — **no data is sent or stored externally**.

---

## 🧭 Product Goals

The app allows users to:

- Enter household incomes (multiple people)
- Enter detailed household spending
- Enter real estate assets and liabilities
- Calculate borrowing power using Australian lending rules
- Run home loan repayment calculations
- Compare scenarios (bank vs bank, offset vs no offset)
- Visualise outcomes with clear financial charts
- Export and import all data as JSON
- Retain state locally using browser storage

This is an **indicative planning tool**, not an application system.

---

## 🛠️ Technology Stack (Required)

- **Next.js (App Router)**
- **TypeScript (strict mode)**
- **Tailwind CSS**
- **Recharts** (primary charting library)
- Client‑side only (no backend persistence)

All calculation logic must be written as **pure TypeScript functions** and kept separate from UI components.

---

## 🎨 Design & Styling

### Design Source
UI designs have been generated in **Google Stitch** and should be treated as the **visual reference**.

The look and feel should be:
- Professional and conservative
- Banking‑grade (similar to Australian major banks)
- Card‑based layout
- Neutral colour palette (navy, slate, greys)
- No flashy gradients or gimmicks

### Key UI Principles
- Mobile‑first responsive layouts
- Clear visual hierarchy
- Readability over density
- Financial data prioritised over decoration

### Advertising
The UI must include **clearly separated advertising areas**:
- Labeled as “Sponsored”
- Visually distinct from financial data
- Must not interact with or access calculator data

---

## 🧠 Core Domains

### Income
- Multiple household members
- Gross or net income inputs
- Variable income (bonuses, overtime)
- HECS / HELP handling
- Income shading rules applied in serviceability

### Expenses
- Detailed household expense categories
- Actual expenses vs HEM‑style floor
- Expense loading applied conservatively

### Assets & Liabilities
- Primary residence
- Investment properties
- Property values and loan balances
- Rental income and associated costs
- Equity modelling

### Lending Calculations
- Borrowing power (serviceability based)
- Home loan repayments
- Interest rate buffers
- Offset vs no‑offset scenarios

---

## 📊 Charts & Visualisation

The app should include:
- Borrowing power comparison charts
- Cashflow over time
- Debt and LVR trajectory
- Rate sensitivity analysis
- Scenario comparisons

Charts must:
- Update in real time
- Be readable on mobile
- Use conservative colours
- Avoid animation fluff

---

## 📦 Data Handling

- All data stored locally using `localStorage` or `sessionStorage`
- No cookies used for tracking
- Export full app state to JSON
- Import JSON to restore state
- Clear/reset option required

---

## 🔐 Privacy & Transparency

A dedicated **“How This Works”** page must explain:
- How borrowing power is calculated
- Key assumptions and buffers
- That all calculations run locally
- That no data is sent anywhere

Include a clear disclaimer:
> “This calculator provides general information only and does not constitute financial advice.”

---

## 🧪 Quality Expectations

- Calculation logic must be testable without React
- No magic numbers — all assumptions configurable
- Clean separation of concerns
- Predictable folder structure
- Readable, professional code

---

## 🧩 Suggested Project Structure

```text
/app
  /components        # UI components
  /charts            # Recharts-based visuals
  /modules           # Feature-level modules
  /engine            # Lending & serviceability logic
  /config            # Banking rules & assumptions
  /hooks             # State & persistence hooks
  /types             # TypeScript domain models