#!/bin/bash
BASE="http://localhost:3007"

echo "=== [1/3] Test endpoint AI ==="
curl -s -X POST "$BASE/api/ai/openrouter" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"Răspunde doar: {\"ok\":true}"}],"max_tokens":50}' \
  --max-time 20
echo ""

echo "=== [2/3] Test PVGIS Craiova ==="
curl -s "$BASE/api/pvgis?lat=44.3312&lon=23.7891&peakpower=5000&loss=10&aspect=0&angle=30" \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
t=d['outputs']['totals']['fixed']
print(f\"E_y={t['E_y']} | H_i_y={t['H(i)_y']}\")
assert abs(t['H(i)_y'] - 1451.78) < 5, '❌ PVGIS iradianță incorectă'
print('✅ PVGIS OK')
"

echo ""
echo "=== [3/3] Validare calcule SF ==="
python3 << 'PYEOF'
irr=1451.78; p=5; pr=0.890; tk=1.135
prod = p*irr*pr*tk
rev  = prod*72
cx   = 3_250_000
print(f"Producție P50 NET: {prod:,.0f} MWh/an  [target: 7,333]")
print(f"Venituri an1:      {rev:,.0f} EUR      [target: 527,976]")
assert abs(prod - 7333) < 10, f"❌ Producție incorectă: {prod:.0f}"
assert abs(rev - 527976) < 500, f"❌ Venituri incorecte: {rev:.0f}"
print("✅ Toate calculele SF validate!")
print()
print("Cap 4.3 CHECK:")
print(f"  Iradianță: {irr:.2f} kWh/kWp/an  ← NU e producția parcului")
print(f"  Producție: {prod:,.0f} MWh/an        ← producția reală a parcului")
PYEOF
