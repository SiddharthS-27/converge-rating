import React, { useState, useEffect } from 'react';
import { ParsedProfile, Opportunity, TeammateMatch, MLMatchResponse, TeammateRequest, Teammate, RatingSubmission } from '../types';
import { 
  Terminal, User, Layers, Search, 
  Code, FlaskConical, Globe, Github, 
  ExternalLink, Send, Sparkles, CheckCircle,
  FileText, Trophy, Loader2, AlertCircle, 
  FolderGit2, ArrowLeft, BarChart, Users,
  Mail, Building2, BookOpen, GraduationCap, Download, Plus,
  Inbox, Check, X, Clock, AlertTriangle, Star, Trash2,
  UploadCloud, BadgeCheck
} from 'lucide-react';
import { 
    getMyProjects, 
    getExploreProjects, 
    createProject, 
    getTeammateMatches, 
    getUserProfileById, 
    addTeammate, 
    getProjectDetails, 
    getTeammateRequests, 
    acceptTeammateRequest, 
    submitTeammateRating, 
    completeProject,
    downloadMyResume,
    downloadUserResume,
    uploadUserResume,
    fileToBase64
} from '../services/api.service';

// Access global PDF.js library
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

/**
 * ============================================================================
 * TAB 1: PROFILE TAB
 * ============================================================================
 */
interface ProfileTabProps {
  data: ParsedProfile | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ data, loading, error, onRetry }) => {
  const handleDownload = async () => {
      try {
          await downloadMyResume();
      } catch (e) {
          alert("Failed to download resume. It may not exist.");
      }
  };

  return (
    <div className="space-y-8">
      {/* 1. DATA TERMINAL */}
      <div className="bg-converge-bg rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col min-h-[500px] relative">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center uppercase tracking-wider">
            <Terminal className="w-4 h-4 mr-2 text-converge-emerald" />
            Profile Entity Data
          </h3>
          <div className="flex items-center gap-3">
              <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg border border-slate-600 transition-all shadow-sm"
              >
                  <Download className="w-3 h-3" /> Download Resume PDF
              </button>
              {data && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <User className="w-3 h-3 mr-1" /> Active
              </span>
              )}
          </div>
        </div>

        <div className="p-0 flex-grow overflow-hidden relative bg-slate-900/50">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-converge-blue" />
              <p className="font-mono text-sm">Fetching Node Data...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-8 text-center">
              <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-medium text-lg text-white mb-2">Connection Error</h4>
              <p className="text-sm opacity-80 max-w-md mb-6 whitespace-pre-wrap">{error}</p>
              <button onClick={onRetry} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-sm">
                Retry Connection
              </button>
            </div>
          ) : data ? (
            <div className="absolute inset-0 overflow-auto custom-scrollbar p-8">
              <div className="space-y-2 font-mono text-sm">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-start hover:bg-white/5 p-2 rounded transition-colors border-b border-white/5 last:border-0">
                    <span className="text-converge-violet font-semibold sm:w-48 shrink-0 uppercase text-xs tracking-wider pt-0.5">{key}</span>
                    <span className="text-slate-300 break-words flex-1">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Layers className="w-8 h-8 mb-2 opacity-50" />
              <p>No Data Available</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. UPLOAD RESUME SECTION (EMBEDDED) */}
      <div className="pt-8 border-t border-gray-100">
          <UploadResumeTab />
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * COMPONENT: GENERIC PROJECT FEED
 * ============================================================================
 */
interface ProjectFeedProps {
  title: string;
  fetchFunction: () => Promise<Opportunity[]>;
  emptyMessage: string;
  emptySubMessage?: string;
  onItemClick?: (item: Opportunity) => void;
  // New props for externally controlled data (e.g., from Dashboard state)
  externalData?: Opportunity[];
  externalLoading?: boolean;
  onExternalRefresh?: () => void;
  // Prop to render custom actions on card
  renderActions?: (item: Opportunity) => React.ReactNode;
}

const ProjectFeed: React.FC<ProjectFeedProps> = ({ 
  title, fetchFunction, emptyMessage, emptySubMessage, onItemClick,
  externalData, externalLoading, onExternalRefresh, renderActions
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PROJECT' | 'RESEARCH' | 'OPEN_SOURCE'>('ALL');
  const [internalItems, setInternalItems] = useState<Opportunity[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);

  // Determine if we are using external data or internal state
  const isControlled = externalData !== undefined;
  const items = isControlled ? externalData! : internalItems;
  const loading = isControlled ? (externalLoading || false) : internalLoading;

  const fetchFeed = () => {
    if (isControlled && onExternalRefresh) {
        onExternalRefresh();
    } else if (!isControlled) {
        setInternalLoading(true);
        fetchFunction()
            .then(data => setInternalItems(data))
            .catch(err => console.error(err))
            .finally(() => setInternalLoading(false));
    }
  };

  useEffect(() => {
    if (!isControlled) {
        fetchFeed();
    }
  }, [fetchFunction, isControlled]);

  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h2 className="text-xl font-display font-bold text-slate-900 hidden sm:block">{title}</h2>
         <div className="flex flex-wrap gap-2">
            {['ALL', 'PROJECT', 'RESEARCH', 'OPEN_SOURCE'].map((f) => (
            <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all border ${
                filter === f 
                ? 'bg-converge-blue text-white border-converge-blue shadow-lg shadow-blue-500/20' 
                : 'bg-white text-slate-500 border-gray-200 hover:border-converge-blue/50 hover:text-converge-blue'
                }`}
            >
                {f.replace('_', ' ')}
            </button>
            ))}
            <button onClick={fetchFeed} className="p-2 text-slate-400 hover:text-converge-blue transition-colors rounded-full hover:bg-slate-100" title="Refresh">
              <Layers className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-converge-blue" /></div>
        ) : filteredItems.length === 0 ? (
           <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <p className="mb-2 font-medium">{emptyMessage}</p>
               {emptySubMessage && <p className="text-xs">{emptySubMessage}</p>}
           </div>
        ) : (
          filteredItems.map(item => (
            <div 
                key={item.id} 
                onClick={() => onItemClick && onItemClick(item)}
                className={`bg-white border border-gray-100 p-6 rounded-xl hover:shadow-md transition-all group relative overflow-hidden ${onItemClick ? 'cursor-pointer hover:border-converge-blue/50' : ''}`}
            >
               <div className={`absolute top-0 left-0 w-1 h-full ${
                 item.type === 'PROJECT' ? 'bg-converge-blue' : 
                 item.type === 'RESEARCH' ? 'bg-converge-violet' : 'bg-converge-emerald'
               }`}></div>
               
               {/* STATUS BADGE - COMPLETED */}
               {item.status === 'COMPLETED' && (
                 <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> COMPLETED
                 </div>
               )}

               <div className="flex justify-between items-start mb-3 pl-3">
                 <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border mb-2 inline-block ${
                      item.type === 'PROJECT' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                      item.type === 'RESEARCH' ? 'text-violet-600 bg-violet-50 border-violet-100' :
                      'text-emerald-600 bg-emerald-50 border-emerald-100'
                    }`}>
                      {item.type} {item.subType ? `• ${item.subType}` : ''}
                    </span>
                    <h3 className="text-lg font-display font-bold text-slate-900 group-hover:text-converge-blue transition-colors">{item.title}</h3>
                 </div>
                 <span className="text-xs text-slate-400 font-mono">{item.date}</span>
               </div>

               <p className="text-slate-600 text-sm mb-4 leading-relaxed pl-3 max-w-3xl whitespace-pre-line line-clamp-3">{item.description}</p>

               <div className="flex flex-wrap gap-2 mb-4 pl-3">
                 {Array.isArray(item.technologies) && item.technologies.map((tech, idx) => (
                   <span key={`${tech}-${idx}`} className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                     {tech}
                   </span>
                 ))}
               </div>

               <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2 pl-3">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-700 overflow-hidden">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] text-slate-600">
                        {item.postedBy.substring(0,1).toUpperCase()}
                    </div>
                    <span className="truncate" title={item.postedBy}>{item.postedBy}</span>
                 </div>
                 
                 <div className="flex gap-3 shrink-0 items-center">
                    {renderActions && renderActions(item)}
                    
                    {item.githubUrl && (
                      <a href={item.githubUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-black transition-colors flex items-center gap-1 text-xs font-semibold">
                        <Github className="w-4 h-4" /> Code
                      </a>
                    )}
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * COMPONENT: TEAMMATE RATING VIEW
 * Allows the owner to rate a specific teammate.
 * ============================================================================
 */
interface RatingViewProps {
    teammate: Teammate;
    projectId: string | number;
    raterId: string | number;
    onClose: () => void;
}

const RatingView: React.FC<RatingViewProps> = ({ teammate, projectId, raterId, onClose }) => {
    // Stores 8 specific scores for the 8 questions
    const [rawScores, setRawScores] = useState<Record<string, number>>({
        q1: 2.5, q2: 2.5, q3: 2.5, q4: 2.5, 
        q5: 2.5, q6: 2.5, q7: 2.5, q8: 2.5
    });
    const [submitting, setSubmitting] = useState(false);

    const questions = [
        { id: 'q1', text: 'This teammate made meaningful technical contributions to the project.' },
        { id: 'q2', text: 'The quality of this teammate’s work met or exceeded project expectations.' },
        { id: 'q3', text: 'This teammate consistently met deadlines and commitments.' },
        { id: 'q4', text: 'This teammate followed through on assigned responsibilities without repeated reminders.' },
        { id: 'q5', text: 'This teammate communicated clearly and responded in a timely manner.' },
        { id: 'q6', text: 'This teammate was respectful, cooperative, and supportive of the team.' },
        { id: 'q7', text: 'This teammate took initiative beyond their assigned tasks when needed.' },
        { id: 'q8', text: 'I would be happy to collaborate with this teammate again on a future project.' },
    ];

    const handleSubmit = async () => {
        // Robust ID check: try 'id', 'resumeId' (common mismatch in integration)
        let rateeId = teammate.id;
        
        if (rateeId === undefined || rateeId === null) rateeId = (teammate as any).resumeId;
        if (rateeId === undefined || rateeId === null) rateeId = (teammate as any).resume_id;
        if (rateeId === undefined || rateeId === null) rateeId = (teammate as any).userId;
        if (rateeId === undefined || rateeId === null) rateeId = (teammate as any).user_id;

        // Fallback for missing Rater ID from localStorage
        const finalRaterId = raterId || localStorage.getItem('userId');

        // Strict Check: Ensure both IDs exist
        if ((rateeId === undefined || rateeId === null) || !finalRaterId) {
             console.error("Missing IDs for Rating:", { rateeId, finalRaterId, teammate });
             alert("Error: Missing critical IDs for rating submission.");
             return;
        }

        setSubmitting(true);
        try {
            // Map the 8 questions to the 5 backend categories
            const categoryScores = {
                technical: (rawScores.q1 + rawScores.q2) / 2,     // Q1 + Q2
                reliability: (rawScores.q3 + rawScores.q4) / 2,   // Q3 + Q4
                communication: (rawScores.q5 + rawScores.q6) / 2, // Q5 + Q6
                initiative: rawScores.q7,                         // Q7
                overall: rawScores.q8                             // Q8
            };

            const payload: RatingSubmission = {
                rater_id: Number(finalRaterId),
                ratee_id: Number(rateeId),
                project_id: Number(projectId),
                category_scores: categoryScores
            };
            
            await submitTeammateRating(payload);
            
            const displayIdentifier = teammate.email || "Teammate";
            alert(`Rating submitted for ${displayIdentifier}!`);
            
            onClose();
        } catch (e) {
            alert("Failed to submit rating. Please try again.");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleScoreChange = (key: string, value: string) => {
        setRawScores(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-slate-900">Rate Teammate Performance</h2>
                    <p className="text-sm text-slate-500 mt-1">Providing feedback for <span className="font-semibold text-slate-800">{teammate.fullName || (teammate as any).name || "Unknown Member"}</span></p>
                </div>
                
                <div className="p-6 space-y-6">
                    {questions.map((q, idx) => (
                        <div key={q.id}>
                            <div className="flex justify-between items-start mb-2 gap-4">
                                <label className="text-sm font-medium text-slate-800 leading-snug">
                                    <span className="font-bold text-slate-400 mr-2">{idx + 1}.</span>
                                    {q.text}
                                </label>
                                <span className="text-xs font-mono font-bold text-converge-blue bg-blue-50 px-2 py-0.5 rounded shrink-0">
                                    {rawScores[q.id]} / 5
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="5" 
                                step="0.5"
                                value={rawScores[q.id]}
                                onChange={(e) => handleScoreChange(q.id, e.target.value)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-converge-blue"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono uppercase">
                                <span>Strongly Disagree (0)</span>
                                <span>Strongly Agree (5)</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-white font-medium text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-converge-blue text-white rounded-lg hover:bg-blue-600 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit Evaluation
                    </button>
                </div>
            </div>
        </div>
    );
};


/**
 * ============================================================================
 * COMPONENT: TEAMMATE DETAIL VIEW
 * Displays full profile details of a selected candidate.
 * Fetches data via getUserProfileById(id)
 * ============================================================================
 */
interface TeammateDetailViewProps {
    userId: string | number;
    onBack: () => void;
}

const TeammateDetailView: React.FC<TeammateDetailViewProps> = ({ userId, onBack }) => {
    const [profile, setProfile] = useState<ParsedProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        // Fetch detailed profile using ID
        getUserProfileById(userId)
            .then(data => setProfile(data))
            .catch(err => {
                console.error(err);
                setError("Failed to load candidate profile.");
            })
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-converge-blue mb-4" />
                <p className="text-slate-500 font-mono text-sm">Retrieving Dossier...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>{error || "Profile not found."}</p>
                <button onClick={onBack} className="mt-4 text-sm font-bold text-red-700 underline">Back to List</button>
            </div>
        );
    }

    // PDF/Resume Helper
    const getPdfSrc = () => {
        if (profile.resumePdf) {
            if (profile.resumePdf.startsWith('data:application/pdf')) {
                return profile.resumePdf;
            }
            return `data:application/pdf;base64,${profile.resumePdf}`;
        }
        return null;
    };

    // Data normalizers based on backend response keys
    const displayName = profile.fullName || profile.name || "Unknown Candidate";
    const displayResume = profile.resumeText || profile.Resume;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-[calc(100vh-140px)] flex flex-col">
            <button 
                onClick={onBack}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-converge-blue transition-colors mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Matches
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Left Column: Profile Details */}
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-y-auto custom-scrollbar p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
                            {displayName.substring(0,1)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                            <p className="text-sm text-slate-500">{profile.institution || "Institution N/A"}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Contact</p>
                                <p className="text-sm text-slate-700 break-all">{profile.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Department</p>
                                <p className="text-sm text-slate-700">{profile.department}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Year</p>
                                <p className="text-sm text-slate-700">{profile.year}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Status</p>
                                <p className="text-sm text-slate-700">{profile.availability || "Unknown"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: PDF Resume Viewer (if available) or extracted text */}
                <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden relative">
                    <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center text-slate-400">
                        <span className="text-xs font-mono flex items-center gap-2">
                            <FileText className="w-4 h-4" /> RESUME_VIEWER
                        </span>
                        {getPdfSrc() && (
                            <a href={getPdfSrc()!} download="resume.pdf" className="text-xs hover:text-white flex items-center gap-1 transition-colors">
                                <Download className="w-3 h-3" /> Download
                            </a>
                        )}
                    </div>
                    
                    <div className="flex-1 bg-slate-900/50 relative overflow-auto custom-scrollbar">
                        {getPdfSrc() ? (
                            <iframe 
                                src={getPdfSrc()!} 
                                className="w-full h-full border-none"
                                title="Resume PDF"
                            />
                        ) : displayResume ? (
                            <div className="p-8 text-slate-300 font-mono text-sm whitespace-pre-wrap">
                                {typeof displayResume === 'object' ? JSON.stringify(displayResume, null, 2) : displayResume}
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <FileText className="w-16 h-16 mb-4 opacity-20" />
                                <p>No PDF or Text Resume available for this user.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * ============================================================================
 * COMPONENT: MATCH RESULTS VIEW
 * Displays list of AI-matched candidates.
 * ============================================================================
 */
interface MatchResultsViewProps {
    matchData: MLMatchResponse;
    onSelectCandidate: (id: number) => void;
    onAddTeammate: (id: number) => void;
    sentRequests: Set<number>;
}

const MatchResultsView: React.FC<MatchResultsViewProps> = ({ matchData, onSelectCandidate, onAddTeammate, sentRequests }) => {
    return (
        <div className="grid grid-cols-1 gap-4">
            {matchData.matches.map((match) => (
                <div key={match.resume_id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                         <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                            {match.profile.name ? match.profile.name.substring(0, 1) : '?'}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-slate-900">{match.profile.name || "Anonymous Candidate"}</h4>
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    {Math.round(match.final_score * 100)}% Match
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mb-1">{match.profile.year} • {match.profile.availability}</p>
                            <div className="flex gap-2">
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Skills: {Math.round(match.layer1_capability.s_skills * 100)}%</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Exp: {Math.round(match.layer1_capability.s_experience * 100)}%</span>
                            </div>
                         </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <button 
                            onClick={() => onSelectCandidate(match.resume_id)}
                            className="flex-1 md:flex-none px-4 py-2 border border-gray-300 text-slate-700 font-medium rounded-lg hover:bg-gray-50 text-sm"
                        >
                            View Profile
                        </button>
                        <button 
                            onClick={() => onAddTeammate(match.resume_id)}
                            disabled={sentRequests.has(match.resume_id)}
                            className={`flex-1 md:flex-none px-4 py-2 font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                                sentRequests.has(match.resume_id) 
                                ? 'bg-green-100 text-green-700 cursor-default border border-green-200' 
                                : 'bg-converge-blue text-white hover:bg-blue-600 shadow-sm'
                            }`}
                        >
                            {sentRequests.has(match.resume_id) ? (
                                <>
                                    <Check className="w-4 h-4" /> Invited
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" /> Invite
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * ============================================================================
 * TAB: UPLOAD RESUME
 * ============================================================================
 */
export const UploadResumeTab: React.FC = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    useEffect(() => {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
            return;
        }

        setUploading(true);
        setProgress(0);
        setStatusText("Initializing file stream...");
        
        // Progress Simulation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 5;
            });
        }, 500);

        try {
            // 2. Extract Text using PDF.js
            setStatusText("Extracting semantic text layers...");
            let fullText = '';
            
            if (window.pdfjsLib) {
                 const arrayBuffer = await file.arrayBuffer();
                 const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
                 const pdf = await loadingTask.promise;
                 
                 for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                 }
            } else {
                console.warn("PDF.js not loaded, skipping text extraction.");
            }

            // 3. Upload to Backend (Text Only)
            setStatusText("Transmitting text payload...");
            await uploadUserResume(fullText);
            
            setProgress(100);
            setStatusText("Update Complete");
            alert("Resume updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload resume. Please try again.");
            setStatusText("Upload Failed");
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => {
                setUploading(false);
                setProgress(0);
                setStatusText("");
            }, 1000);
        }
    };

    return (
        <div className="w-full">
            <div className="text-left mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-converge-blue" />
                    Update Resume
                </h2>
                <p className="text-sm text-slate-500">Refresh your neural embeddings by uploading a new resume.</p>
            </div>
            
            <div className={`bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center group transition-all relative overflow-hidden ${!uploading ? 'hover:bg-slate-100 hover:border-converge-blue' : ''}`}>
                
                {uploading ? (
                    <div className="w-full max-w-sm z-10 py-4">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            <span>Processing</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                             <div 
                                className="h-full bg-gradient-to-r from-converge-blue to-converge-violet transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                             ></div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-converge-blue animate-pulse">
                             <Terminal className="w-3 h-3" />
                             <span className="text-xs font-mono">{statusText}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-converge-blue" />
                        </div>
                        <h3 className="text-base font-bold text-slate-700 mb-1">
                            Upload PDF Resume
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                            Drag and drop, or click to browse. Max 5MB.
                        </p>
                    </>
                )}
                
                <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {!uploading && (
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors pointer-events-none">
                        Select File
                    </button>
                )}
            </div>
            
            <div className="mt-4 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-snug">
                    <span className="font-bold">Note:</span> Resume updates trigger the Gemini extraction engine. It may take a moment for new skills to reflect in matching.
                </p>
            </div>
        </div>
    );
}

/**
 * ============================================================================
 * TAB: POST OPPORTUNITY
 * ============================================================================
 */
export const PostOpportunityTab: React.FC = () => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        skills: '',
        preferredTech: '',
        domains: '',
        type: 'PROJECT',
        github: '',
        isPublic: true
    });
    const [loading, setLoading] = useState(false);
    const [resultProject, setResultProject] = useState<any>(null); // Stores created project
    const [matches, setMatches] = useState<MLMatchResponse | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const project = await createProject(form);
            setResultProject(project);
            
            // Immediately fetch matches
            try {
                const matchData = await getTeammateMatches(project.id);
                setMatches(matchData);
            } catch (err) {
                console.warn("Could not fetch initial matches", err);
            }

        } catch (e) {
            console.error(e);
            alert("Failed to create project.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeammate = async (candidateId: number) => {
        if (!resultProject) return;
        try {
            const profile = await getUserProfileById(candidateId);
            if (profile && profile.email) {
                await addTeammate(resultProject.id, profile.email);
                setSentRequests(prev => new Set(prev).add(candidateId));
                alert(`Invite sent to ${profile.fullName || 'Candidate'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to send invite");
        }
    };

    if (selectedCandidate) {
        return <TeammateDetailView userId={selectedCandidate} onBack={() => setSelectedCandidate(null)} />;
    }

    if (resultProject) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" /> Project Initialized
                        </h2>
                        <p className="text-emerald-700 mt-1">Your project "{resultProject.title}" is now active on the network.</p>
                    </div>
                    <button 
                        onClick={() => { setResultProject(null); setForm({ ...form, title: '', description: '' }); }}
                        className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100"
                    >
                        Create Another
                    </button>
                </div>

                {matches ? (
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">AI Recommended Teammates</h3>
                        <MatchResultsView 
                            matchData={matches} 
                            onSelectCandidate={setSelectedCandidate}
                            onAddTeammate={handleAddTeammate}
                            sentRequests={sentRequests}
                        />
                    </div>
                ) : (
                    <div className="flex justify-center p-12">
                         <Loader2 className="w-8 h-8 animate-spin text-converge-blue" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Post Opportunity</h2>
                <p className="text-slate-500">Define your project parameters to broadcast to the network.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                
                {/* TITLE */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Project Title</label>
                    <input 
                        type="text" 
                        required
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-converge-blue transition-colors"
                        placeholder="e.g. Autonomous Drone Navigation"
                    />
                </div>

                {/* TYPE & DOMAINS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                        <div className="relative">
                            <select 
                                value={form.type}
                                onChange={e => setForm({...form, type: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-converge-blue appearance-none"
                            >
                                <option value="PROJECT">Project</option>
                                <option value="RESEARCH">Research Paper</option>
                                <option value="OPEN_SOURCE">Open Source</option>
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Domains</label>
                         <input 
                            type="text" 
                            value={form.domains}
                            onChange={e => setForm({...form, domains: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-converge-blue"
                            placeholder="e.g. AI, IoT, FinTech"
                        />
                    </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                    <textarea 
                        required
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        rows={5}
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-converge-blue resize-none"
                        placeholder="Describe the problem, solution, and goals..."
                    />
                </div>

                {/* SKILLS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Required Skills (Comma separated)</label>
                         <input 
                            type="text" 
                            required
                            value={form.skills}
                            onChange={e => setForm({...form, skills: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-converge-blue"
                            placeholder="e.g. Python, React, TensorFlow"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Tech</label>
                         <input 
                            type="text" 
                            value={form.preferredTech}
                            onChange={e => setForm({...form, preferredTech: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-converge-blue"
                            placeholder="e.g. AWS, Docker"
                        />
                    </div>
                </div>

                {/* GITHUB & VISIBILITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">GitHub Repository (Optional)</label>
                         <div className="relative">
                            <Github className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="url" 
                                value={form.github}
                                onChange={e => setForm({...form, github: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:border-converge-blue"
                                placeholder="https://github.com/..."
                            />
                         </div>
                    </div>
                    <div className="flex items-center pt-8">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.isPublic ? 'bg-converge-blue' : 'bg-gray-300'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${form.isPublic ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <input type="checkbox" className="hidden" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} />
                            <span className="text-sm font-bold text-slate-700">Public Visibility</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Broadcast Opportunity
                    </button>
                </div>

            </form>
        </div>
    );
}

/**
 * ============================================================================
 * TAB: GLOBAL EXPLORE
 * ============================================================================
 */
export const ExploreTab: React.FC = () => {
  return (
    <ProjectFeed 
      title="Global Explore" 
      fetchFunction={getExploreProjects}
      emptyMessage="The network is quiet."
      emptySubMessage="Be the first to post a new opportunity."
    />
  );
};

/**
 * ============================================================================
 * TAB: INBOX (TEAMMATE REQUESTS)
 * ============================================================================
 */
interface TeammateRequestsTabProps {
    onProjectUpdate: () => void;
}

export const TeammateRequestsTab: React.FC<TeammateRequestsTabProps> = ({ onProjectUpdate }) => {
    const [requests, setRequests] = useState<TeammateRequest[]>([]);
    const [loading, setLoading] = useState(true);
    // NEW: State for Handling Ratings within Inbox
    const [ratingRequest, setRatingRequest] = useState<{
        teammate: Teammate;
        projectId: string | number;
    } | null>(null);

    const fetchRequests = () => {
        setLoading(true);
        getTeammateRequests()
            .then(setRequests)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAccept = async (requestId: number) => {
        try {
            await acceptTeammateRequest(requestId);
            fetchRequests(); // Refresh list
            onProjectUpdate(); // Update global projects state
            alert("Welcome to the team!");
        } catch (e) {
            console.error(e);
            alert("Failed to accept request.");
        }
    };
    
    // Handler to open rating modal from Inbox item
    const openRatingModal = (req: TeammateRequest) => {
        if (!req.rateeId || !req.projectId) {
            alert("Error: Missing rating data.");
            return;
        }
        
        setRatingRequest({
            teammate: {
                id: req.rateeId,
                fullName: req.rateeName || "Teammate",
                email: "Hidden" // Email might not be in request, not strictly needed for rating
            },
            projectId: req.projectId
        });
    };

    if (ratingRequest) {
        return (
            <RatingView 
                teammate={ratingRequest.teammate}
                projectId={ratingRequest.projectId}
                raterId={localStorage.getItem('userId') || ''}
                onClose={() => { setRatingRequest(null); fetchRequests(); }}
            />
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-slate-900">Inbox</h2>
                <button onClick={fetchRequests} className="p-2 text-slate-400 hover:text-converge-blue transition-colors">
                    <Inbox className="w-5 h-5" />
                </button>
            </div>
            
            {loading ? (
                 <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-converge-blue" /></div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                    <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No pending requests.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => {
                        // RENDER LOGIC: Distinguish between Join Requests and Rating Requests
                        const isRatingRequest = req.type === 'RATING_REQUEST';
                        
                        return (
                        <div key={req.requestId} className={`bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRatingRequest ? 'border-l-4 border-l-converge-violet' : ''}`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                        isRatingRequest 
                                        ? 'text-violet-600 bg-violet-50 border-violet-100'
                                        : 'text-converge-blue bg-blue-50 border-blue-100'
                                    }`}>
                                        {isRatingRequest ? 'RATE TEAMMATE' : 'INVITE'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">{new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg">Project: {req.projectTitle}</h3>
                                
                                {isRatingRequest ? (
                                    <p className="text-slate-600 text-sm">Please evaluate the performance of <span className="font-semibold text-slate-800">{req.rateeName || 'your teammate'}</span>.</p>
                                ) : (
                                    <p className="text-slate-600 text-sm">Invited by <span className="font-semibold text-slate-800">{req.requesterEmail}</span></p>
                                )}
                            </div>
                            
                            <div className="flex gap-3 w-full md:w-auto">
                                {!isRatingRequest && (
                                    <button className="flex-1 md:flex-none px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm">
                                        Decline
                                    </button>
                                )}
                                
                                {isRatingRequest ? (
                                    <button 
                                        onClick={() => openRatingModal(req)}
                                        className="flex-1 md:flex-none px-6 py-2 bg-converge-violet text-white font-bold rounded-lg hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20 text-sm flex items-center justify-center gap-2"
                                    >
                                        <Star className="w-4 h-4" /> Rate Now
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleAccept(req.requestId)}
                                        className="flex-1 md:flex-none px-6 py-2 bg-converge-blue text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Accept
                                    </button>
                                )}
                            </div>
                        </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

/**
 * ============================================================================
 * TAB: MY PROJECTS (WITH DETAILS)
 * ============================================================================
 */
interface MyProjectsTabProps {
    projects: Opportunity[];
    loading: boolean;
    onRefresh: () => void;
    currentUser: ParsedProfile | null;
}

export const MyProjectsTab: React.FC<MyProjectsTabProps> = ({ projects, loading, onRefresh, currentUser }) => {
    const [selectedProject, setSelectedProject] = useState<Opportunity | null>(null);
    const [viewingTeammate, setViewingTeammate] = useState<Teammate | null>(null);
    
    // Refresh details when selectedProject is active, to get updated teammates
    const refreshSelected = async () => {
        if(selectedProject) {
            try {
                const updated = await getProjectDetails(selectedProject.id);
                setSelectedProject(updated);
            } catch(e) { console.error(e); }
        }
    }

    const handleComplete = async (projectId: string) => {
        if(window.confirm("Are you sure? This will mark the project as completed and send rating requests to all teammates.")) {
            try {
                await completeProject(projectId);
                onRefresh(); // Refresh list to get updated status
                // Force a refresh of the selected project to update UI state immediately
                const updated = await getProjectDetails(projectId);
                setSelectedProject(updated);
                alert("Project marked as Completed. Notification sent to Inbox to rate teammates.");
            } catch(e) { alert("Error completing project"); }
        }
    }

    // REMOVED INLINE RATING LOGIC HERE to strictly follow "Project owner should also rate after clicking the notification in his/her inbox"

    if (selectedProject) {
        const isOwner = currentUser && selectedProject.ownerEmail === currentUser.email;
        const isCompleted = selectedProject.status === 'COMPLETED';
        
        return (
            <div className="animate-in fade-in slide-in-from-right-8">
                 <button onClick={() => setSelectedProject(null)} className="flex items-center text-sm font-medium text-slate-500 hover:text-converge-blue transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                </button>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 relative">
                    {/* Badge for Completed Status inside Detail View */}
                    {isCompleted && (
                        <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 absolute top-0 right-0 rounded-bl-xl z-20 flex items-center gap-2">
                             <BadgeCheck className="w-4 h-4" /> COMPLETED
                        </div>
                    )}

                    <div className="p-8 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{selectedProject.title}</h1>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">{selectedProject.type}</span>
                                    <span className="text-xs text-slate-400 font-mono">Created {selectedProject.date}</span>
                                </div>
                            </div>
                            {isOwner && (
                                <button 
                                    onClick={() => !isCompleted && handleComplete(selectedProject.id)}
                                    disabled={isCompleted}
                                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 ${
                                        isCompleted 
                                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                        : 'bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <> <BadgeCheck className="w-4 h-4" /> Project Completed </>
                                    ) : (
                                        <> <CheckCircle className="w-4 h-4" /> Mark Complete </>
                                    )}
                                </button>
                            )}
                        </div>
                        <p className="text-slate-600 leading-relaxed max-w-4xl">{selectedProject.description}</p>
                    </div>
                    
                    <div className="bg-slate-50 p-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-converge-blue" /> Team Roster
                        </h3>
                        
                        <div className="space-y-3">
                            {selectedProject.teammates && selectedProject.teammates.length > 0 ? (
                                selectedProject.teammates.map((member: Teammate, idx: number) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-converge-blue to-converge-violet text-white flex items-center justify-center font-bold">
                                                {member.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{member.fullName}</p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                        {/* REMOVED: Direct Rating Button. Users must check Inbox after completion. */}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">No teammates have joined yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ProjectFeed 
            title="My Projects"
            externalData={projects}
            externalLoading={loading}
            onExternalRefresh={onRefresh}
            fetchFunction={async () => []} // Dummy
            emptyMessage="You haven't created any projects."
            emptySubMessage="Use the 'Post Opportunity' tab to get started."
            onItemClick={setSelectedProject}
        />
    );
};

/**
 * ============================================================================
 * TAB 5: HALL OF FAME TAB (PLACEHOLDER)
 * ============================================================================
 */
export const HallOfFameTab: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[500px] text-center p-8 bg-gradient-to-b from-amber-50 to-white rounded-xl border border-amber-100">
       <div className="p-4 bg-amber-100 rounded-full mb-6">
          <Trophy className="w-12 h-12 text-amber-600" />
       </div>
       <h2 className="text-3xl font-display font-bold text-amber-900 mb-2">Hall of Fame</h2>
       <p className="text-amber-700/60 max-w-md">Recognizing top contributors and groundbreaking research from the campus network.</p>
       <div className="mt-8 px-4 py-2 bg-white rounded-full border border-amber-200 text-xs font-bold text-amber-600 uppercase tracking-widest">
          Under Construction
       </div>
    </div>
  );
};