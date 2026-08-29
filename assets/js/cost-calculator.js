// Studio Loom — cost calculator widget.
//
// ⚠️ PLACEHOLDER PRICING: every number in PRICING_TABLE below is a placeholder,
// extrapolated only from the single confirmed anchor in the SEO spec package
// ("~₹15L+ floor for a 2BHK full-scope premium turnkey project"). These need
// explicit business-owner sign-off before they're treated as real published
// pricing — see the on-page disclaimer, which must stay visible until that
// happens. Values are in ₹ lakhs (e.g. 15 = ₹15,00,000).
(function () {
  const PRICING_TABLE = {
    turnkey: {
      premium: { '2BHK': [15, 20], '3BHK': [20, 28], '4BHK+': [28, 40] },
      luxury: { '2BHK': [20, 28], '3BHK': [26, 38], '4BHK+': [38, 55] },
      ultraLuxury: { '2BHK': [28, 40], '3BHK': [38, 55], '4BHK+': [55, 80] },
    },
    designConsultation: {
      premium: { '2BHK': [5, 7], '3BHK': [7, 10], '4BHK+': [10, 14] },
      luxury: { '2BHK': [7, 10], '3BHK': [9, 13], '4BHK+': [13, 19] },
      ultraLuxury: { '2BHK': [10, 14], '3BHK': [13, 19], '4BHK+': [19, 28] },
    },
    interiorStyling: {
      premium: { '2BHK': [3, 5], '3BHK': [4, 6], '4BHK+': [6, 9] },
      luxury: { '2BHK': [5, 7], '3BHK': [6, 9], '4BHK+': [9, 13] },
      ultraLuxury: { '2BHK': [7, 10], '3BHK': [9, 13], '4BHK+': [13, 18] },
    },
  };

  const SCOPE_MULTIPLIER = { fullHome: 1.0, specificRooms: 0.4 };
  const LOCATION_MULTIPLIER = { gurugram: 1.0, delhiNCR: 1.03, other: 1.05 };

  const SERVICE_LABEL = {
    turnkey: 'turnkey',
    designConsultation: 'design consultation',
    interiorStyling: 'interior styling',
  };
  const FINISH_LABEL = { premium: 'premium', luxury: 'luxury', ultraLuxury: 'ultra-luxury' };
  const LOCATION_LABEL = { gurugram: 'Gurugram', delhiNCR: 'Delhi NCR', other: 'Delhi NCR' };
  const SIZE_LABEL = { '2BHK': '2BHK', '3BHK': '3BHK', '4BHK+': '4BHK+' };

  function formatLakhs(n) {
    return `₹${n % 1 === 0 ? n : n.toFixed(1)}L`;
  }

  function compute() {
    const service = document.getElementById('calc-service').value;
    const size = document.getElementById('calc-size').value;
    const scope = document.getElementById('calc-scope').value;
    const finish = document.getElementById('calc-finish').value;
    const location = document.getElementById('calc-location').value;

    const [baseLow, baseHigh] = PRICING_TABLE[service][finish][size];
    const scopeMult = SCOPE_MULTIPLIER[scope];
    const locMult = LOCATION_MULTIPLIER[location];

    const low = Math.round(baseLow * scopeMult * locMult);
    const high = Math.round(baseHigh * scopeMult * locMult);

    const scopeText = scope === 'fullHome' ? 'full-scope' : 'partial-scope';
    const rangeEl = document.getElementById('calc-output-range');
    const descEl = document.getElementById('calc-output-desc');

    rangeEl.textContent = `${formatLakhs(low)}–${formatLakhs(high)}`;
    descEl.textContent = `A ${scopeText} ${SIZE_LABEL[size]} ${finish === 'ultraLuxury' ? 'ultra-luxury' : FINISH_LABEL[finish]} property in ${LOCATION_LABEL[location]} typically costs this range with Studio Loom's ${SERVICE_LABEL[service]} service.`;

    if (window.gtag) window.gtag('event', 'calculator_complete', { service, size, scope, finish, location });
  }

  const panel = document.getElementById('cost-calculator');
  if (!panel) return;
  panel.querySelectorAll('select').forEach((el) => el.addEventListener('change', compute));
  compute();
})();
