import React, { useState } from "react";
import { Report8D } from "../types";
import { Copy, Check, Printer, FileText, ShieldCheck, Layers, Clipboard, Users, AlertCircle, Ban, Hammer, Eye, RotateCcw, Award } from "lucide-react";
import { motion } from "motion/react";

interface ReportViewerProps {
  report: Report8D | null;
  isLoading: boolean;
  isFinalizing: boolean;
}

const STEP_DETAILS = {
  d0: { id: "D0", title: "Plan / 준비", desc: "대응 준비 및 비상 대응 조치", icon: Clipboard, gridClass: "col-span-1" },
  d1: { id: "D1", title: "Use Team / 팀 구성", desc: "교차 기능 팀(CFT) 구성 및 역할", icon: Users, gridClass: "col-span-1" },
  d2: { id: "D2", title: "Problem Description", desc: "5W2H 기반의 정량적 문제 정의", icon: AlertCircle, gridClass: "col-span-1 md:col-span-2 border-l-4 border-l-[#114037]" },
  d3: { id: "D3", title: "Interim Containment", desc: "임시 격리 및 유출 방지 조치", icon: Ban, gridClass: "col-span-1" },
  d4: { id: "D4", title: "Root Cause Analysis", desc: "5Why 원인 추적 및 가설 검증 결과", icon: ShieldCheck, gridClass: "col-span-1 md:col-span-2" },
  d5: { id: "D5", title: "Corrective Actions", desc: "근본 해결을 위한 영구 시정 조치", icon: Hammer, gridClass: "col-span-1" },
  d6: { id: "D6", title: "Implement & Verify", desc: "영구 대책 실행 및 유효성 검증", icon: Eye, gridClass: "col-span-1" },
  d7: { id: "D7", title: "Prevent Recurrence", desc: "표준화 및 예방 조치 수립", icon: RotateCcw, gridClass: "col-span-1" },
  d8: { id: "D8", title: "Congratulate Team", desc: "CFT 공헌도 평가 및 공식 종료", icon: Award, gridClass: "col-span-1" }
};

export default function ReportViewer({ report, isLoading, isFinalizing }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "d0-d3" | "d4-d8">("all");

  const handleCopy = () => {
    if (!report) return;
    
    const text = Object.entries(STEP_DETAILS).map(([key, label]) => {
      const content = report[key as keyof Report8D] || "미도출";
      return `[${label.id}] ${label.title} (${label.desc})\n${content.replace(/<br\s*\/?>/g, "\n")}\n`;
    }).join("\n==============================\n\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatText = (text: string) => {
    if (!text) return "대기 중...";
    return text.split("\n").map((line, index) => (
      <span key={index} className="block mb-1.5 last:mb-0">
        {line}
      </span>
    ));
  };

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-md flex flex-col h-full overflow-hidden">
      {/* 뷰어 헤더 */}
      <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#114037] rounded-lg text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">8D G8D 품질 보증 보고서 (Bento Board)</h3>
            <p className="text-xs text-slate-400 mt-0.5">글로벌 IATF 16949 표준 양식의 신속 대응 시각화 보드</p>
          </div>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="클립보드에 전체 내용 복사"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>복사</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="인쇄 또는 PDF 저장"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄 / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* 탭 필터 네비게이션 */}
      {report && (
        <div className="flex border-b border-slate-200/80 bg-slate-100 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "all" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            전체 프로세스 (D0 ~ D8)
          </button>
          <button
            onClick={() => setActiveTab("d0-d3")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "d0-d3" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            초기 대응 단계 (D0 ~ D3)
          </button>
          <button
            onClick={() => setActiveTab("d4-d8")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "d4-d8" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            근본 대책 단계 (D4 ~ D8)
          </button>
        </div>
      )}

      {/* 보고서 내용 영역 (Bento Grid) */}
      <div id="printable-report" className="flex-1 p-5 overflow-y-auto bg-slate-50/50 print:p-0">
        {!report ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Layers className="w-8 h-8 text-[#2e7d72]" />
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <p className="font-extrabold text-slate-900 animate-pulse text-sm">8D 품질 분석 보고서 초기 구조 생성 중...</p>
                <p className="text-xs text-slate-700 font-medium max-w-xs leading-relaxed mx-auto">
                  CFT 부서 간 교차 정보 수집 및 글로벌 표준 서식 D0 ~ D8의 뼈대를 실시간 구성하고 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-extrabold text-slate-900 text-sm">대기 중인 G8D Bento Board</p>
                <p className="text-xs text-slate-700 font-medium max-w-xs leading-relaxed mx-auto">
                  왼쪽 폼에 발생된 품질 불량 정보를 입력하시면, 글로벌 표준 규격의 G8D 품질 보고서가 Bento Grid 양식으로 정밀 가시화됩니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* 회사 인장 형태의 데코 */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs print:mb-6">
              <div className="space-y-1">
                <span className="text-[9.5px] font-extrabold text-[#114037] uppercase tracking-widest bg-[#114037]/10 px-2.5 py-0.5 rounded border border-[#114037]/30">
                  ISO 9001 / IATF 16949 품질 공인 가이드라인 준수
                </span>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">G8D CORRECTIVE ACTION REPORT</h4>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-700 space-y-0.5">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="font-bold text-slate-800">{isFinalizing ? "FINALIZING" : "IN-PROGRESS"}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">{new Date().toLocaleDateString("ko-KR")}</p>
              </div>
            </div>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(STEP_DETAILS).map(([key, label]) => {
                // 필터 체크
                if (activeTab === "d0-d3" && !["d0", "d1", "d2", "d3"].includes(key)) return null;
                if (activeTab === "d4-d8" && !["d4", "d5", "d6", "d7", "d8"].includes(key)) return null;

                const content = report[key as keyof Report8D];
                const isD4 = key === "d4";
                const isD2 = key === "d2";
                const isUpdating = isFinalizing && ["d4", "d5", "d6", "d7"].includes(key);
                const isLocked = isD4 && content && !content.includes("5Why 인터뷰");

                // Check if step is not filled yet
                const isPending = !content || content.includes("미도출") || content.includes("5Why 인터뷰");

                let cardBgClass = "bg-white border-slate-200/80 shadow-xs";
                if (isUpdating) {
                  cardBgClass = "bg-amber-50/40 border-2 border-amber-400 shadow-sm ring-4 ring-amber-400/10";
                } else if (isD4) {
                  if (isLocked) {
                    cardBgClass = "bg-emerald-50/30 border border-emerald-300 shadow-sm";
                  } else {
                    cardBgClass = "bg-[#114037]/5 border border-[#114037]/30 border-dashed shadow-xs";
                  }
                } else if (isPending && !isD2) {
                  cardBgClass = "bg-slate-50/60 border-slate-200/40 opacity-50";
                }

                return (
                  <motion.div
                    key={key}
                    layoutId={`step-${key}`}
                    className={`rounded-xl p-4 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${label.gridClass} ${cardBgClass}`}
                  >
                    {/* 상단 헤더 및 배지 */}
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                          isD4 && isLocked
                            ? "bg-[#2e7d72] text-white border-[#2e7d72]"
                            : isD4
                            ? "bg-[#114037] text-white border-[#114037]"
                            : "bg-slate-900 text-white border-slate-800"
                        }`}>
                          {label.id}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800 truncate">{label.title}</h5>
                      </div>
                      
                      {/* 상태 배지 */}
                      {isUpdating && (
                        <span className="text-[9px] bg-amber-100 border border-amber-200 text-amber-800 font-bold px-2 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                          Updating
                        </span>
                      )}
                      {isD4 && isLocked && (
                        <span className="text-[9px] bg-[#2e7d72]/15 border border-[#2e7d72]/20 text-[#114037] font-bold px-2.5 py-0.2 rounded-full uppercase tracking-wider flex items-center gap-1">
                          Locked
                        </span>
                      )}
                      {isD4 && !isLocked && (
                        <span className="text-[9px] bg-[#2e7d72]/10 border border-[#2e7d72]/20 text-[#2e7d72] font-bold px-2.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                          Interviewing
                        </span>
                      )}
                      {!isUpdating && !isD4 && isPending && (
                        <span className="text-[9px] bg-slate-200 border border-slate-200 text-slate-500 font-medium px-1.5 py-0.2 rounded">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* 본문 디테일 정보 */}
                    <div className="flex-1">
                      <p className="text-[10.5px] text-slate-700 font-bold mb-1.5">{label.desc}</p>
                      <div className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap bg-white rounded-lg p-3 border border-slate-200/80 min-h-[70px] shadow-xs font-medium">
                        {formatText(content)}
                      </div>
                    </div>

                    {/* 푸터 보조 정보 */}
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600 font-semibold pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <label.icon className="w-3.5 h-3.5 text-slate-500" />
                        <span>CFT 정식 승인 완료</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-500">Ver 1.0</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 인쇄 전용 CSS 스타일 보완 */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          #printable-report {
            overflow: visible !important;
            height: auto !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          /* Hide non-printable items */
          header, footer, button, .flex-none, .border-b, .bg-slate-50, .flex-wrap {
            display: none !important;
          }
          .bg-white {
            background-color: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .border {
            border: 1px solid #ddd !important;
          }
          .rounded-xl {
            border-radius: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}
