import { Module, Priority, ModuleCategory } from '../types';

export const phases = [
  { id: 1, name: 'Phase 1: Critical (0-3 mo)', roi: '€231M NPV (Grid)' },
  { id: 2, name: 'Phase 2: Essential (3-6 mo)', roi: '€89M NPV (H2)' },
  { id: 3, name: 'Phase 3: Advanced (6-12 mo)', roi: '€67M NPV (Adv PV)' },
  { id: 4, name: 'Phase 4: Future (12-24 mo)', roi: '€134M NPV (AI)' }
];

export const modules: Module[] = [
  // --- FAZA 1: MODULE CRITICE (1-10) ---
  {
    id: 'm1', number: 1, title: 'Virtual Power Plant Orchestrator (VPP)',
    priority: Priority.CRITICAL, category: 'Grid & Trading', phase: 1,
    description: 'Agregare parcuri solare în centrală electrică virtuală. Grid-forming, black start, response 0.092s.',
    financialImpact: { npv: '€47M (10 ani)', revenue: '40-60% savings vs peaker' },
    apis: [{ provider: 'Huawei FusionSolar', protocol: 'REST' }, { provider: 'OpenADR 2.0b', protocol: 'HTTPS' }]
  },
  {
    id: 'm2', number: 2, title: 'Frequency Regulation & Ancillary Services',
    priority: Priority.CRITICAL, category: 'Grid & Trading', phase: 1,
    description: 'Reglaj frecvență (AGC), rezerve spinning. Piața globală $18.26B.',
    financialImpact: { npv: '€52M (10 ani)', revenue: '$3.68M-$10M/year per site' },
    apis: [{ provider: 'Grid Monitor', protocol: 'MQTT' }]
  },
  {
    id: 'm3', number: 3, title: 'Detecția Anomaliilor Termice',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Imagistică IR drone/fixe pentru detectare hot spots. Previne pierderi 2-5%.',
    financialImpact: { savings: '€156,000/an', roi: 'High' },
    apis: [{ provider: 'DJI SDK', protocol: 'Mobile SDK' }, { provider: 'FLIR', protocol: 'API' }]
  },
  {
    id: 'm4', number: 4, title: 'Analiza Murdăriei prin Satelit',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Planet Labs 3m resolution. Calcul ROI curățare (recuperare 18 zile).',
    financialImpact: { savings: '3-8% producție', roi: '18 zile' },
    apis: [{ provider: 'Planet Labs', protocol: 'REST' }]
  },
  {
    id: 'm5', number: 5, title: 'AI pentru Anomalii de Producție',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Detectare defecte invizibile (PID, string) cu TensorFlow. Precizie 94.7%.',
    financialImpact: { npv: '€23M (10 ani)', roi: '15-25% downtime reduction' },
    apis: [{ provider: 'TensorFlow Serving', protocol: 'gRPC' }]
  },
  {
    id: 'm6', number: 6, title: 'Previziuni Meteo Adaptate',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Prognoză hyperlocală (GHI, DNI) pentru optimizare dispatch.',
    financialImpact: { savings: '€890,000/an', roi: '95% accuracy' },
    apis: [{ provider: 'Solcast', protocol: 'REST' }, { provider: 'OpenWeatherMap', protocol: 'REST' }]
  },
  {
    id: 'm7', number: 7, title: 'Green Hydrogen Electrolyzer Integration',
    priority: Priority.CRITICAL, category: 'Hydrogen & Storage', phase: 1,
    description: 'Producție H2 din surplus. PEM/Alkaline/SOEC. Cost target $1/kg.',
    financialImpact: { npv: '€89M (10 ani)', revenue: 'H2 + Desalinated Water' },
    apis: [{ provider: 'Siemens Electrolyzer', protocol: 'OPC UA' }]
  },
  {
    id: 'm8', number: 8, title: 'AI Data Center Solar Integration',
    priority: Priority.CRITICAL, category: 'Compute & Digital', phase: 1,
    description: '24/7 Power pentru AI computing. Solar + LDES. 100k households demand.',
    financialImpact: { npv: '€134M (10 ani)', revenue: 'High Growth' },
    apis: [{ provider: 'DCIM', protocol: 'REST' }]
  },
  {
    id: 'm9', number: 9, title: 'Long-Duration Energy Storage (LDES)',
    priority: Priority.CRITICAL, category: 'Hydrogen & Storage', phase: 1,
    description: 'Stocare multi-day (Flow Batteries, Compressed Air). Grid stability.',
    financialImpact: { npv: '€71M (10 ani)', revenue: 'Seasonal Balancing' },
    apis: [{ provider: 'Flow Battery BMS', protocol: 'Modbus' }]
  },
  {
    id: 'm10', number: 10, title: 'Urmărirea Preciză a Degradării',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Monitorizare individuală 1.79M panouri. Detectare failure cu 6 luni înainte.',
    financialImpact: { savings: 'Warranty Enforcement', roi: 'Asset Life Extension' },
    apis: [{ provider: 'Raptor Maps', protocol: 'REST' }]
  },

  // --- FAZA 2: MODULE AVANSATE (11-20) ---
  { id: 'm11', number: 11, title: 'Benchmarking de Performanță', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Comparație PR între parcuri.', financialImpact: { roi: 'Optimization' }, apis: [] },
  { id: 'm12', number: 12, title: 'Previziunea Predicțivă a Defecțiunilor', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Alertare cu 90 zile avans.', financialImpact: { roi: 'Maintenance Savings' }, apis: [] },
  { id: 'm13', number: 13, title: 'Optimizator de Piese de Schimb', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Inventory management AI.', financialImpact: { savings: '€4.2M capital freed' }, apis: [] },
  { id: 'm14', number: 14, title: 'Amprenta de Carbon & ESG', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Raportare automată GRI/SASB.', financialImpact: { revenue: 'Carbon Credits' }, apis: [] },
  { id: 'm15', number: 15, title: 'Monitorizarea Biodiversității', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Tracking specii protejate (Dropia).', financialImpact: { roi: 'Compliance' }, apis: [] },
  { id: 'm16', number: 16, title: 'Digital Twin', priority: Priority.ESSENTIAL, category: 'Compute & Digital', phase: 2, description: 'Simulare procese cu 97.8% acuratețe.', financialImpact: { roi: 'Simulation' }, apis: [] },
  { id: 'm17', number: 17, title: 'Învățare între Parcuri', priority: Priority.ESSENTIAL, category: 'Compute & Digital', phase: 2, description: 'Federated Learning.', financialImpact: { roi: 'Knowledge Transfer' }, apis: [] },
  { id: 'm18', number: 18, title: 'Real-Time Energy Arbitrage', priority: Priority.ESSENTIAL, category: 'Grid & Trading', phase: 2, description: 'Trading automat intraday/day-ahead.', financialImpact: { revenue: '+34.7% revenue' }, apis: [] },
  { id: 'm19', number: 19, title: 'PPA Corporate Matchmaker', priority: Priority.ESSENTIAL, category: 'Grid & Trading', phase: 2, description: 'Contractare rapidă (4.2h).', financialImpact: { roi: 'Fast Sales' }, apis: [] },
  { id: 'm20', number: 20, title: 'Optimizator Agrivoltaic', priority: Priority.ESSENTIAL, category: 'Advanced PV', phase: 2, description: 'Dual land-use optimization.', financialImpact: { revenue: '+3% revenue' }, apis: [] },

  // --- FAZA 3: AVANSATE (21-30) ---
  { id: 'm21', number: 21, title: 'Fire Risk Prediction', priority: Priority.ADVANCED, category: 'Resilience', phase: 3, description: 'Prevenire incendii.', financialImpact: { savings: '€8.1M/event prevented' }, apis: [] },
  { id: 'm22', number: 22, title: 'Flood Resilience', priority: Priority.ADVANCED, category: 'Resilience', phase: 3, description: 'Reducere risc inundații 93%.', financialImpact: { savings: 'Asset Protection' }, apis: [] },
  { id: 'm23', number: 23, title: 'Robotic Maintenance', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Curățare automată.', financialImpact: { roi: '352% ROI' }, apis: [] },
  { id: 'm24', number: 24, title: 'Panel DNA Analysis', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Combatere fraudă echipamente.', financialImpact: { savings: '€7.7M fraud detected' }, apis: [] },
  { id: 'm25', number: 25, title: 'Islanded Microgrid', priority: Priority.ADVANCED, category: 'Grid & Trading', phase: 3, description: 'Operare independentă de rețea.', financialImpact: { roi: 'Resilience' }, apis: [] },
  { id: 'm26', number: 26, title: 'Acoustic Monitoring', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Ascultare defecțiuni echipamente.', financialImpact: { savings: '€2.93M/an' }, apis: [] },
  { id: 'm27', number: 27, title: 'Solar Spectrum Optimizer', priority: Priority.ADVANCED, category: 'Advanced PV', phase: 3, description: 'Adaptare la spectru lumina.', financialImpact: { npv: '€14.2M' }, apis: [] },
  { id: 'm28', number: 28, title: 'EMI Mapping', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Harta interferențe electromagnetice.', financialImpact: { npv: '€36.2M' }, apis: [] },
  { id: 'm29', number: 29, title: 'Intelligent Cleaning Scheduler', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Optimizare orar curățare.', financialImpact: { savings: '€584K/an' }, apis: [] },
  { id: 'm30', number: 30, title: 'Gamified Performance', priority: Priority.ADVANCED, category: 'Compute & Digital', phase: 3, description: 'Competiție între echipe O&M.', financialImpact: { revenue: '+11.4% productivity' }, apis: [] },

  // --- FAZA 4: INOVATOARE & VIITOR (31-47) ---
  { id: 'm31', number: 31, title: 'Grid-Forming Inverter Tech', priority: Priority.INNOVATIVE, category: 'Grid & Trading', phase: 4, description: 'Inerție sintetică.', financialImpact: { roi: 'Grid Stability' }, apis: [] },
  { id: 'm32', number: 32, title: 'Demand Response Aggregation', priority: Priority.INNOVATIVE, category: 'Grid & Trading', phase: 4, description: 'Load shifting.', financialImpact: { roi: 'Capacity Payment' }, apis: [] },
  { id: 'm33', number: 33, title: 'Wholesale Market Bidding AI', priority: Priority.INNOVATIVE, category: 'Grid & Trading', phase: 4, description: 'Licitație automată.', financialImpact: { roi: 'Trading Margin' }, apis: [] },
  { id: 'm34', number: 34, title: 'Seawater Electrolysis', priority: Priority.INNOVATIVE, category: 'Hydrogen & Storage', phase: 4, description: 'H2 direct din apă de mare.', financialImpact: { savings: '90% cost reduction' }, apis: [] },
  { id: 'm35', number: 35, title: 'Hydrogen Storage & Fuel Cell', priority: Priority.INNOVATIVE, category: 'Hydrogen & Storage', phase: 4, description: 'Stocare sezonieră.', financialImpact: { roi: 'Seasonal Shift' }, apis: [] },
  { id: 'm36', number: 36, title: 'Bifacial + Tracker Optimization', priority: Priority.INNOVATIVE, category: 'Advanced PV', phase: 4, description: 'Maximizare albedo.', financialImpact: { revenue: '+15-30% yield' }, apis: [] },
  { id: 'm37', number: 37, title: 'Perovskite-Silicon Tandem', priority: Priority.INNOVATIVE, category: 'Advanced PV', phase: 4, description: 'Eficiență 34.6%.', financialImpact: { roi: 'Next Gen' }, apis: [] },
  { id: 'm38', number: 38, title: 'Temperature Coefficient Optimizer', priority: Priority.INNOVATIVE, category: 'Advanced PV', phase: 4, description: 'Mitigare căldură.', financialImpact: { roi: 'Desert Efficiency' }, apis: [] },
  { id: 'm39', number: 39, title: 'Hyperspectral Diagnostics', priority: Priority.INNOVATIVE, category: 'O&M & Analytics', phase: 4, description: 'Defecte invizibile.', financialImpact: { roi: 'Deep Inspection' }, apis: [] },
  { id: 'm40', number: 40, title: 'Cryptocurrency Mining Optimizer', priority: Priority.INNOVATIVE, category: 'Compute & Digital', phase: 4, description: 'Mining în curtailment.', financialImpact: { revenue: 'Monetize Waste' }, apis: [] },
  
  // Future
  { id: 'm41', number: 41, title: 'Edge Computing Solar Microgrid', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'Distributed AI.', financialImpact: { roi: 'Latency' }, apis: [] },
  { id: 'm42', number: 42, title: 'Fast Frequency Response (<1 sec)', priority: Priority.FUTURE, category: 'Grid & Trading', phase: 4, description: 'Răspuns sub-secundă.', financialImpact: { roi: 'Premium Ancillary' }, apis: [] },
  { id: 'm43', number: 43, title: 'Vehicle-to-Grid Fleet Integration', priority: Priority.FUTURE, category: 'Grid & Trading', phase: 4, description: 'EV battery aggregation.', financialImpact: { roi: 'Distributed Storage' }, apis: [] },
  { id: 'm44', number: 44, title: 'Blockchain Energy Trading', priority: Priority.FUTURE, category: 'Grid & Trading', phase: 4, description: 'P2P Trading.', financialImpact: { roi: 'Decentralization' }, apis: [] },
  { id: 'm45', number: 45, title: 'Quantum Computing Optimization', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'Simulare complexă.', financialImpact: { roi: 'Speed' }, apis: [] },
  { id: 'm46', number: 46, title: 'AI Self-Improvement Engine', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'ROI infinit.', financialImpact: { roi: 'Autonomy' }, apis: [] },
  { id: 'm47', number: 47, title: 'Neural Network Auto-Retraining', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'Adaptare continuă.', financialImpact: { roi: 'Accuracy' }, apis: [] },
];
