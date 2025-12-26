
import React, { useState, useEffect } from 'react';
import { db } from './store/db';
import { Client, ClientCriteria, Lead, SyncLog } from './types';
import { SyncEngine } from './services/syncEngine';

// --- Main Entry ---

const App: React.FC = () => {
  const [auth, setAuth] = useState<{ role: 'coach' | 'client', clientId?: string } | null>(null);

  if (!auth) {
    return <LoginSplash onLogin={(role, clientId) => setAuth({ role, clientId })} />;
  }

  return auth.role === 'coach' ? (
    <CoachAdminApp onLogout={() => setAuth(null)} />
  ) : (
    <ClientPortalApp clientId={auth.clientId!} onLogout={() => setAuth(null)} />
  );
};

// --- Login Gateway ---

const LoginSplash: React.FC<{ onLogin: (role: 'coach' | 'client', id?: string) => void }> = ({ onLogin }) => {
  const clients = db.getClients();
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-blue rounded-full filter blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-gold rounded-full filter blur-[100px] translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
        <div className="flex flex-col justify-center space-y-8">
          <div className="flex items-center space-x-4">
             <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center shadow-2xl">
                <svg className="w-10 h-10 text-brand-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-white leading-none">DEVELOP COACHING</h1>
                <p className="text-sm uppercase tracking-widest font-bold text-brand-blue mt-1">Lead Engine Gateway</p>
             </div>
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">Automate Your <span className="text-brand-gold">Building Pipeline</span></h2>
             <p className="text-slate-400 font-medium leading-relaxed">The internal intelligence engine for Develop Coaching partners. Select your portal to manage your local planning lead generation.</p>
          </div>
        </div>

        <div className="space-y-6">
          <button 
            onClick={() => onLogin('coach')}
            className="w-full bg-brand-blue text-white p-8 rounded-3xl border border-white/10 hover:border-brand-blue hover:bg-white hover:text-brand-dark transition-all text-left group shadow-2xl"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-2 block">Institutional Access</span>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase">Coach Administrator</h3>
              <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </button>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6 backdrop-blur-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 block">Partner Authentication</span>
            <div className="space-y-4">
              <label className="text-xs font-black uppercase text-white/40 tracking-widest">Select Your Business Account</label>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {clients.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => onLogin('client', c.id)}
                    className="bg-white/10 hover:bg-brand-gold hover:text-brand-dark text-white p-4 rounded-xl text-sm font-black uppercase tracking-tight text-left transition-all border border-white/5"
                  >
                    {c.company_name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Coach Admin Application ---

const CoachAdminApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'logs'>('dashboard');
  const [clients, setClients] = useState<Client[]>(db.getClients());
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<{client: Client, criteria: ClientCriteria} | null>(null);

  const refresh = () => setClients(db.getClients());

  const handleSaveClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = editingClient?.client.id || Math.random().toString(36).substr(2, 9);
    
    const client: Client = {
      id: clientId,
      company_name: formData.get('company_name') as string,
      contact_email: formData.get('contact_email') as string,
      ghl_api_key: formData.get('ghl_api_key') as string,
      ghl_location_id: formData.get('ghl_location_id') as string,
      ghl_pipeline_id: formData.get('ghl_pipeline_id') as string,
      ghl_stage_id: formData.get('ghl_stage_id') as string,
      active: formData.get('active') === 'on',
      created_at: editingClient?.client.created_at || new Date().toISOString(),
    };

    const criteria: ClientCriteria = {
      id: editingClient?.criteria.id || Math.random().toString(36).substr(2, 9),
      client_id: clientId,
      postcode: formData.get('postcode') as string,
      radius_km: parseInt(formData.get('radius_km') as string),
      application_types: (formData.get('app_types') as string).split(',').map(s => s.trim()).filter(s => s),
      keywords: (formData.get('keywords') as string).split(',').map(s => s.trim()).filter(s => s),
      schedule_day: parseInt(formData.get('schedule_day') as string),
      last_run_at: editingClient?.criteria.last_run_at || null,
    };

    db.saveClient(client);
    db.saveCriteria(criteria);
    refresh();
    setShowModal(false);
    setEditingClient(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-brand-grey px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-brand-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <h1 className="text-xl font-black uppercase text-brand-dark tracking-tighter">Coach Administrator</h1>
        </div>
        <nav className="flex space-x-12">
          {['dashboard', 'clients', 'logs'].map((tab: any) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'text-brand-blue border-b-2 border-brand-blue pb-1' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">Sign Out</button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Live Partners" value={clients.length.toString()} iconColor="text-brand-gold" />
                <StatCard label="Total Leads Extracted" value={db.getSyncLogs().reduce((acc, l) => acc + l.leads_new, 0).toString()} color="text-brand-blue" />
                <StatCard label="GHL Success Rate" value="100%" color="text-brand-blue" />
             </div>
             <div className="bg-white rounded-3xl border border-brand-grey shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-brand-grey bg-slate-50 font-black text-xs uppercase tracking-widest text-brand-dark">Institutional Operations</div>
                <table className="w-full text-left">
                   <thead className="bg-white text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-brand-grey">
                      <tr><th className="px-6 py-4">Business Entity</th><th className="px-6 py-4">Account Status</th><th className="px-6 py-4">Last Sync Result</th><th className="px-6 py-4 text-right">Settings</th></tr>
                   </thead>
                   <tbody className="divide-y divide-brand-grey">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                           <td className="px-6 py-5">
                             <div className="font-bold text-brand-dark uppercase tracking-tight">{c.company_name}</div>
                             <div className="text-[10px] text-slate-400 font-bold">{c.contact_email}</div>
                           </td>
                           <td className="px-6 py-5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${c.active ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-400'}`}>{c.active ? 'Active Sync' : 'Paused'}</span>
                           </td>
                           <td className="px-6 py-5">
                              <div className="text-xs font-bold text-brand-blue">
                                {db.getSyncLogs(c.id)[0]?.leads_new || 0} New Leads
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {db.getCriteria(c.id)?.last_run_at ? new Date(db.getCriteria(c.id)!.last_run_at!).toLocaleString() : 'Never run'}
                              </div>
                           </td>
                           <td className="px-6 py-5 text-right font-black uppercase text-[10px] text-brand-blue cursor-pointer hover:underline" onClick={() => {setEditingClient({client: c, criteria: db.getCriteria(c.id)!}); setShowModal(true);}}>Configure Partner</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
             <button onClick={() => {setEditingClient(null); setShowModal(true);}} className="border-2 border-dashed border-brand-grey rounded-3xl flex flex-col items-center justify-center p-8 text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-blue/5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                </div>
                <span className="font-black uppercase text-xs tracking-widest">Enroll New Builder</span>
             </button>
             {clients.map(c => (
                <div key={c.id} className="bg-white p-8 rounded-3xl border border-brand-grey shadow-sm space-y-6 relative overflow-hidden group hover:border-brand-blue transition-colors">
                   <div className="absolute top-0 right-0 w-2 h-full bg-brand-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex justify-between items-start">
                      <h3 className="text-xl font-black uppercase text-brand-dark tracking-tighter max-w-[70%]">{c.company_name}</h3>
                      <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-1 rounded text-slate-400">ID: {c.id}</span>
                   </div>
                   <div className="space-y-3 border-y border-brand-grey py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex justify-between"><span>Pipeline Endpoint</span><span className="text-brand-blue">{c.ghl_pipeline_id}</span></div>
                      <div className="flex justify-between"><span>Default Anchor</span><span className="text-brand-dark">{db.getCriteria(c.id)?.postcode}</span></div>
                   </div>
                   <div className="flex space-x-2">
                     <button onClick={() => {setEditingClient({client: c, criteria: db.getCriteria(c.id)!}); setShowModal(true);}} className="flex-1 bg-brand-blue/5 text-brand-blue py-3 rounded-xl font-black uppercase text-[10px] hover:bg-brand-blue hover:text-white transition-all">Settings</button>
                     <button onClick={() => { if(confirm('Purge client profile?')) { db.deleteClient(c.id); refresh(); } }} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'logs' && (
           <div className="bg-white rounded-3xl border border-brand-grey shadow-sm overflow-hidden animate-in fade-in duration-500">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-brand-grey">
                    <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Account</th><th className="px-6 py-4">Execution Stats</th><th className="px-6 py-4">Health</th><th className="px-6 py-4 text-right">Process Time</th></tr>
                 </thead>
                 <tbody className="divide-y divide-brand-grey text-sm">
                    {db.getSyncLogs().map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-6 py-5 font-mono text-xs text-slate-400">{new Date(l.run_date).toLocaleString()}</td>
                        <td className="px-6 py-5 font-bold uppercase text-brand-dark">{clients.find(c => c.id === l.client_id)?.company_name}</td>
                        <td className="px-6 py-5">
                          <div className="flex space-x-2">
                             <span className="text-[10px] font-black bg-brand-gold/10 text-brand-dark px-2 py-0.5 rounded uppercase">Found: {l.leads_found}</span>
                             <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded uppercase">Sent: {l.leads_sent}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {l.errors.length > 0 ? <span className="text-red-500 font-bold uppercase text-[10px]">{l.errors.length} Errors</span> : <span className="text-emerald-500 font-bold uppercase text-[10px]">Optimal</span>}
                        </td>
                        <td className="px-6 py-5 text-right font-mono text-xs text-slate-300">{(l.duration_ms/1000).toFixed(2)}s</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-brand-grey animate-in zoom-in duration-200">
            <div className="px-10 py-8 border-b border-brand-grey flex justify-between items-center bg-white">
              <h2 className="text-2xl font-black uppercase text-brand-dark tracking-tighter">Partner Configuration</h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-blue hover:bg-white transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveClient} className="p-10 space-y-10 overflow-y-auto max-h-[80vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <Input name="company_name" label="Builder Business Name" defaultValue={editingClient?.client.company_name} required />
                <Input name="contact_email" label="Contact Email" type="email" defaultValue={editingClient?.client.contact_email} required />
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-brand-grey space-y-8">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-blue">CRM Integration Gateway</h4>
                 <Input name="ghl_api_key" label="GHL REST API Key" defaultValue={editingClient?.client.ghl_api_key} required />
                 <div className="grid grid-cols-3 gap-6">
                    <Input name="ghl_location_id" label="Location ID" defaultValue={editingClient?.client.ghl_location_id} required />
                    <Input name="ghl_pipeline_id" label="Pipeline ID" defaultValue={editingClient?.client.ghl_pipeline_id} required />
                    <Input name="ghl_stage_id" label="Stage ID" defaultValue={editingClient?.client.ghl_stage_id} required />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <Input name="postcode" label="Anchor Postcode" defaultValue={editingClient?.criteria.postcode} required />
                <Input name="radius_km" label="Search Radius (KM)" type="number" defaultValue={editingClient?.criteria.radius_km} required />
              </div>
              <div className="flex items-center space-x-4 bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
                <input type="checkbox" name="active" defaultChecked={editingClient?.client.active ?? true} id="admin_active_toggle" className="w-7 h-7 text-brand-blue border-brand-grey rounded-lg focus:ring-brand-blue" />
                <label htmlFor="admin_active_toggle" className="text-xs font-black uppercase tracking-widest text-brand-blue">Authorized Production Sync Subscription</label>
              </div>
              <div className="flex justify-end pt-4 space-x-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-black uppercase text-[11px] text-slate-400 hover:text-brand-dark">Discard</button>
                <button type="submit" className="bg-brand-blue text-white px-12 py-4 rounded-2xl font-black uppercase text-[11px] hover:bg-brand-dark shadow-2xl shadow-brand-blue/20 transition-all">Commit Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Client Portal Application ---

const ClientPortalApp: React.FC<{ clientId: string, onLogout: () => void }> = ({ clientId, onLogout }) => {
  const [view, setView] = useState<'results' | 'filters' | 'details'>('results');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const client = db.getClients().find(c => c.id === clientId)!;
  const leads = db.getLeads(clientId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Branding Header */}
      <header className="bg-white border-b-4 border-brand-gold px-8 py-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-brand-blue rounded-xl flex items-center justify-center shadow-lg">
             <svg className="w-10 h-10 text-brand-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-brand-dark">{client.company_name}</h1>
            <p className="text-xs font-black uppercase tracking-widest text-brand-blue mt-1">Develop Coaching Portal</p>
          </div>
        </div>
        <div className="flex items-center space-x-8">
           <button 
             onClick={() => setView('results')}
             className={`text-[11px] font-black uppercase tracking-widest ${view === 'results' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400'}`}
           >
             Available Projects
           </button>
           <button 
             onClick={() => setView('filters')}
             className={`text-[11px] font-black uppercase tracking-widest ${view === 'filters' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400'}`}
           >
             Filters
           </button>
           <button onClick={onLogout} className="text-[11px] font-black uppercase text-red-500 hover:underline">Log Out</button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {view === 'results' && (
          <div className="space-y-12">
             <div className="flex justify-center">
                <h2 className="text-5xl font-black uppercase text-brand-dark tracking-tighter text-center">
                  Showing {leads.length} of {leads.length * 10} matching projects
                </h2>
             </div>

             <div className="flex justify-between items-center px-4">
                <button className="bg-brand-blue/30 text-white px-8 py-3 rounded text-[11px] font-black uppercase tracking-widest hover:bg-brand-blue transition-colors">Download</button>
                <button onClick={() => setView('filters')} className="bg-brand-blue/30 text-white px-8 py-3 rounded text-[11px] font-black uppercase tracking-widest hover:bg-brand-blue transition-colors">Filter</button>
             </div>

             <div className="bg-white border border-brand-grey shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-brand-gold text-brand-dark text-xs uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Stage</th>
                        <th className="px-6 py-4">Value</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4"><input type="checkbox" className="w-4 h-4" /></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-brand-grey">
                      {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-5">
                              <button onClick={() => { setSelectedLead(lead); setView('details'); }} className="text-brand-blue font-bold hover:underline text-left">
                                {lead.description}
                              </button>
                           </td>
                           <td className="px-6 py-5 text-sm font-bold text-slate-600">{lead.authority_name}</td>
                           <td className="px-6 py-5 text-sm font-bold text-slate-600">{lead.stage || lead.application_type}</td>
                           <td className="px-6 py-5 text-sm font-bold text-slate-600">{lead.estimated_value || '£0 - £100K'}</td>
                           <td className="px-6 py-5 text-sm font-bold text-slate-600">{new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                           <td className="px-6 py-5"><input type="checkbox" className="w-4 h-4 border-brand-grey rounded" /></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'filters' && (
          <div className="space-y-12">
             <div className="bg-brand-gold px-10 py-4 font-black uppercase text-xl tracking-widest text-brand-dark">Locations</div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <FilterCategory title="London" options={['North London', 'South London', 'East London', 'West London', 'Central London']} active />
                <FilterCategory title="South East" options={['Berkshire', 'Buckinghamshire', 'Hampshire', 'Kent', 'Surrey', 'Sussex']} active />
                <FilterCategory title="East Midlands" options={['Derbyshire', 'Leicestershire', 'Lincolnshire', 'Nottinghamshire']} active />
                <FilterCategory title="West Midlands" options={['Herefordshire', 'Shropshire', 'Staffordshire', 'Warwickshire']} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-6">
                   <div className="bg-brand-gold px-6 py-3 font-black uppercase text-sm tracking-widest text-brand-dark">Stages</div>
                   <div className="space-y-3 px-2">
                      {['Outline Plans Submitted', 'Outline Plans Approved', 'Detailed Plans Submitted', 'Detailed Plans Approved', 'Refused', 'Withdrawn'].map(s => (
                        <label key={s} className="flex items-center space-x-3 text-sm font-bold text-slate-600">
                          <input type="checkbox" className="w-4 h-4 rounded text-brand-blue" />
                          <span>{s}</span>
                        </label>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-brand-gold px-6 py-3 font-black uppercase text-sm tracking-widest text-brand-dark">Values (£)</div>
                   <div className="space-y-3 px-2">
                      {['Over 10m', '5m - 10m', '1m - 5m', '100k - 1m', 'Under 100k'].map(v => (
                        <label key={v} className="flex items-center space-x-3 text-sm font-bold text-slate-600">
                          <input type="checkbox" className="w-4 h-4 rounded text-brand-blue" />
                          <span>{v}</span>
                        </label>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-brand-gold px-6 py-3 font-black uppercase text-sm tracking-widest text-brand-dark">Dates</div>
                   <div className="space-y-3 px-2">
                      {['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 60 days', 'Last 90 days'].map(d => (
                        <label key={d} className="flex items-center space-x-3 text-sm font-bold text-slate-600">
                          <input type="radio" name="date" className="w-4 h-4 text-brand-blue" />
                          <span>{d}</span>
                        </label>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-brand-gold px-6 py-3 font-black uppercase text-sm tracking-widest text-brand-dark">Text Search</div>
                   <div className="px-2">
                      <input type="text" className="w-full border-2 border-brand-grey p-3 rounded text-sm font-bold outline-none focus:border-brand-blue" placeholder="Enter keywords..." />
                   </div>
                </div>
             </div>

             <div className="flex justify-end space-x-4">
                <button onClick={() => setView('results')} className="bg-brand-dark text-white px-10 py-4 rounded text-xs font-black uppercase tracking-[0.2em] hover:bg-brand-blue transition-colors">Reset Search Criteria</button>
                <button onClick={() => setView('results')} className="bg-brand-blue text-white px-10 py-4 rounded text-xs font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-colors">Save As Project Alert</button>
                <button onClick={() => setView('results')} className="bg-brand-blue text-white px-10 py-4 rounded text-xs font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-colors">View Results</button>
             </div>
          </div>
        )}

        {view === 'details' && selectedLead && (
          <div className="space-y-12 animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-start">
                <button onClick={() => setView('results')} className="text-brand-blue font-black uppercase text-xs flex items-center space-x-2">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                   <span>Back to results</span>
                </button>
                <div className="bg-brand-blue text-white px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest">
                   Reference: {selectedLead.planit_reference}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-10">
                   <div className="space-y-4">
                      <h2 className="text-5xl font-black uppercase text-brand-dark tracking-tighter leading-none">{selectedLead.description}</h2>
                      <p className="text-2xl font-bold text-slate-400">{selectedLead.address}, {selectedLead.postcode}</p>
                   </div>

                   <div className="bg-white border-l-8 border-brand-gold p-10 shadow-sm space-y-6">
                      <h4 className="font-black uppercase text-xs tracking-widest text-brand-blue">Project Summary</h4>
                      <p className="text-lg font-bold leading-relaxed text-slate-600 italic">"The proposed works involve a {selectedLead.description.toLowerCase()} located within the {selectedLead.authority_name} district. Detailed plans have been submitted for review."</p>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <DetailBox label="Authority" value={selectedLead.authority_name} />
                      <DetailBox label="Application Type" value={selectedLead.application_type} />
                      <DetailBox label="Estimated Value" value={selectedLead.estimated_value || '£0 - £100K'} />
                      <DetailBox label="Current Stage" value={selectedLead.stage || 'Submitted'} />
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-brand-dark text-white p-8 rounded-3xl shadow-xl space-y-6">
                      <h4 className="font-black uppercase text-xs tracking-widest text-brand-gold text-center">Contact Information</h4>
                      <div className="space-y-4">
                         <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Agent</p>
                            <p className="text-lg font-black uppercase">{selectedLead.agent_name || 'Direct Applicant'}</p>
                         </div>
                         {selectedLead.agent_address && (
                           <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                              <p className="text-sm font-bold text-slate-200">{selectedLead.agent_address}</p>
                           </div>
                         )}
                      </div>
                      <button className="w-full bg-brand-gold text-brand-dark py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all">Request Full Dossier</button>
                   </div>

                   <div className="bg-white border-2 border-brand-grey border-dashed p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planning Documents (PDF)</p>
                      <button className="text-brand-blue font-black uppercase text-[10px] hover:underline">View Portal Files</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Persistent Footer Call to Action */}
      <footer className="bg-brand-gold py-10 flex flex-col items-center justify-center space-y-4 shadow-inner">
         <h3 className="text-4xl font-black uppercase tracking-tighter text-brand-dark">Get Your <span className="text-white drop-shadow-md">10 Free Leads</span></h3>
         <button className="bg-brand-dark text-white px-12 py-4 rounded-full font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-brand-blue transition-all">Activate Trial Account</button>
      </footer>
    </div>
  );
};

// --- Portal Specific UI Components ---

const FilterCategory: React.FC<{ title: string, options: string[], active?: boolean }> = ({ title, options, active }) => (
  <div className="space-y-6">
    <div className={`px-6 py-3 font-black uppercase text-sm tracking-widest border-l-4 ${active ? 'bg-brand-gold border-brand-dark text-brand-dark' : 'bg-slate-100 border-brand-grey text-slate-400'}`}>
      {title}
    </div>
    <div className="space-y-3 px-2">
      {options.map(opt => (
        <label key={opt} className="flex items-center space-x-3 text-sm font-bold text-slate-600 hover:text-brand-blue cursor-pointer transition-colors">
          <input type="checkbox" defaultChecked={active} className="w-4 h-4 rounded text-brand-blue border-brand-grey" />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  </div>
);

const DetailBox: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="bg-white p-6 border-b-2 border-slate-100 flex flex-col space-y-1">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-lg font-black text-brand-dark uppercase tracking-tight">{value}</span>
  </div>
);

// --- Admin Subcomponents ---

// Reusable Input Component for Admin Forms
const Input: React.FC<{
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
}> = ({ name, label, defaultValue, type = 'text', required }) => (
  <div className="space-y-2">
    <label htmlFor={name} className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      defaultValue={defaultValue}
      required={required}
      className="w-full bg-white border border-brand-grey p-3 rounded-xl text-sm font-bold text-brand-dark outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
    />
  </div>
);

const Section: React.FC<{title: string, children: React.ReactNode, highlight?: boolean}> = ({title, children, highlight}) => (
  <div className={`space-y-6 ${highlight ? 'bg-brand-blue/[0.02] p-8 rounded-3xl border border-brand-blue/10' : ''}`}>
    <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] ${highlight ? 'text-brand-blue' : 'text-slate-400'}`}>{title}</h4>
    <div className="space-y-6">{children}</div>
  </div>
);

const StatCard: React.FC<{label: string, value: string, color?: string, iconColor?: string}> = ({label, value, color='text-brand-dark', iconColor='text-brand-blue'}) => (
  <div className="bg-white p-8 rounded-[35px] shadow-sm border border-brand-grey relative overflow-hidden group hover:border-brand-blue transition-all">
    <div className="absolute top-0 left-0 w-2 h-full bg-brand-gold opacity-30" />
    <div className="flex flex-col space-y-1 relative z-10">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      <span className={`text-3xl font-black ${color} tracking-tighter`}>{value}</span>
    </div>
    <div className={`absolute -right-6 -bottom-6 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-500 ${iconColor}`}>
       <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
         <path d="M13 10V3L4 14h7v7l9-11h-7z" />
       </svg>
    </div>
  </div>
);

export default App;
