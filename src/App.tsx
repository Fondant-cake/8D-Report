import React, { useState, useEffect } from "react";
import { Report8D, WhyItem, DefectInput } from "./types";
import InputForm from "./components/InputForm";
import WhyInterview from "./components/WhyInterview";
import ReportViewer from "./components/ReportViewer";
import WhyVisualization from "./components/WhyVisualization";
import refreshingBg from "./assets/images/refreshing_sparkling_background_1783407861896.jpg";
import { 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  HelpCircle, 
  FileText, 
  Database,
  Award,
  ChevronRight,
  TrendingDown,
  Printer,
  Lock,
  Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY_SESSION = "QC_8D_ANALYZE_SESSION";

const LANDING_TEMPLATES = [
  {
    name: "PCB 솔더 조인트 크랙 (전형적 예시)",
    defect: "PCB 기판 솔더 조인트 크랙 발생",
    process: "Reflow 공정",
    defectRate: "2.5%",
    containmentAction: "해당 로트 전량 격리조치 및 수동 X-Ray 전수 검사 진행",
    badge: "Solder Crack",
    difficulty: "보통"
  },
  {
    name: "정밀 사출 성형 치수 미달",
    defect: "스마트폰 하우징 측면 두께 치수 공차 오버 (사출 치수 미달)",
    process: "사출 성형 공정",
    defectRate: "1.8%",
    containmentAction: "사출 금형 1호기 가동 정지, 최근 24시간 생산 제품 전량 보류 및 마이크로미터 전수 검사",
    badge: "Injection Mold",
    difficulty: "보통"
  },
  {
    name: "모터 구동 이음 발생",
    defect: "구동 모터 회전 시 고주파 마찰 소음(이음) 발생",
    process: "최종 조립 공정 (EOL 검사)",
    defectRate: "3.2%",
    containmentAction: "EOL 불량 모터 전량 분해 대기 격리, 소음 분석기 장착 검사 강화",
    badge: "Motor Noise",
    difficulty: "어려움"
  }
];

export default function App() {
  const [defectInput, setDefectInput] = useState<DefectInput | null>(null);
  const [report, setReport] = useState<Report8D | null>(null);
  const [currentWhyIndex, setCurrentWhyIndex] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [whyHistory, setWhyHistory] = useState<WhyItem[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [rootCause, setRootCause] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  // Landing View state control
  const [showLanding, setShowLanding] = useState<boolean>(true);

  // Gemini API Key state management
  const [userApiKey, setUserApiKey] = useState<string>(() => localStorage.getItem("GEMINI_USER_API_KEY") || "");
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem("GEMINI_USER_API_KEY") || "");
  const [keyVerifyStatus, setKeyVerifyStatus] = useState<"idle" | "verifying" | "success" | "error">(
    () => localStorage.getItem("GEMINI_USER_API_KEY") ? "success" : "idle"
  );
  const [keyVerifyMessage, setKeyVerifyMessage] = useState<string>(
    () => localStorage.getItem("GEMINI_USER_API_KEY") ? "인증 및 등록 완료된 API Key가 존재합니다." : ""
  );

  // Helper to ensure Gemini API key is verified before accessing functional features
  const ensureKeyOrScroll = (): boolean => {
    if (keyVerifyStatus !== "success" || !userApiKey) {
      setErrorMsg("시스템 보안 잠금: 모든 분석 기능을 사용하려면 먼저 Gemini API Key를 등록 및 승인해 주세요.");
      setShowLanding(true);
      setTimeout(() => {
        const el = document.getElementById("gemini-api-key-panel");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-amber-500/40", "scale-[1.02]");
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-amber-500/40", "scale-[1.02]");
          }, 2000);
        }
      }, 100);
      return false;
    }
    return true;
  };

  // Force show landing page if API key is not verified
  useEffect(() => {
    if (keyVerifyStatus !== "success" || !userApiKey) {
      setShowLanding(true);
    }
  }, [keyVerifyStatus, userApiKey]);

  // Helper to fetch correct request headers
  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const savedKey = localStorage.getItem("GEMINI_USER_API_KEY") || "";
    if (savedKey) {
      headers["x-gemini-api-key"] = savedKey;
    }
    return headers;
  };

  const handleVerifyAndSaveKey = async (key: string) => {
    if (!key.trim()) {
      setKeyVerifyStatus("error");
      setKeyVerifyMessage("API Key를 입력해 주세요.");
      return;
    }
    setKeyVerifyStatus("verifying");
    setKeyVerifyMessage("인증 요청 중...");
    try {
      const res = await fetch("/api/verify-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": key,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "인증 실패");
      }
      localStorage.setItem("GEMINI_USER_API_KEY", key);
      setUserApiKey(key);
      setKeyVerifyStatus("success");
      setKeyVerifyMessage("API Key 인증 성공! 워크스페이스에서 이 키가 사용됩니다.");
    } catch (err: any) {
      setKeyVerifyStatus("error");
      setKeyVerifyMessage(err.message || "유효하지 않은 API Key이거나 오류가 발생했습니다.");
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("GEMINI_USER_API_KEY");
    setUserApiKey("");
    setApiKeyInput("");
    setKeyVerifyStatus("idle");
    setKeyVerifyMessage("");
  };

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) {
        const data = JSON.parse(saved);
        setDefectInput(data.defectInput);
        setReport(data.report);
        setCurrentWhyIndex(data.currentWhyIndex);
        setCurrentQuestion(data.currentQuestion);
        setWhyHistory(data.whyHistory || []);
        setIsCompleted(data.isCompleted);
        setRootCause(data.rootCause || "");
        
        // Skip landing only if there's an ongoing session AND key is verified
        if (localStorage.getItem("GEMINI_USER_API_KEY")) {
          setShowLanding(false);
        } else {
          setShowLanding(true);
        }
      }
    } catch (e) {
      console.error("Failed to restore 8D session", e);
    }
  }, []);

  // Save session to localStorage when states change
  useEffect(() => {
    if (defectInput) {
      const sessionData = {
        defectInput,
        report,
        currentWhyIndex,
        currentQuestion,
        whyHistory,
        isCompleted,
        rootCause,
      };
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionData));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }, [defectInput, report, currentWhyIndex, currentQuestion, whyHistory, isCompleted, rootCause]);

  // Handle Initial Submission
  const handleInitialSubmit = async (input: DefectInput) => {
    setIsLoading(true);
    setErrorMsg("");
    setDefectInput(input);
    setShowLanding(false); // Transition to dashboard

    try {
      const response = await fetch("/api/generate-8d", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "8D 초안 생성 중 백엔드 에러가 발생했습니다.");
      }

      const data = await response.json();
      
      const initialReport: Report8D = {
        d0: data.d0,
        d1: data.d1,
        d2: data.d2,
        d3: data.d3,
        d4: data.d4,
        d5: data.d5,
        d6: data.d6,
        d7: data.d7,
        d8: data.d8,
      };

      setReport(initialReport);
      setCurrentWhyIndex(1);
      setCurrentQuestion(data.why1);
      setWhyHistory([]);
      setIsCompleted(false);
      setRootCause("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "서버 통신 실패. 다시 시도해 주세요.");
      setDefectInput(null); // Reset back to input form
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Interview Answers
  const handleAnswerSubmit = async (answerText: string) => {
    if (isLoading || isFinalizing) return;
    setIsLoading(true);
    setErrorMsg("");

    const newHistoryItem: WhyItem = {
      index: currentWhyIndex,
      question: currentQuestion,
      answer: answerText,
    };

    const updatedHistory = [...whyHistory, newHistoryItem];
    setWhyHistory(updatedHistory);

    try {
      const response = await fetch("/api/why-interview", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          defectInput,
          whyHistory: updatedHistory,
          currentWhyIndex,
          nextAnswer: answerText,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "5Why 인터뷰 백엔드 에러가 발생했습니다.");
      }

      const data = await response.json();

      if (data.isCompleted) {
        setIsCompleted(true);
        setRootCause(data.rootCause);
        await handleFinalizeReport(data.rootCause, updatedHistory);
      } else {
        setCurrentWhyIndex((prev) => prev + 1);
        setCurrentQuestion(data.nextQuestion);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "답변 전송 중 에러가 발생했습니다.");
      setWhyHistory(whyHistory);
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize 8D with Root Cause
  const handleFinalizeReport = async (finalRootCause: string, finalHistory: WhyItem[]) => {
    if (!report || !defectInput) return;
    setIsFinalizing(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/finalize-8d", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          initialReport: report,
          rootCause: finalRootCause,
          defectInput,
          whyHistory: finalHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("보고서 최종 다듬기 중 에러가 발생했습니다.");
      }

      const data = await response.json();
      setReport(data.finalizedReport);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("8D 완성 보고서 다듬기 도중 에러가 발생하여, 이전 8D 초안을 기준으로 렌더링합니다.");
    } finally {
      setIsFinalizing(false);
    }
  };

  // Reset Session
  const handleReset = () => {
    if (window.confirm("현재 분석 중인 G8D 세션을 초기화하고 새로 시작하시겠습니까?")) {
      setDefectInput(null);
      setReport(null);
      setCurrentWhyIndex(1);
      setCurrentQuestion("");
      setWhyHistory([]);
      setIsCompleted(false);
      setRootCause("");
      setErrorMsg("");
      localStorage.removeItem(STORAGE_KEY_SESSION);
      setShowLanding(true); // Return to landing for new beginning
    }
  };

  // Apply Quick Template from Landing page
  const handleQuickDemo = (tpl: typeof LANDING_TEMPLATES[0]) => {
    if (!ensureKeyOrScroll()) return;
    const input: DefectInput = {
      defect: tpl.defect,
      process: tpl.process,
      defectRate: tpl.defectRate,
      containmentAction: tpl.containmentAction
    };
    handleInitialSubmit(input);
  };

  // Progress percentage calculation
  const progressPercent = isCompleted ? 100 : Math.round(((currentWhyIndex - 1) / 5) * 100);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col antialiased relative overflow-x-hidden">
      {/* Dynamic Refreshing Ambient Background */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 bg-cover bg-center opacity-[0.06] mix-blend-multiply" 
        style={{ backgroundImage: `url(${refreshingBg})` }}
      />
      <div 
        className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-tr from-[#114037]/5 via-transparent to-[#2e7d72]/5 opacity-30"
      />

      {/* G8D Bento Theme Header */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#114037] rounded flex items-center justify-center shadow-lg shadow-[#114037]/20 font-bold text-xs">
            8D
          </div>
          <h1 className="text-sm md:text-base font-bold tracking-tight uppercase">
            QC Excellence <span className="text-slate-400 font-normal">|</span> G8D Report Master
          </h1>
        </div>
        
        <div className="flex gap-3 md:gap-4 items-center">
          {/* Gemini API Key 승인 배지 */}
          <div 
            onClick={() => {
              setShowLanding(true);
              setTimeout(() => {
                const el = document.getElementById("gemini-api-key-panel");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("ring-4", "ring-emerald-500/30", "scale-[1.02]");
                  setTimeout(() => {
                    el.classList.remove("ring-4", "ring-emerald-500/30", "scale-[1.02]");
                  }, 1500);
                }
              }, 150);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] md:text-xs font-semibold cursor-pointer transition-all ${
              keyVerifyStatus === "success" 
                ? "bg-emerald-950/50 border-emerald-800 text-emerald-400 hover:bg-emerald-900/50 hover:scale-[1.02]" 
                : "bg-amber-950/50 border-amber-800 text-amber-400 hover:bg-amber-900/50 hover:scale-[1.02]"
            }`}
            title={keyVerifyStatus === "success" ? "Gemini API Key 승인 완료" : "Gemini API Key 승인 필요 (클릭 시 승인 영역 이동)"}
          >
            {keyVerifyStatus === "success" ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Gemini API: 승인 완료</span>
                <span className="sm:hidden">API 승인됨</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Gemini API: 승인 필요 🔒</span>
                <span className="sm:hidden">API 미승인 🔒</span>
              </>
            )}
          </div>

          {!showLanding && (
            <span className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase hidden xs:inline">
              분석 상태:{" "}
              <span className={`font-mono ${isCompleted ? "text-[#2e7d72]" : "text-[#2e7d72] animate-pulse"}`}>
                {isCompleted ? "D4 완료" : `D4 진행중 (${progressPercent}%)`}
              </span>
            </span>
          )}
          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2e7d72]"></div>
            <span className="text-xs font-medium text-slate-300">품질 보증 책임자</span>
          </div>
          {!showLanding && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-1.5 rounded border border-slate-700 font-semibold uppercase tracking-wider transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
          {showLanding && defectInput && (
            <button
              onClick={() => {
                if (ensureKeyOrScroll()) {
                  setShowLanding(false);
                }
              }}
              className="flex items-center gap-1.5 text-[10px] bg-[#114037] hover:bg-[#114037]/90 text-white px-3 py-1.5 rounded shadow-sm font-semibold uppercase tracking-wider transition cursor-pointer"
            >
              워크스페이스로 복귀
            </button>
          )}
        </div>
      </header>

      {/* Error Message bar */}
      {errorMsg && (
        <div className="bg-red-50 border-b border-red-200 py-3 px-6 text-xs text-red-700 flex items-center justify-between shrink-0 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-[10px] font-bold uppercase tracking-widest text-red-900 hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Main Core Area */}
      <AnimatePresence mode="wait">
        {showLanding ? (
          /* 고품격 공학 디자인 랜딩 페이지 */
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="flex-1 overflow-y-auto px-4 py-8 md:py-16 md:px-8 max-w-[1200px] w-full mx-auto flex flex-col gap-12 md:gap-16"
          >
            {/* HERO SECTION */}
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#114037]/5 border border-[#114037]/20 text-[#114037] rounded-full text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#2e7d72]" />
                <span>글로벌 제조업 규격 IATF 16949 / ISO 9001 완전 대응</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                제조 품질 불량의 근본을 파헤치는 <br className="hidden md:block"/>
                <span className="bg-gradient-to-r from-[#114037] to-[#2e7d72] bg-clip-text text-transparent">스마트 G8D &amp; 5Why AI 분석 솔루션</span>
              </h1>
              
              <p className="text-base md:text-lg text-slate-800 leading-relaxed max-w-3xl mx-auto font-bold">
                공정 트러블슈팅과 고객 대응 보고서 편제 시간을 80% 단축하세요. AI 기반의 크로스펑셔널(CFT) 협업 시뮬레이터로 D0에서 D8까지 실시간으로 보고서를 구축하고 체계적인 5Why 인터뷰를 통해 완벽한 근본 원인을 확정합니다.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    if (ensureKeyOrScroll()) {
                      setShowLanding(false);
                    }
                  }}
                  className={`w-full sm:w-auto px-8 py-4 text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group ${
                    keyVerifyStatus === "success" 
                      ? "bg-[#114037] hover:bg-[#114037]/90 shadow-[#114037]/10" 
                      : "bg-slate-700 hover:bg-slate-800 shadow-slate-900/10"
                  }`}
                >
                  <span>G8D 분석 수동 입력 개시</span>
                  {keyVerifyStatus === "success" ? (
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-450" />
                  )}
                </button>
                {defectInput && (
                  <button
                    onClick={() => {
                      if (ensureKeyOrScroll()) {
                        setShowLanding(false);
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>진행 중인 분석 이어하기</span>
                    {keyVerifyStatus === "success" ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-500" />
                    )}
                  </button>
                )}
              </div>

              {keyVerifyStatus !== "success" && (
                <div 
                  onClick={() => ensureKeyOrScroll()} 
                  className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200/80 px-4 py-2.5 rounded-lg font-medium cursor-pointer hover:bg-amber-100/50 hover:underline transition mx-auto"
                >
                  <Lock className="w-3.5 h-3.5 animate-pulse" />
                  <span>시스템 잠금 모드: 모든 분석 기능을 활성화하려면 아래에서 Gemini API Key를 등록 및 승인해 주십시오.</span>
                </div>
              )}
            </div>

            {/* STUNNING HERO BRAND BANNER */}
            <div className="relative w-full h-[220px] md:h-[320px] rounded-3xl overflow-hidden shadow-lg border-2 border-[#114037]/20 flex items-end">
              <img 
                src={refreshingBg} 
                alt="Refreshing Sparkling QC Background" 
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
              <div className="relative p-6 md:p-8 text-left w-full space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Refreshing Quality Solution
                </div>
                <h3 className="text-lg md:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  맑고 투명하게 추적하는 공학적 근본 원인 분석
                </h3>
                <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl font-medium drop-shadow-xs">
                  탄산수처럼 청량하고 속이 뚫리는 투명한 5Why 인과 관계 추적으로 복잡하고 가려져 있던 공정 불량 원인을 단번에 해결합니다.
                </p>
              </div>
            </div>

            {/* GEMINI API KEY CONFIGURATION PANEL */}
            <div id="gemini-api-key-panel" className="max-w-2xl mx-auto w-full bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-md space-y-4 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#114037]/10 text-[#114037] rounded-xl flex items-center justify-center border border-[#114037]/30">
                  <Sparkles className="w-5 h-5 text-[#2e7d72]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Gemini API Key 승인 및 등록 (필수 인증 단계)</h3>
                  <p className="text-xs text-slate-800 font-bold mt-1">
                    본 시스템은 고성능 실시간 인공지능 분석 모델을 다중 구동합니다. 서비스를 사용하시려면 반드시 본인의 API Key를 입력하여 시스템 승인을 획득해 주세요.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    placeholder="AI Studio에서 발급받은 GEMINI_API_KEY 입력 (AIzaSy...)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    disabled={keyVerifyStatus === "verifying"}
                    className="flex-1 px-4 py-2.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-[#114037] focus:ring-1 focus:ring-[#114037] bg-white text-slate-950 font-bold placeholder-slate-500 disabled:opacity-50 shadow-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyAndSaveKey(apiKeyInput)}
                      disabled={keyVerifyStatus === "verifying"}
                      className="px-4 py-2.5 bg-[#114037] hover:bg-[#114037]/90 text-white rounded-lg text-xs font-bold cursor-pointer transition disabled:opacity-50 whitespace-nowrap shadow-sm"
                    >
                      {keyVerifyStatus === "verifying" ? "검증 중..." : "인증 및 등록"}
                    </button>
                    {userApiKey && (
                      <button
                        onClick={handleClearKey}
                        className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11.5px] pt-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    {keyVerifyStatus === "success" && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#2e7d72] animate-pulse"></span>
                        <span className="text-emerald-800 font-extrabold">{keyVerifyMessage}</span>
                      </>
                    )}
                    {keyVerifyStatus === "error" && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        <span className="text-red-700 font-extrabold">{keyVerifyMessage}</span>
                      </>
                    )}
                    {keyVerifyStatus === "verifying" && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-yellow-600 animate-pulse"></span>
                        <span className="text-yellow-700 font-extrabold">{keyVerifyMessage}</span>
                      </>
                    )}
                    {keyVerifyStatus === "idle" && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse"></span>
                        <span className="text-amber-800 font-extrabold">보안 잠금 상태 (분석 시스템 활성화를 위해 위의 폼에서 API Key를 먼저 승인해 주십시오.)</span>
                      </>
                    )}
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#114037] hover:underline hover:text-[#2e7d72] font-extrabold transition whitespace-nowrap text-xs"
                  >
                    API Key 발급받기 &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* FEATURES SECTION (BENTO GRID STYLE) */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xs uppercase font-bold text-[#2e7d72] tracking-widest">Key Engineering Capabilities</h2>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">품질 보증 표준을 완전 디지털화한 4대 핵심 역량</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. 5Why Interview Engine */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="w-10 h-10 bg-[#114037]/10 text-[#114037] rounded-xl flex items-center justify-center border border-[#114037]/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-950">1. 계통적 5Why 질문 인터뷰</h4>
                  <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                    AI 마스터가 공정 물리 원리를 바탕으로 엔지니어에게 질문을 건넵니다. 직접적 요인(Symptom)부터 기계/공정 제어, 작업 표준을 거쳐 최상위 시스템 조직적 요인까지 연쇄적으로 심층 분석합니다.
                  </p>
                </div>

                {/* 2. Causal Chain Map */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="w-10 h-10 bg-[#2e7d72]/10 text-[#2e7d72] rounded-xl flex items-center justify-center border border-[#2e7d72]/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-950">2. 실시간 Causal Chain Map (인과관계 시각화)</h4>
                  <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                    5단계 질문과 답변이 오갈 때마다 인과관계 계통도가 실시간 갱신되어, 현상과 원인 간의 논리적 모순이나 비약이 없는지 품질 보증 회의 시 완벽한 추적성을 시각적으로 확인합니다.
                  </p>
                </div>

                {/* 3. Global G8D Standard */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center border border-slate-300">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-950">3. IATF 16949 / ISO 9001 표준 완벽 호환</h4>
                  <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                    글로벌 탑티어 자동차 제조사가 필수로 채택하고 있는 D0(예방 대응)부터 D8(팀 노고 치하 및 종결)까지의 8D 보고서 필수 항목 규격을 빠짐없이 골격으로 유지하여 실무 즉시 적용이 가능합니다.
                  </p>
                </div>

                {/* 4. Professional Document Print */}
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="w-10 h-10 bg-[#2e7d72]/15 text-[#2e7d72] rounded-xl flex items-center justify-center border border-[#2e7d72]/20">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-950">4. 원클릭 인쇄 및 고객사 제출용 PDF 템플릿</h4>
                  <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                    별도의 엑셀 작업이나 워드 포맷팅이 필요 없습니다. 깔끔한 인쇄 CSS가 내장되어 있어 버튼 클릭 한 번으로 미려한 격자 형태의 공학적 보고서가 인쇄 및 고품질 PDF로 즉각 변환 저장됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* QUICK START DEMO (INTERACTIVE TEMPLATES) */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xs uppercase font-bold text-[#114037] tracking-widest">Exciting Quick Demo</h2>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">실무 불량 유형으로 AI 분석 퀵 시뮬레이션 개시</h3>
                <p className="text-xs text-slate-700 font-bold">아래의 주요 제조 현장 불량 시나리오를 선택하시면 바로 AI 기반 G8D 분석 루프가 시작됩니다.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {LANDING_TEMPLATES.map((tpl, idx) => (
                  <div 
                    key={idx}
                    className="bg-white rounded-2xl border-2 border-slate-300 hover:border-[#2e7d72]/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleQuickDemo(tpl)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 bg-[#114037]/10 text-[#114037] border border-[#114037]/20 rounded-md font-extrabold">
                          {tpl.badge}
                        </span>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1 font-mono font-extrabold">
                          난이도: <span className={tpl.difficulty === "어려움" ? "text-amber-600 font-extrabold" : "text-slate-700 font-extrabold"}>{tpl.difficulty}</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-slate-950 group-hover:text-[#2e7d72] transition-colors text-sm">
                          {tpl.name}
                        </h4>
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-bold">
                          발생 부서: {tpl.process} (초기 불량률 {tpl.defectRate})
                        </p>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2">
                          <span className="text-[9px] text-slate-600 uppercase font-extrabold block mb-1">D2 불량 상세현상</span>
                          <p className="text-[11px] text-slate-900 font-medium line-clamp-2 leading-normal">
                            {tpl.defect}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDemo(tpl);
                      }}
                      className="mt-6 w-full py-2.5 bg-slate-100 group-hover:bg-[#114037] group-hover:text-white border border-slate-300 group-hover:border-[#114037] text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <span>체험 및 분석 개시</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* TRUST BANNER */}
            <div className="bg-slate-950 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden border border-slate-800">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 scale-150 pointer-events-none">
                <Database className="w-96 h-96 text-indigo-500" />
              </div>
              <div className="relative z-10 max-w-2xl space-y-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-indigo-900/40 border border-indigo-800/60 text-indigo-300 rounded font-mono text-[9px] uppercase tracking-wider font-semibold">
                  QC Management Master
                </div>
                <h3 className="text-xl md:text-3xl font-bold tracking-tight leading-snug text-white">
                  품질 회의, 보고서 작성, 대책 회의의 <br className="hidden md:block"/>
                  고단함을 완벽히 내려놓으십시오.
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
                  8D 보고서는 제조 품질 경쟁력의 원천이지만, 수많은 규격 서식과 모순되는 5Why 논리로 인해 엔지니어의 에너지를 고갈시킵니다. 본 차세대 플랫폼은 실질적인 조치 방안을 실시간 수립해주어 본연의 시정 및 예방 조치 실행에 집중할 수 있도록 서포트합니다.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (ensureKeyOrScroll()) {
                        setShowLanding(false);
                      }
                    }}
                    className={`px-6 py-3 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                      keyVerifyStatus === "success" 
                        ? "bg-[#2e7d72] hover:bg-[#2e7d72]/90" 
                        : "bg-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <span>워크스페이스 바로가기</span>
                    {keyVerifyStatus === "success" ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* 기존 분석 워크스페이스 메인 보드 */
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-6 overflow-hidden max-w-[1400px] w-full mx-auto"
          >
            {/* Banner only visible before starting */}
            {!defectInput && (
              <div className="bg-slate-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-900 shrink-0">
                <div className="absolute right-0 bottom-0 opacity-5 translate-x-10 translate-y-10 scale-150 pointer-events-none">
                  <Layers className="w-96 h-96" />
                </div>
                <div className="relative z-10 space-y-3 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#2e7d72] font-semibold text-[10px] uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5 text-[#2e7d72]" />
                      <span>글로벌 탑티어 제조 실무 표준 지원</span>
                    </div>
                    <button
                      onClick={() => setShowLanding(true)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded font-semibold flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      소개 랜딩페이지로 이동
                    </button>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-snug">
                    제조 불량의 근본을 파헤치는 스마트 G8D 보고서 &amp; 5Why 디지털 솔루션
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    임시 격리 조치 수립부터 대화식 순차 5Why 원인 규명 인터뷰까지 한 번에 이어지는 차세대 품질경영 시뮬레이터입니다. AI가 CFT(Cross-Functional Team)를 구성하고, 글로벌 표준 규격에 충족되는 완벽한 형식의 제조 품질 보고서를 실시간으로 도출합니다.
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic Layout changing upon session state */}
            {!defectInput ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1">
                <div className="h-full">
                  <InputForm onSubmit={handleInitialSubmit} isLoading={isLoading} />
                </div>
                <div className="h-full min-h-[400px]">
                  <ReportViewer report={report} isLoading={isLoading} isFinalizing={isFinalizing} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left 8D Bento Grid (2/3 size) */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6 overflow-y-auto pr-0 lg:pr-1">
                  <div className="flex items-center justify-between shrink-0 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-tight">
                        8D Problem Solving Report (Bento Board)
                      </h2>
                      <button 
                        onClick={() => setShowLanding(true)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 font-semibold"
                      >
                        상세 기능 가이드 홈
                      </button>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono font-semibold uppercase">
                      ID: #QC-8D-{defectInput.process.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase() || "ENG"}-{new Date().getFullYear()}
                    </span>
                  </div>

                  {/* 5Why Visualization at the top of the bento board */}
                  <div className="shrink-0">
                    <WhyVisualization
                      whyHistory={whyHistory}
                      currentWhyIndex={currentWhyIndex}
                      currentQuestion={currentQuestion}
                      isCompleted={isCompleted}
                    />
                  </div>

                  {/* Full Report Steps */}
                  <div className="flex-1">
                    <ReportViewer report={report} isLoading={isLoading} isFinalizing={isFinalizing} />
                  </div>
                </div>

                {/* Right Interactive Interview Panel (1/3 size) */}
                <div className="w-full lg:w-1/3 flex flex-col">
                  <WhyInterview
                    currentWhyIndex={currentWhyIndex}
                    currentQuestion={currentQuestion}
                    whyHistory={whyHistory}
                    isLoading={isLoading}
                    isCompleted={isCompleted}
                    rootCause={rootCause}
                    onAnswerSubmit={handleAnswerSubmit}
                    onReset={handleReset}
                    defectInput={defectInput}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* G8D Bento Theme Footer Status Bar */}
      <footer className="h-10 bg-slate-200 border-t border-slate-300 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-slate-500">
          <span>ENGINE_VER: v2.4.0-PRO</span>
          <span className="hidden sm:inline">LATENCY: 12ms</span>
          <span className="hidden sm:inline">COMPLIANCE: IATF 16949</span>
        </div>
        
        {!showLanding && defectInput && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 uppercase font-semibold tracking-wider">5Why 진행도</span>
            <div className="w-32 md:w-40 h-2 bg-slate-300 rounded-full overflow-hidden border border-slate-200 shadow-inner">
              <div 
                className="h-full bg-[#114037] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#114037] w-8 text-right">
              {progressPercent}%
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}

