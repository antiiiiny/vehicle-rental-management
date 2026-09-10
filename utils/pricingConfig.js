const ADDONS_CATALOG = [
  {
    id: 'insurance',
    name: 'Full Coverage Insurance',
    description: 'Zero deductible collision damage waiver',
    ratePerDay: 15,
  },
  {
    id: 'driver',
    name: 'Personal Driver Service',
    description: 'Chauffeur service for the entire rental duration',
    ratePerDay: 30,
  },
  {
    id: 'gps',
    name: 'GPS Navigation System',
    description: 'Turn-by-turn satellite navigation unit',
    ratePerDay: 5,
  },
  {
    id: 'child_seat',
    name: 'Child Safety Seat',
    description: 'ISOFIX certified child restraint seat',
    ratePerDay: 10,
  },
];

function getAddonsCatalog() {
  return ADDONS_CATALOG;
}

function calculateAddonsTotal(selectedAddons, totalDays) {
  if (!Array.isArray(selectedAddons) || selectedAddons.length === 0) {
    return { addonsList: [], addonsTotal: 0 };
  }

  const addonsList = [];
  let addonsTotal = 0;

  for (const item of selectedAddons) {
    const addonId = typeof item === 'string' ? item : item.id;
    const match = ADDONS_CATALOG.find((a) => a.id === addonId);

    if (match) {
      const itemTotal = match.ratePerDay * totalDays;
      addonsList.push({
        addonId: match.id,
        name: match.name,
        ratePerDay: match.ratePerDay,
        totalAmount: itemTotal,
      });
      addonsTotal += itemTotal;
    }
  }

  return { addonsList, addonsTotal };
}

module.exports = {
  ADDONS_CATALOG,
  getAddonsCatalog,
  calculateAddonsTotal,
};
