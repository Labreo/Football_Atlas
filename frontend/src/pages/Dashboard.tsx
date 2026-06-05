import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTacticalStore } from '../stores/useTacticalStore';
import { useLearningUIStore } from '../stores/LearningUIStore';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';
import { learningStateStore } from '../tacticalOrchestrator/store';
import ConversationalLearningInterface from '../components/chat/ConversationalLearningInterface';
import PlaybookInterface from '../components/playbook/PlaybookInterface';
import { tacticalApi } from '../apiClients/tacticalApi';
import { useBreakdownStore } from '../stores/useBreakdownStore';
import { ConceptRouter } from '../tacticalOrchestrator/router';
import { JourneyDashboard } from '../components/journey/JourneyDashboard';
import { useLearningJourneyStore } from '../stores/useLearningJourneyStore';

// Lazy-load developer tools (only rendered in dev mode Settings tab)
const ConceptExplorer = lazy(() => import('../components/dev/ConceptExplorer'));
const PrimitiveExplorer = lazy(() => import('../components/dev/PrimitiveExplorer'));
const HistoricalExampleExplorer = lazy(() => import('../components/dev/HistoricalExampleExplorer'));

type Tab = 'playbook' | 'classroom' | 'explore' | 'journey' | 'settings';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('playbook');
  const { fetchConcepts } = useTacticalStore();

  // Load tactical concepts library on startup
  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  const selectConceptGlobally = async (conceptId: string) => {
    useLearningUIStore.getState().setLoading(true);
    useLearningUIStore.getState().setError(null);
    try {
      const concept = await tacticalApi.getConceptById(conceptId);
      useLearningUIStore.getState().setCurrentConcept(concept);
      useLearningUIStore.getState().setCurrentExplanation(concept.core_explanation);
      useLearningUIStore.getState().setPhaseInfo(1, 'Initial Shape');
      useLearningUIStore.getState().setPhaseAnnotation('');
      useLearningUIStore.getState().clearFollowUpChain();

      const resolvedModule = ConceptRouter.resolveAnimationModule(conceptId);
      useTacticalStore.setState({ 
        currentConcept: concept, 
        playState: resolvedModule ? 'playing' : 'stopped' 
      });
      learningStateStore.getState().setCurrentConcept(concept);
      learningStateStore.getState().setCurrentAnimation(resolvedModule);
      learningStateStore.getState().setAnimationStatus(resolvedModule ? 'playing' : 'stopped');
      
      if (resolvedModule) {
        useLearningUIStore.getState().setAnimationState('playing');
      } else {
        useLearningUIStore.getState().setAnimationState('stopped');
      }

      // Track concept view on journey store
      await useLearningJourneyStore.getState().trackConceptView(conceptId);
    } catch (err: any) {
      useLearningUIStore.getState().setError(`Failed to load concept: ${err.message}`);
    } finally {
      useLearningUIStore.getState().setLoading(false);
    }
  };

  const launchBreakdownGlobally = async (exampleId: string, conceptId: string) => {
    // 1. Select the concept first
    await selectConceptGlobally(conceptId);
    // 2. Fetch and start breakdown
    try {
      const examples = await tacticalApi.searchHistoricalExamples({});
      const example = examples.find(e => e.example_id === exampleId);
      if (example) {
        await useBreakdownStore.getState().startBreakdown(example);
      }
    } catch (_) {}
  };

  // Reset the board to a clean default state whenever the user switches tabs.
  // This prevents stale animations from carrying over between Playbook ↔ Classroom.
  useEffect(() => {
    // Bypass clear if we are navigating to playbook with a concept already selected
    if (activeTab === 'playbook' && useTacticalStore.getState().currentConcept) {
      return;
    }

    // Clear global concept selection
    useTacticalStore.setState({
      currentConcept: null,
      playState: 'stopped',
    });

    // Clear the learning UI store
    useLearningUIStore.getState().resetUIStore();

    // Clear orchestrator state store
    learningStateStore.getState().reset();

    // Reset the orchestrator's active module
    learningOrchestrator.reset();
  }, [activeTab]);

  return (
    <div className="h-screen w-screen flex bg-[#0A0D14] text-slate-100 overflow-hidden font-sans relative">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT NAVIGATION RAIL (Slim, Icons-only, premium sidebar)      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="w-[72px] h-full bg-[#0E1320] border-r border-[#1E293B]/70 flex flex-col items-center py-6 justify-between shrink-0 z-30 select-none">
        
        {/* Top: Stylized Football Atlas Logo */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/25 hover:scale-105 transition-transform duration-200 cursor-pointer">
            <span className="font-display font-extrabold text-white text-xl">F</span>
          </div>
        </div>

        {/* Center: Main Navigation Rail Icons */}
        <div className="flex flex-col gap-6">
          
          {/* Playbook Tab */}
          <button
            onClick={() => setActiveTab('playbook')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'playbook'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical Playbook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Playbook</span>
          </button>

          {/* Classroom Tab */}
          <button
            onClick={() => setActiveTab('classroom')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'classroom'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical Classroom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Classroom</span>
          </button>

          {/* Explore Tab */}
          <button
            onClick={() => setActiveTab('explore')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'explore'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Knowledge Explorer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Explore</span>
          </button>

          {/* Journey Tab */}
          <button
            onClick={() => setActiveTab('journey')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'journey'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="My Journey"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Journey</span>
          </button>

        </div>

        {/* Bottom: Settings Gear */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Settings</span>
          </button>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT AREA                                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full relative overflow-hidden">
        {activeTab === 'playbook' && (
          <PlaybookInterface />
        )}

        {activeTab === 'classroom' && (
          <ConversationalLearningInterface />
        )}

        {activeTab === 'explore' && (
          <ExploreTab />
        )}

        {activeTab === 'journey' && (
          <JourneyDashboard
            onNavigateToConcept={(conceptId) => {
              selectConceptGlobally(conceptId);
              setActiveTab('playbook');
            }}
            onNavigateToBreakdown={(exampleId, conceptId) => {
              launchBreakdownGlobally(exampleId, conceptId);
              setActiveTab('playbook');
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>

    </div>
  );
};

// ────────────────────────────────────────────────────────────
// EXPLORE TAB COMPONENT (Clean Ingestion & Search Panel)
// ────────────────────────────────────────────────────────────
const ExploreTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pubYear, setPubYear] = useState('2024');
  const [source, setSource] = useState('football_atlas_docling');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docChunks, setDocChunks] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const loadDocs = async () => {
    setLoadingDocs(true);
    try {
      const docs = await tacticalApi.getDocuments();
      setDocuments(docs);
    } catch (_) {}
    setLoadingDocs(false);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploadStatus('loading');
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('author', author || 'Anonymous');
      formData.append('publication_year', pubYear);
      formData.append('source', source);

      await tacticalApi.uploadDocument(formData);
      setUploadStatus('success');
      setFile(null);
      setTitle('');
      setAuthor('');
      loadDocs();
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Failed to upload document');
    }
  };

  const handleDocClick = async (docId: string) => {
    setSelectedDocId(docId);
    setDocChunks([]);
    try {
      const chunks = await tacticalApi.getDocumentChunks(docId);
      setDocChunks(chunks);
    } catch (_) {}
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await tacticalApi.searchKeyword(searchQuery);
      setSearchResults(results);
    } catch (_) {}
    setSearching(false);
  };

  return (
    <div className="w-full p-6 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 h-full bg-[#0A0D14]">
      
      {/* Left Column (lg:col-span-5): Document Upload & Ingested Docs List */}
      <div className="lg:col-span-5 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Upload Form card */}
        <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-5 shadow-lg shrink-0">
          <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase mb-4 border-b border-[#23324C]/40 pb-2">
            Ingest Football PDF/MD
          </h3>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">File</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-300 bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2 cursor-pointer focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-700 file:text-slate-200 file:hover:bg-slate-600 file:cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Guardiola Tactics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Author</label>
                <input
                  type="text"
                  placeholder="e.g. Sanjay Waradkar"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Publication Year</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={pubYear}
                  onChange={(e) => setPubYear(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                {uploadStatus === 'loading' && <span className="text-[10px] text-[#10B981] animate-pulse font-mono">⏳ Ingesting via Docling CLI...</span>}
                {uploadStatus === 'success' && <span className="text-[10px] text-emerald-500 font-bold font-mono">✅ Ingested successfully!</span>}
                {uploadStatus === 'error' && <span className="text-[10px] text-red-500 font-bold truncate max-w-[200px]" title={errorMessage}>❌ {errorMessage}</span>}
              </div>
              <button
                type="submit"
                disabled={uploadStatus === 'loading' || !file}
                className="px-4 py-2 bg-[#10B981] text-white font-display text-xs font-semibold rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                Upload
              </button>
            </div>
          </form>
        </div>

        {/* Ingested Documents List Card */}
        <div className="flex-1 bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              Ingested Playbooks
            </h3>
            <button onClick={loadDocs} className="text-slate-400 hover:text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingDocs && documents.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-slate-500 animate-pulse font-mono">Loading playbooks database...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>No playbooks ingested yet.</span>
                <span className="text-[10px] text-slate-600 mt-1">Upload a PDF or Markdown file to start.</span>
              </div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.document_id}
                  onClick={() => handleDocClick(doc.document_id)}
                  className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1 transition-colors ${
                    selectedDocId === doc.document_id
                      ? 'border-[#10B981] bg-[#10B981]/5 text-slate-100'
                      : 'border-[#23324C]/40 bg-[#182235]/20 hover:border-slate-700 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="truncate pr-2">{doc.title}</span>
                    <span className="text-[9px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-wide shrink-0">
                      {doc.language}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{doc.author} ({doc.publication_year})</span>
                    <span className="text-slate-400 font-semibold">{doc.document_type.toUpperCase()} format</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column (lg:col-span-7): Keyword search & Selected Chunks list */}
      <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Keyword Search Card */}
        <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search tactical keywords (e.g. Messi, false 9, Gegenpressing, low block)..."
              value={searchQuery}
              required
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-xl text-xs font-sans bg-[#182235]/40 border border-[#23324C]/60 text-slate-100 focus:outline-none focus:border-[#10B981] transition-colors"
            />
            <button
              type="submit"
              disabled={searching}
              className="h-10 px-5 bg-[#10B981] text-white font-display text-xs font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Chunks Output Board */}
        <div className="flex-1 bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              {searchQuery && searchResults.length > 0
                ? `Search Matches for "${searchQuery}" (${searchResults.length})`
                : selectedDocId
                ? 'Document Chunk Records'
                : 'Chunks & Grounding Viewer'}
            </h3>
            {selectedDocId && (
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/5 px-2 py-0.5 rounded border border-[#10B981]/25">
                {docChunks.length} segments
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Show search results if searching */}
            {searchQuery && searchResults.length > 0 ? (
              searchResults.map((hit, idx) => (
                <div key={hit.chunk_id || idx} className="p-4 rounded-xl bg-[#182235]/30 border border-[#23324C]/40 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#23324C]/20 pb-1.5">
                    <span>{hit.section_title || 'Segment'} (Page {hit.page_number})</span>
                    <span className="text-[#10B981]">Lang: {hit.language}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    {hit.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hit.concept_tags && hit.concept_tags.map((tag: string) => (
                      <span key={tag} className="text-[8px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : selectedDocId ? (
              docChunks.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-slate-500 animate-pulse font-mono">Parsing document chunks...</span>
                </div>
              ) : (
                docChunks.map((chunk, idx) => (
                  <div key={chunk.chunk_id || idx} className="p-4 rounded-xl bg-[#182235]/30 border border-[#23324C]/40 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#23324C]/20 pb-1.5">
                      <span>{chunk.section_title || 'Section'} (Page {chunk.page_number})</span>
                      <span className="text-[#10B981]">Lang: {chunk.language}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                      {chunk.content}
                    </p>
                    {chunk.concept_tags && chunk.concept_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {chunk.concept_tags.map((tag: string) => (
                          <span key={tag} className="text-[8px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {tag.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-16 text-center select-none space-y-2">
                <span className="text-3xl">📂</span>
                <p className="max-w-[280px] leading-relaxed font-display">
                  Select an Ingested Playbook from the left list to inspect its segmented chunks, or search keywords directly.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

// ────────────────────────────────────────────────────────────
// HISTORICAL ACTIVITY LOG FEED COMPONENT
// ────────────────────────────────────────────────────────────
// HistoryTab has been removed and replaced by JourneyDashboard

// ────────────────────────────────────────────────────────────
// SYSTEM CONFIGURATIONS SETTINGS TAB COMPONENT
// ────────────────────────────────────────────────────────────
const SettingsTab: React.FC = () => {
  return (
    <div className="flex-1 w-full p-8 overflow-y-auto max-w-2xl mx-auto flex flex-col gap-6 bg-[#0A0D14] h-full">
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wider text-slate-100 uppercase">
          Settings
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mt-1 font-display">
          Manage your Football Atlas workspace and server API configurations.
        </p>
      </div>

      <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* API Status */}
        <div className="space-y-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">Services Status</span>
          <div className="grid grid-cols-2 gap-4 text-xs font-display">
            <div className="p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Backend Server</span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> ONLINE (3001)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">IBM watsonx.ai</span>
              <span className="flex items-center gap-1.5 text-[#10B981] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> OPENROUTER LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Models */}
        <div className="space-y-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">Active AI Model</span>
          <div className="p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 text-xs flex flex-col gap-1 font-sans">
            <div className="font-bold text-slate-200">ibm-granite/granite-4.1-8b</div>
            <div className="text-[10px] text-slate-400">Configured via OpenRouter mode. Handles tactical query mapping, context-turn classification, and explanation generation.</div>
          </div>
        </div>

        {/* Reset database */}
        <div className="border-t border-[#23324C]/60 pt-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Reset Knowledge Store</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Clears all ingested PDF/Markdown records and deletes store.json.</div>
          </div>
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to clear the entire tactical database store? This cannot be undone.")) {
                try {
                  await fetch('http://localhost:3001/documents', { method: 'DELETE' });
                  alert("Knowledge store reset successfully. Restart the server to apply clean slate.");
                } catch (_) {
                  alert("Database store cleared. Restart the server.");
                }
              }
            }}
            className="px-4 py-2 border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-display text-xs font-semibold rounded-xl transition-all"
          >
            Clear Store
          </button>
        </div>

        {/* Developer Tools — Concept Runtime Explorer */}
        <div className="border-t border-[#23324C]/60 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">Developer Tools</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-900/30 text-amber-400 font-mono uppercase tracking-widest">Dev</span>
          </div>
          <Suspense fallback={
            <div className="p-4 text-xs text-slate-500 font-mono animate-pulse">Loading Developer Tools...</div>
          }>
            <ConceptExplorer />
            <PrimitiveExplorer />
            <HistoricalExampleExplorer />
          </Suspense>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
