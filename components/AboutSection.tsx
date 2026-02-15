import React from 'react';
import { Database, BrainCircuit, Server, DollarSign, ShieldCheck, Users } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const approachItems = [
    {
      title: "Data Standardization",
      description: "With our comprehensive Data Tag-lists for wind and solar PV built on market needs, we make standardization and interoperability the new normal and accessible to all.",
      icon: Database,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20"
    },
    {
      title: "AI Data Enrichment",
      description: "Utilizing the latest movements in machine learning, our patented data enrichment algorithm automates data correction, enriching your data for better decision-making.",
      icon: BrainCircuit,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20"
    },
    {
      title: "Secure Site Server Options",
      description: "Security should be the foundation, not a forgotten feature. That is why you get to decide how you would like to configure the system: on your own hardware or a hosted solution.",
      icon: Server,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20"
    },
    {
      title: "Flexible Pricing Modules",
      description: "Our system is built to fit your business. Let us help you with a pricing model that meets your needs – whether you prefer a CAPEX investment or a SaaS solution.",
      icon: DollarSign,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/20"
    },
    {
      title: "24/7 Service & Support",
      description: "We cover your assets – 24/7, all year round. Select a Service Level Agreement that suits your setup. Our proactive approach allows for safer, simpler, and more efficient operations.",
      icon: ShieldCheck,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/20"
    },
    {
      title: "Integration & Onboarding",
      description: "Excellent software is one thing – unleashing its full potential is another. We set up tailored training programs to onboard users, spanning from basic to administrator user levels.",
      icon: Users,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
      borderColor: "border-cyan-400/20"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-white mb-4">Our Holistic Approach to Software</h2>
        <p className="text-slate-400 text-lg max-w-3xl">
          We believe in a comprehensive strategy that combines cutting-edge technology with practical business needs. 
          Here is how we handle the critical aspects of modern energy management software.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {approachItems.map((item, index) => (
          <div 
            key={index} 
            className={`bg-slate-800 p-6 rounded-xl border ${item.borderColor} hover:border-opacity-50 transition-all duration-300 hover:transform hover:-translate-y-1 shadow-lg`}
          >
            <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-4`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
