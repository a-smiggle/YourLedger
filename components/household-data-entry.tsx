"use client";

import { useAppData } from "@/components/app-data-provider";
import type { Asset, ExpenseBreakdown, HouseholdMember, HouseholdProfile, Liability, UserData } from "@/types/domain";

const expenseFields: Array<{ key: keyof ExpenseBreakdown; label: string }> = [
  { key: "housing", label: "Housing" },
  { key: "transport", label: "Transport" },
  { key: "groceries", label: "Groceries" },
  { key: "phone", label: "Phone" },
  { key: "internet", label: "Internet" },
  { key: "utilities", label: "Utilities" },
  { key: "insurance", label: "Insurance" },
  { key: "healthcare", label: "Healthcare" },
  { key: "childcareEducation", label: "Childcare and education" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "discretionary", label: "Discretionary" },
  { key: "other", label: "Other" },
];

const assetCategoryOptions: Asset["category"][] = ["cash", "property", "super", "vehicle", "other"];
const liabilityCategoryOptions: Liability["category"][] = ["home-loan", "credit-card", "personal-loan", "car-loan", "other"];
const SUPER_GUARANTEE_RATE = 0.12;

function getDefaultReadingDate() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMember(order: number): HouseholdMember {
  return {
    id: createId("member"),
    name: buildDefaultApplicantName(order),
    annualGrossIncome: 0,
    superContributionRate: 12,
    annualBonusIncome: 0,
    annualRentalIncome: 0,
    hasHecsHelpDebt: false,
  };
}

function calculateDefaultSuperContribution(annualGrossIncome: number, superContributionRate = SUPER_GUARANTEE_RATE * 100) {
  return Math.round(annualGrossIncome * (superContributionRate / 100) / 12);
}

function buildDefaultApplicantName(order: number) {
  return `Applicant ${order}`;
}

function buildDefaultSuperLabel(order: number, memberName: string) {
  const cleanedName = memberName.trim();
  const applicantName = cleanedName || buildDefaultApplicantName(order);
  return `Super - ${applicantName}`;
}

function createSuperAsset(order: number, member: HouseholdMember): Asset {
  const baseMonthlyContribution = calculateDefaultSuperContribution(member.annualGrossIncome, member.superContributionRate);

  return {
    id: createId("asset"),
    label: buildDefaultSuperLabel(order, member.name),
    value: 0,
    readingDate: getDefaultReadingDate(),
    expectedMonthlyContribution: baseMonthlyContribution,
    additionalMonthlyContribution: 0,
    annualGrowthRate: 7,
    linkedMemberId: member.id,
    category: "super",
  };
}

function getSuperAssetIndexByMemberOrder(assets: Asset[], memberIndex: number) {
  let seenSuperAssets = 0;

  for (let assetIndex = 0; assetIndex < assets.length; assetIndex += 1) {
    if (assets[assetIndex].category !== "super") {
      continue;
    }

    if (seenSuperAssets === memberIndex) {
      return assetIndex;
    }

    seenSuperAssets += 1;
  }

  return -1;
}

function getSuperAssetIndexForMember(assets: Asset[], memberId: string, memberIndex: number) {
  const linkedSuperAssetIndex = assets.findIndex((asset) => asset.category === "super" && asset.linkedMemberId === memberId);

  if (linkedSuperAssetIndex >= 0) {
    return linkedSuperAssetIndex;
  }

  return getSuperAssetIndexByMemberOrder(assets, memberIndex);
}

function isAutoManagedSuperLabel(label: string, order: number, previousMemberName: string) {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return true;
  }

  const fallbackApplicantName = buildDefaultApplicantName(order);
  const previousCleanName = previousMemberName.trim() || fallbackApplicantName;

  const knownDefaults = new Set<string>([
    buildDefaultSuperLabel(order, previousMemberName),
    `Super - ${fallbackApplicantName}`,
    `Superannuation - ${previousCleanName}`,
    `Superannuation - ${fallbackApplicantName}`,
  ]);

  if (order === 1) {
    knownDefaults.add("Superannuation");
  }

  return knownDefaults.has(trimmedLabel);
}

function createAsset(order: number): Asset {
  return {
    id: createId("asset"),
    label: order === 1 ? "Cash savings" : `Asset ${order}`,
    value: 0,
    readingDate: getDefaultReadingDate(),
    expectedMonthlyContribution: 0,
    annualGrowthRate: order === 1 ? 4.5 : 5,
    category: "cash",
  };
}

function createLiability(order: number): Liability {
  return {
    id: createId("liability"),
    label: order === 1 ? "Credit card" : `Liability ${order}`,
    balance: 0,
    monthlyRepayment: 0,
    category: order === 1 ? "credit-card" : "home-loan",
  };
}

function parseNumberInput(value: string) {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIntegerInput(value: string) {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.trunc(parsed);
}

function updateUserDataProfile(userData: UserData, profile: HouseholdProfile): UserData {
  return {
    ...userData,
    profile,
    meta: {
      ...userData.meta,
      updatedAt: new Date().toISOString(),
      source: "manual",
    },
  };
}

function textFieldClassName(hasError: boolean) {
  return [
    "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink outline-none transition-colors",
    hasError ? "border-warning ring-1 ring-warning/30" : "border-outline focus:border-primary",
  ].join(" ");
}

function formatCategoryLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function ValidationMessage({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-xs font-medium text-warning">{message}</p>;
}

function Field({ label, error, children }: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
  return (
    <label className="block text-sm font-medium text-ink">
      <span>{label}</span>
      {children}
      <ValidationMessage message={error} />
    </label>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: Readonly<{
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}>) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-2 leading-6">{body}</p>
      <button
        type="button"
        className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function ItemToolbar({
  onMoveUp,
  onMoveDown,
  onRemove,
  disableMoveUp,
  disableMoveDown,
  disableRemove,
}: Readonly<{
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  disableRemove?: boolean;
}>) {
  return (
    <div className="flex flex-wrap gap-2">
      {onMoveUp ? (
        <button
          type="button"
          className="rounded-full border border-outline bg-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onMoveUp}
          disabled={disableMoveUp}
        >
          Move up
        </button>
      ) : null}
      {onMoveDown ? (
        <button
          type="button"
          className="rounded-full border border-outline bg-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onMoveDown}
          disabled={disableMoveDown}
        >
          Move down
        </button>
      ) : null}
      <button
        type="button"
        className="rounded-full border border-outline bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onRemove}
        disabled={disableRemove}
      >
        Remove
      </button>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: Readonly<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-outline bg-white px-4 py-3 text-sm text-ink">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
    </label>
  );
}

export function IncomeExpensesEditor() {
  const { userData, setUserData } = useAppData();
  const profile = userData.profile;

  const commitProfile = (updater: (currentProfile: HouseholdProfile) => HouseholdProfile) => {
    setUserData((currentUserData) => updateUserDataProfile(currentUserData, updater(currentUserData.profile)));
  };

  const addMember = () => {
    commitProfile((currentProfile) => {
      const nextOrder = currentProfile.members.length + 1;
      const nextMember = createMember(nextOrder);
      const existingSuperAssetCount = currentProfile.assets.filter((asset) => asset.category === "super").length;
      const shouldAddSuperAsset = existingSuperAssetCount < nextOrder;

      return {
        ...currentProfile,
        members: [...currentProfile.members, nextMember],
        assets: shouldAddSuperAsset
          ? [...currentProfile.assets, createSuperAsset(nextOrder, nextMember)]
          : currentProfile.assets,
      };
    });
  };

  const removeMember = (memberId: string) => {
    commitProfile((currentProfile) => {
      if (currentProfile.members.length <= 1) {
        return currentProfile;
      }

      return {
        ...currentProfile,
        members: currentProfile.members.filter((candidate) => candidate.id !== memberId),
      };
    });
  };

  const moveMember = (index: number, offset: -1 | 1) => {
    commitProfile((currentProfile) => {
      const nextIndex = index + offset;

      if (nextIndex < 0 || nextIndex >= currentProfile.members.length) {
        return currentProfile;
      }

      const members = [...currentProfile.members];
      const [member] = members.splice(index, 1);
      members.splice(nextIndex, 0, member);

      return { ...currentProfile, members };
    });
  };

  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <div className="rounded-panel bg-surface p-7 shadow-ambient">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-primary">Household members</h2>
            <p className="mt-2 text-sm text-muted">Capture income sources for each applicant or contributing household member.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
            onClick={addMember}
          >
            Add member
          </button>
        </div>

        {profile.members.length === 0 ? (
          <EmptyState
            title="No household members yet"
            body="Start with one household member so borrowing power, shaded income, and HELP settings can be calculated from real inputs."
            actionLabel="Add first member"
            onAction={addMember}
          />
        ) : (
          <div className="space-y-4">
            {profile.members.map((member, index) => {
              const nameError = member.name.trim() ? undefined : "Name is required.";
              const grossIncomeError = member.annualGrossIncome < 0 ? "Gross income must be zero or more." : undefined;
              const superRateError = member.superContributionRate < 0 ? "Super % must be zero or more." : undefined;
              const bonusIncomeError = member.annualBonusIncome < 0 ? "Bonus income must be zero or more." : undefined;
              const rentalIncomeError = member.annualRentalIncome < 0 ? "Rental income must be zero or more." : undefined;

              return (
                <article key={member.id} className="rounded-[1.5rem] bg-surface-low p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Member {index + 1}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Income profile</p>
                    </div>
                    <ItemToolbar
                      onMoveUp={() => moveMember(index, -1)}
                      onMoveDown={() => moveMember(index, 1)}
                      onRemove={() => removeMember(member.id)}
                      disableMoveUp={index === 0}
                      disableMoveDown={index === profile.members.length - 1}
                      disableRemove={profile.members.length === 1}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Name" error={nameError}>
                      <input
                        value={member.name}
                        onChange={(event) =>
                          commitProfile((currentProfile) => {
                            const nextMemberName = event.target.value;
                            const memberIndex = currentProfile.members.findIndex((candidate) => candidate.id === member.id);

                            if (memberIndex < 0) {
                              return currentProfile;
                            }

                            const previousMemberName = currentProfile.members[memberIndex].name;
                            const order = memberIndex + 1;
                            const nextDefaultLabel = buildDefaultSuperLabel(order, nextMemberName);
                            const superAssetIndex = getSuperAssetIndexForMember(currentProfile.assets, member.id, memberIndex);

                            const members = currentProfile.members.map((candidate) =>
                              candidate.id === member.id ? { ...candidate, name: nextMemberName } : candidate,
                            );

                            const assets = currentProfile.assets.map((candidate, assetIndex) => {
                              if (assetIndex !== superAssetIndex) {
                                return candidate;
                              }

                              const shouldRefreshDefaultLabel = isAutoManagedSuperLabel(candidate.label, order, previousMemberName);

                              if (!shouldRefreshDefaultLabel) {
                                return candidate;
                              }

                              return {
                                ...candidate,
                                label: nextDefaultLabel,
                              };
                            });

                            return {
                              ...currentProfile,
                              members,
                              assets,
                            };
                          })
                        }
                        className={textFieldClassName(Boolean(nameError))}
                        placeholder="Full name"
                      />
                    </Field>

                    <ToggleField
                      label="Has HECS/HELP debt"
                      checked={member.hasHecsHelpDebt}
                      onChange={(checked) =>
                        commitProfile((currentProfile) => ({
                          ...currentProfile,
                          members: currentProfile.members.map((candidate) =>
                            candidate.id === member.id ? { ...candidate, hasHecsHelpDebt: checked } : candidate,
                          ),
                        }))
                      }
                    />

                    <Field label="Annual gross income" error={grossIncomeError}>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={member.annualGrossIncome}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            members: currentProfile.members.map((candidate) =>
                              candidate.id === member.id
                                ? { ...candidate, annualGrossIncome: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(grossIncomeError))}
                      />
                    </Field>

                    <Field label="Super contribution %" error={superRateError}>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={member.superContributionRate}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            members: currentProfile.members.map((candidate) =>
                              candidate.id === member.id
                                ? { ...candidate, superContributionRate: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(superRateError))}
                      />
                    </Field>

                    <Field label="Annual bonus income" error={bonusIncomeError}>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={member.annualBonusIncome}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            members: currentProfile.members.map((candidate) =>
                              candidate.id === member.id
                                ? { ...candidate, annualBonusIncome: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(bonusIncomeError))}
                      />
                    </Field>

                    <Field label="Annual rental income" error={rentalIncomeError}>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={member.annualRentalIncome}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            members: currentProfile.members.map((candidate) =>
                              candidate.id === member.id
                                ? { ...candidate, annualRentalIncome: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(rentalIncomeError))}
                      />
                    </Field>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-panel bg-surface p-7 shadow-ambient">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-primary">Expenses and dependants</h2>
          <p className="mt-2 text-sm text-muted">Keep declared living costs current so conservative serviceability checks reflect the real household profile.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Dependants"
            error={
              profile.dependants < 0
                ? "Dependants must be zero or more."
                : !Number.isInteger(profile.dependants)
                  ? "Dependants must be a whole number."
                  : undefined
            }
          >
            <input
              type="number"
              min="0"
              step="1"
              value={profile.dependants}
              onChange={(event) =>
                commitProfile((currentProfile) => ({
                  ...currentProfile,
                  dependants: parseIntegerInput(event.target.value),
                }))
              }
              className={textFieldClassName(profile.dependants < 0 || !Number.isInteger(profile.dependants))}
            />
          </Field>

          <Field label="Monthly expense total">
            <div className="mt-2 rounded-2xl border border-outline bg-surface-low px-4 py-3 text-sm text-muted">
              ${Object.values(profile.monthlyExpenses).reduce((total, value) => total + value, 0).toLocaleString()} per month
            </div>
          </Field>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {expenseFields.map(({ key, label }) => {
            const value = profile.monthlyExpenses[key];
            const error = value < 0 ? `${label} must be zero or more.` : undefined;

            return (
              <Field key={key} label={label} error={error}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={value}
                  onChange={(event) =>
                    commitProfile((currentProfile) => ({
                      ...currentProfile,
                      monthlyExpenses: {
                        ...currentProfile.monthlyExpenses,
                        [key]: parseNumberInput(event.target.value),
                      },
                    }))
                  }
                  className={textFieldClassName(Boolean(error))}
                />
              </Field>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AssetsLiabilitiesEditor() {
  const { userData, setUserData } = useAppData();
  const profile = userData.profile;

  const commitProfile = (updater: (currentProfile: HouseholdProfile) => HouseholdProfile) => {
    setUserData((currentUserData) => updateUserDataProfile(currentUserData, updater(currentUserData.profile)));
  };

  const addAsset = () => {
    commitProfile((currentProfile) => ({
      ...currentProfile,
      assets: [...currentProfile.assets, createAsset(currentProfile.assets.length + 1)],
    }));
  };

  const addLiability = () => {
    commitProfile((currentProfile) => ({
      ...currentProfile,
      liabilities: [...currentProfile.liabilities, createLiability(currentProfile.liabilities.length + 1)],
    }));
  };

  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <div className="rounded-panel bg-surface p-7 shadow-ambient">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-primary">Assets</h2>
            <p className="mt-2 text-sm text-muted">Track cash, property, super, vehicles, and other assets used in the household balance sheet.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
            onClick={addAsset}
          >
            Add asset
          </button>
        </div>

        {profile.assets.length === 0 ? (
          <EmptyState
            title="No assets recorded"
            body="Add at least one asset to keep the household position and equity view grounded in current values."
            actionLabel="Add first asset"
            onAction={addAsset}
          />
        ) : (
          <div className="space-y-4">
            {profile.assets.map((asset) => {
              const linkedMember =
                asset.category === "super" && asset.linkedMemberId
                  ? profile.members.find((member) => member.id === asset.linkedMemberId)
                  : undefined;
              const baseMonthlySuperContribution =
                asset.category === "super" && linkedMember
                  ? calculateDefaultSuperContribution(linkedMember.annualGrossIncome, linkedMember.superContributionRate)
                  : 0;
              const labelError = asset.label.trim() ? undefined : "Asset label is required.";
              const valueError = asset.value < 0 ? "Asset value must be zero or more." : undefined;
              const readingDateError = asset.readingDate.trim() ? undefined : "Reading date is required.";
              const contributionError =
                asset.category === "super"
                  ? (asset.additionalMonthlyContribution ?? 0) < 0
                    ? "Additional contribution must be zero or more."
                    : undefined
                  : (asset.expectedMonthlyContribution ?? 0) < 0
                    ? "Monthly contribution must be zero or more."
                    : undefined;
              const growthRateError = (asset.annualGrowthRate ?? 0) < 0 ? "Annual growth rate must be zero or more." : undefined;

              return (
                <article key={asset.id} className="rounded-[1.5rem] bg-surface-low p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Asset entry</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Balance sheet input</p>
                    </div>
                    <ItemToolbar
                      onRemove={() =>
                        commitProfile((currentProfile) => ({
                          ...currentProfile,
                          assets: currentProfile.assets.filter((candidate) => candidate.id !== asset.id),
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Label" error={labelError}>
                      <input
                        value={asset.label}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            assets: currentProfile.assets.map((candidate) =>
                              candidate.id === asset.id ? { ...candidate, label: event.target.value } : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(labelError))}
                        placeholder="Offset cash"
                      />
                    </Field>

                    <Field label="Category">
                      <select
                        value={asset.category}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            assets: currentProfile.assets.map((candidate) =>
                              candidate.id === asset.id
                                ? { ...candidate, category: event.target.value as Asset["category"] }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(false)}
                      >
                        {assetCategoryOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatCategoryLabel(option)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Current value" error={valueError}>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={asset.value}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            assets: currentProfile.assets.map((candidate) =>
                              candidate.id === asset.id
                                ? { ...candidate, value: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(valueError))}
                      />
                    </Field>

                    <Field label="Reading date" error={readingDateError}>
                      <input
                        type="date"
                        value={asset.readingDate}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            assets: currentProfile.assets.map((candidate) =>
                              candidate.id === asset.id
                                ? { ...candidate, readingDate: event.target.value }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(readingDateError))}
                      />
                    </Field>

                    {asset.category === "super" ? (
                      <>
                        <Field label="Base super contribution">
                          <div className="mt-2 rounded-2xl border border-outline bg-surface-low px-4 py-3 text-sm text-muted">
                            ${baseMonthlySuperContribution.toLocaleString()} / month
                            {linkedMember ? ` (${linkedMember.superContributionRate.toFixed(1)}% of ${linkedMember.name})` : " (no linked member)"}
                          </div>
                        </Field>

                        <Field label="Additional contribution" error={contributionError}>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={asset.additionalMonthlyContribution ?? 0}
                            onChange={(event) =>
                              commitProfile((currentProfile) => ({
                                ...currentProfile,
                                assets: currentProfile.assets.map((candidate) =>
                                  candidate.id === asset.id
                                    ? {
                                        ...candidate,
                                        additionalMonthlyContribution: parseNumberInput(event.target.value),
                                        expectedMonthlyContribution:
                                          baseMonthlySuperContribution + parseNumberInput(event.target.value),
                                      }
                                    : candidate,
                                ),
                              }))
                            }
                            className={textFieldClassName(Boolean(contributionError))}
                          />
                        </Field>
                      </>
                    ) : (
                      <Field label="Expected monthly input" error={contributionError}>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={asset.expectedMonthlyContribution ?? 0}
                          onChange={(event) =>
                            commitProfile((currentProfile) => ({
                              ...currentProfile,
                              assets: currentProfile.assets.map((candidate) =>
                                candidate.id === asset.id
                                  ? { ...candidate, expectedMonthlyContribution: parseNumberInput(event.target.value) }
                                  : candidate,
                              ),
                            }))
                          }
                          className={textFieldClassName(Boolean(contributionError))}
                        />
                      </Field>
                    )}

                    <Field label="Annual growth rate" error={growthRateError}>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={asset.annualGrowthRate ?? 0}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            assets: currentProfile.assets.map((candidate) =>
                              candidate.id === asset.id
                                ? { ...candidate, annualGrowthRate: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(growthRateError))}
                      />
                    </Field>
                  </div>

                  <p className="mt-4 text-xs leading-6 text-muted">
                    Use the reading date to anchor balances like savings and super before projected inputs are layered on from ongoing contributions and post-expense surplus.
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-panel bg-surface p-7 shadow-ambient">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-primary">Liabilities</h2>
            <p className="mt-2 text-sm text-muted">Track debts and monthly commitments so serviceability and net position stay aligned with the household profile.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
            onClick={addLiability}
          >
            Add liability
          </button>
        </div>

        {profile.liabilities.length === 0 ? (
          <EmptyState
            title="No liabilities recorded"
            body="Add current debts and repayments so assessed expenses and outstanding balances use the right baseline."
            actionLabel="Add first liability"
            onAction={addLiability}
          />
        ) : (
          <div className="space-y-4">
            {profile.liabilities.map((liability) => {
              const labelError = liability.label.trim() ? undefined : "Liability label is required.";
              const balanceError = liability.balance < 0 ? "Outstanding balance must be zero or more." : undefined;
              const repaymentError = liability.monthlyRepayment < 0 ? "Monthly repayment must be zero or more." : undefined;

              return (
                <article key={liability.id} className="rounded-[1.5rem] bg-surface-low p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Liability entry</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Debt and repayment input</p>
                    </div>
                    <ItemToolbar
                      onRemove={() =>
                        commitProfile((currentProfile) => ({
                          ...currentProfile,
                          liabilities: currentProfile.liabilities.filter((candidate) => candidate.id !== liability.id),
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Label" error={labelError}>
                      <input
                        value={liability.label}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            liabilities: currentProfile.liabilities.map((candidate) =>
                              candidate.id === liability.id ? { ...candidate, label: event.target.value } : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(labelError))}
                        placeholder="Home loan"
                      />
                    </Field>

                    <Field label="Category">
                      <select
                        value={liability.category}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            liabilities: currentProfile.liabilities.map((candidate) =>
                              candidate.id === liability.id
                                ? { ...candidate, category: event.target.value as Liability["category"] }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(false)}
                      >
                        {liabilityCategoryOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatCategoryLabel(option)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Outstanding balance" error={balanceError}>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={liability.balance}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            liabilities: currentProfile.liabilities.map((candidate) =>
                              candidate.id === liability.id
                                ? { ...candidate, balance: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(balanceError))}
                      />
                    </Field>

                    <Field label="Monthly repayment" error={repaymentError}>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={liability.monthlyRepayment}
                        onChange={(event) =>
                          commitProfile((currentProfile) => ({
                            ...currentProfile,
                            liabilities: currentProfile.liabilities.map((candidate) =>
                              candidate.id === liability.id
                                ? { ...candidate, monthlyRepayment: parseNumberInput(event.target.value) }
                                : candidate,
                            ),
                          }))
                        }
                        className={textFieldClassName(Boolean(repaymentError))}
                      />
                    </Field>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}