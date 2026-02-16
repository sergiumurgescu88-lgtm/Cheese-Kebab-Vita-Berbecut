
import { Module, Priority, ModuleCategory } from '../types';

export const phases = [
  { id: 1, name: 'Phase 1: Critical (0-3 mo)', roi: '€231M NPV (Grid)' },
  { id: 2, name: 'Phase 2: Essential (3-6 mo)', roi: '€89M NPV (H2)' },
  { id: 3, name: 'Phase 3: Advanced (6-12 mo)', roi: '€67M NPV (Adv PV)' },
  { id: 4, name: 'Phase 4: Future (12-24 mo)', roi: '€134M NPV (AI)' }
];

export const modules: Module[] = [
  {
    id: 'm1', number: 1, title: 'Virtual Power Plant Orchestrator',
    priority: Priority.CRITICAL, category: 'Grid & Trading', phase: 1,
    description: 'Agregare parcuri solare în centrală electrică virtuală. Grid-forming capability, response time 0.092s.',
    financialImpact: { npv: '€47M', revenue: '40-60% savings' },
    apis: [{ provider: 'FusionSolar', protocol: 'REST' }, { provider: 'OpenWeather', protocol: 'One Call 3.0' }]
  },
  {
    id: 'm2', number: 2, title: 'Frequency Regulation & Ancillary Services',
    priority: Priority.CRITICAL, category: 'Grid & Trading', phase: 1,
    description: 'FCR & aFRR control loop. Spinning reserve calculation for the $18.26B market.',
    financialImpact: { npv: '€52M', revenue: '$10M/year' },
    apis: [{ provider: 'Grid Monitor', protocol: 'MQTT' }, { provider: 'OpenWeather', protocol: 'One Call 3.0' }]
  },
  {
    id: 'm3', number: 3, title: 'Detecția Anomaliilor Termice',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Corelație temperatură ambientală vs temperatură panouri. Alertare delta T > 15°C.',
    financialImpact: { savings: '€156k/an', roi: '2-5% prevention' },
    apis: [{ provider: 'OpenWeather', protocol: 'Current' }, { provider: 'Planet Labs', protocol: 'Features' }]
  },
  {
    id: 'm4', number: 4, title: 'Analiza Murdăriei prin Satelit',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Analiză Planet Labs (3m) + OpenWeather History pentru calcul soiling index.',
    financialImpact: { savings: '3-8% yield', roi: '18 zile' },
    apis: [{ provider: 'Planet Labs', protocol: 'REST' }, { provider: 'OpenWeather', protocol: 'Air Pollution' }]
  },
  {
    id: 'm5', number: 5, title: 'AI pentru Anomalii de Producție',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Calculare expected production vs actual (GHI/DNI) with 94.7% accuracy.',
    financialImpact: { npv: '€23M', roi: '15-25% downtime red.' },
    apis: [{ provider: 'OpenWeather', protocol: 'Solar Irradiance API' }]
  },
  {
    id: 'm6', number: 6, title: 'Previziuni Meteo Adaptate',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Prognoză hyperlocală 48h (GHI, DNI, DHI) via One Call API 3.0.',
    financialImpact: { savings: '€890k/an', roi: '95% accuracy' },
    apis: [{ provider: 'OpenWeather', protocol: 'One Call 3.0' }]
  },
  {
    id: 'm7', number: 7, title: 'Green Hydrogen Electrolyzer Integration',
    priority: Priority.CRITICAL, category: 'Hydrogen & Storage', phase: 1,
    description: 'Optimizare producție H2 când surplus solar.',
    financialImpact: { npv: '€89M', revenue: 'H2 Sales' },
    apis: [{ provider: 'Electrolyzer PLC', protocol: 'Modbus' }]
  },
  {
    id: 'm8', number: 8, title: 'AI Data Center Solar Integration',
    priority: Priority.CRITICAL, category: 'Compute & Digital', phase: 1,
    description: '24/7 Power guarantee calculator pentru data centers equivalent to 100k households.',
    financialImpact: { npv: '€134M', revenue: 'Premium Power' },
    apis: [{ provider: 'DCIM', protocol: 'REST' }]
  },
  {
    id: 'm9', number: 9, title: 'Long-Duration Energy Storage (LDES)',
    priority: Priority.CRITICAL, category: 'Hydrogen & Storage', phase: 1,
    description: 'Stocare multi-day bazată pe prognoză meteo extinsă.',
    financialImpact: { npv: '€71M', revenue: 'Arbitrage' },
    apis: [{ provider: 'OpenWeather', protocol: 'Forecast 16-day' }]
  },
  {
    id: 'm10', number: 10, title: 'Urmărirea Preciză a Degradării',
    priority: Priority.CRITICAL, category: 'O&M & Analytics', phase: 1,
    description: 'Calcul rată degradare bazată pe UV exposure istoric for 1.79M panels.',
    financialImpact: { savings: 'Warranty Claims', roi: '6 mo advance failure' },
    apis: [{ provider: 'OpenWeather', protocol: 'Solar History' }]
  },
  { id: 'm11', number: 11, title: 'Benchmarking de Performanță', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Normalizare PR la irradianță (Weather Adjusted).', financialImpact: { roi: 'Optimization' }, apis: [] },
  { id: 'm12', number: 12, title: 'Previziunea Predicțivă a Defecțiunilor', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Alertare cu 90 zile avans.', financialImpact: { roi: 'Maintenance' }, apis: [] },
  { id: 'm13', number: 13, title: 'Optimizator de Piese de Schimb', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Inventory AI focusing on critical spares.', financialImpact: { savings: '€4.2M' }, apis: [] },
  { id: 'm14', number: 14, title: 'Amprenta de Carbon & ESG', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Calcul CO2 evitat bazat pe producție reală.', financialImpact: { revenue: 'Carbon Credits' }, apis: [{ provider: 'OpenWeather', protocol: 'Air Pollution' }] },
  { id: 'm15', number: 15, title: 'Monitorizarea Biodiversității', priority: Priority.ESSENTIAL, category: 'O&M & Analytics', phase: 2, description: 'Tracking NDVI din satelit (Planet Labs).', financialImpact: { roi: 'Compliance' }, apis: [{ provider: 'Planet Labs', protocol: 'Features API' }] },
  { id: 'm16', number: 16, title: 'Digital Twin', priority: Priority.ESSENTIAL, category: 'Compute & Digital', phase: 2, description: 'Simulare procese with 97.8% simulation accuracy.', financialImpact: { roi: 'Simulation' }, apis: [] },
  { id: 'm17', number: 17, title: 'Învățare între Parcuri', priority: Priority.ESSENTIAL, category: 'Compute & Digital', phase: 2, description: 'Federated Learning across the portfolio.', financialImpact: { roi: 'Knowledge' }, apis: [] },
  { id: 'm18', number: 18, title: 'Real-Time Energy Arbitrage', priority: Priority.ESSENTIAL, category: 'Grid & Trading', phase: 2, description: 'Forecast pentru trading decisions via One Call API.', financialImpact: { revenue: '+34.7%' }, apis: [{ provider: 'OpenWeather', protocol: 'One Call' }] },
  { id: 'm19', number: 19, title: 'PPA Corporate Matchmaker', priority: Priority.ESSENTIAL, category: 'Grid & Trading', phase: 2, description: 'Contractare rapidă within 4.2h duration.', financialImpact: { roi: 'Sales' }, apis: [] },
  { id: 'm20', number: 20, title: 'Optimizator Agrivoltaic', priority: Priority.ESSENTIAL, category: 'Advanced PV', phase: 2, description: 'Dual land-use management.', financialImpact: { revenue: '+3%' }, apis: [] },
  { id: 'm21', number: 21, title: 'Fire Risk Prediction', priority: Priority.ADVANCED, category: 'Resilience', phase: 3, description: 'Biomass dryness (NDVI) + Wind/Temp forecast.', financialImpact: { savings: '€8.1M/event' }, apis: [{ provider: 'Planet Labs', protocol: 'NDVI' }, { provider: 'OpenWeather', protocol: 'Current' }] },
  { id: 'm22', number: 22, title: 'Flood Resilience', priority: Priority.ADVANCED, category: 'Resilience', phase: 3, description: 'Water accumulation (Radar) + 93% risk reduction.', financialImpact: { savings: 'Asset Protection' }, apis: [{ provider: 'Planet Labs', protocol: 'Imagery' }, { provider: 'OpenWeather', protocol: 'One Call' }] },
  { id: 'm23', number: 23, title: 'Robotic Maintenance', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Curățare automată with 352% ROI.', financialImpact: { roi: 'High' }, apis: [] },
  { id: 'm24', number: 24, title: 'Panel DNA Analysis', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Combatere fraudă with €7.7M savings.', financialImpact: { savings: '€7.7M' }, apis: [] },
  { id: 'm25', number: 25, title: 'Islanded Microgrid', priority: Priority.ADVANCED, category: 'Grid & Trading', phase: 3, description: 'Operare independentă capability.', financialImpact: { roi: 'Resilience' }, apis: [] },
  { id: 'm26', number: 26, title: 'Acoustic Monitoring', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Ascultare defecțiuni with €2.93M savings.', financialImpact: { savings: '€2.93M' }, apis: [] },
  { id: 'm27', number: 27, title: 'Solar Spectrum Optimizer', priority: Priority.ADVANCED, category: 'Advanced PV', phase: 3, description: 'Adaptare spectru with €14.2M NPV.', financialImpact: { npv: '€14.2M' }, apis: [] },
  { id: 'm28', number: 28, title: 'EMI Mapping', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Interferențe electromagnetice with €36.2M NPV.', financialImpact: { npv: '€36.2M' }, apis: [] },
  { id: 'm29', number: 29, title: 'Intelligent Cleaning Scheduler', priority: Priority.ADVANCED, category: 'O&M & Analytics', phase: 3, description: 'Optimizare program curățare (Dust forecast + Rain forecast).', financialImpact: { savings: '€584K/an' }, apis: [{ provider: 'OpenWeather', protocol: 'Air Pollution' }, { provider: 'Planet Labs', protocol: 'Features' }] },
  { id: 'm30', number: 30, title: 'Gamified Performance', priority: Priority.ADVANCED, category: 'Compute & Digital', phase: 3, description: 'Competiție O&M reaching +11.4% revenue.', financialImpact: { revenue: '+11.4%' }, apis: [] },
  { id: 'm31', number: 31, title: 'Grid-Forming Inverter Tech', priority: Priority.INNOVATIVE, category: 'Grid & Trading', phase: 4, description: 'Inerție sintetică.', financialImpact: { roi: 'Stability' }, apis: [] },
  { id: 'm32', number: 32, title: 'Demand Response Aggregation', priority: Priority.INNOVATIVE, category: 'Grid & Trading', phase: 4, description: 'Load shifting.', financialImpact: { roi: 'Capacity' }, apis: [] },
  { id: 'm33', number: 33, title: 'Wholesale Market Bidding AI', priority: Priority.INNOVATIVE, category: 'Grid & Trading', phase: 4, description: 'Licitație automată.', financialImpact: { roi: 'Margin' }, apis: [] },
  { id: 'm34', number: 34, title: 'Seawater Electrolysis', priority: Priority.INNOVATIVE, category: 'Hydrogen & Storage', phase: 4, description: 'H2 din mare with 90% cost reduction.', financialImpact: { savings: '90% cost' }, apis: [] },
  { id: 'm35', number: 35, title: 'Hydrogen Storage & Fuel Cell', priority: Priority.INNOVATIVE, category: 'Hydrogen & Storage', phase: 4, description: 'Stocare sezonieră.', financialImpact: { roi: 'Shift' }, apis: [] },
  { id: 'm36', number: 36, title: 'Bifacial + Tracker Optimization', priority: Priority.INNOVATIVE, category: 'Advanced PV', phase: 4, description: 'Maximizare albedo (+30% revenue).', financialImpact: { revenue: '+30%' }, apis: [] },
  { id: 'm37', number: 37, title: 'Perovskite-Silicon Tandem', priority: Priority.INNOVATIVE, category: 'Advanced PV', phase: 4, description: 'Eficiență 34.6%.', financialImpact: { roi: 'Next Gen' }, apis: [] },
  { id: 'm38', number: 38, title: 'Temperature Coefficient Optimizer', priority: Priority.INNOVATIVE, category: 'Advanced PV', phase: 4, description: 'Mitigare căldură impact.', financialImpact: { roi: 'Efficiency' }, apis: [] },
  { id: 'm39', number: 39, title: 'Hyperspectral Diagnostics', priority: Priority.INNOVATIVE, category: 'O&M & Analytics', phase: 4, description: 'Analiză spectrală avansată.', financialImpact: { roi: 'Deep Inspect' }, apis: [{ provider: 'Planet Labs', protocol: 'Spectral' }] },
  { id: 'm40', number: 40, title: 'Cryptocurrency Mining Optimizer', priority: Priority.INNOVATIVE, category: 'Compute & Digital', phase: 4, description: 'Mining în curtailment.', financialImpact: { revenue: 'Monetize' }, apis: [] },
  { id: 'm41', number: 41, title: 'Edge Computing Solar Microgrid', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'Distributed AI.', financialImpact: { roi: 'Latency' }, apis: [] },
  { id: 'm42', number: 42, title: 'Fast Frequency Response', priority: Priority.FUTURE, category: 'Grid & Trading', phase: 4, description: 'Răspuns <1 sec.', financialImpact: { roi: 'Premium' }, apis: [] },
  { id: 'm43', number: 43, title: 'Vehicle-to-Grid Fleet', priority: Priority.FUTURE, category: 'Grid & Trading', phase: 4, description: 'EV battery agg.', financialImpact: { roi: 'Storage' }, apis: [] },
  { id: 'm44', number: 44, title: 'Blockchain Energy Trading', priority: Priority.FUTURE, category: 'Grid & Trading', phase: 4, description: 'P2P Trading.', financialImpact: { roi: 'Decentralized' }, apis: [] },
  { id: 'm45', number: 45, title: 'Quantum Computing Optimization', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'Simulare complexă.', financialImpact: { roi: 'Speed' }, apis: [] },
  { id: 'm46', number: 46, title: 'AI Self-Improvement Engine', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'ROI infinit.', financialImpact: { roi: 'Autonomy' }, apis: [] },
  { id: 'm47', number: 47, title: 'Neural Network Auto-Retraining', priority: Priority.FUTURE, category: 'Compute & Digital', phase: 4, description: 'Adaptare continuă.', financialImpact: { roi: 'Accuracy' }, apis: [] },
];
