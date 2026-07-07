import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Report8D, WhyItem, DefectInput } from "./src/types.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Helper function to get Google GenAI client, supporting custom user key passed from frontend
function getAiClient(req: express.Request): GoogleGenAI {
  const customKey = req.headers["x-gemini-api-key"] as string;
  const keyToUse = customKey || process.env.GEMINI_API_KEY;
  if (!keyToUse) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다. 랜딩 페이지에서 API Key를 입력하시거나 서버 설정을 확인해 주세요.");
  }
  return new GoogleGenAI({
    apiKey: keyToUse,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// System Instruction for 8D & 5Why Expert
const SYSTEM_INSTRUCTION = `
당신은 QC(품질관리) 분야의 최고 전문가이자, 8D(8 Disciplines) 문제 해결 프로세스 마스터입니다.
사용자가 제공한 불량 현상 정보를 바탕으로 글로벌 제조 표준(Automotive, Semiconductor 등 글로벌 표준 규격)에 부합하는 체계적이고 사실적인 8D 보고서 초안을 작성하고, 사용자와 한 문답씩 주고받는 '순차적 5Why' 인터뷰를 통해 근본 원인을 도출합니다.

[역할 및 제약 사항]
1. 8D 보고서 작성 및 질문 구성 시 사실적이고 전문적이며 명확하게 작성해야 합니다.
2. 질문은 반드시 한 문장으로 간결하게 구성해야 합니다.
`;

// API Endpoint 1: Generate 8D Draft
app.post("/api/generate-8d", async (req, res) => {
  const { defect, process: procName, defectRate, containmentAction } = req.body as DefectInput;

  if (!defect || !procName || !defectRate || !containmentAction) {
    return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
  }

  const prompt = `
사용자가 다음과 같은 불량 현상 및 정보를 제공했습니다:
- 불량현상: ${defect}
- 발생공정: ${procName}
- 불량률: ${defectRate}
- 임시조치: ${containmentAction}

이 정보를 바탕으로, 글로벌 제조 표준에 맞춘 8D 보고서 초안(D0~D8)을 작성해 주십시오. 
D4(Root Cause Analysis) 항목은 5Why 분석이 시작되기 전이므로 가설 검증 계획 및 유력 가설 후보 단계로 작성하고, 추후 5Why 인터뷰를 통해 완벽히 규명될 것이라는 점을 명시해 주세요.
그리고, 5Why 분석의 첫 번째 단계인 'Why 1' 질문을 작성해 주세요. 이 질문은 이 불량이 왜 발생했는지 직접적인 인과관계를 묻는 전문적이고 구체적인 단 하나의 질문이어야 합니다.

[작성 지침]
- 전문적인 품질관리 용어를 활용하세요.
- 각 필드는 생략 없이 완결된 개조식 상세 문장들로 채워야 합니다.
- d0 ~ d8은 string 형태이며, HTML 줄바꿈(<br> 또는 \n)을 적절히 포함한 구조화된 텍스트로 주세요.
- why1 필드에는 Why 1 질문 문장 하나만 담아야 합니다. (예: "왜 ${defect}가 ${procName} 공정에서 발생했습니까?")
`;

  try {
    const aiClient = getAiClient(req);
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            d0: { type: Type.STRING, description: "D0: Plan / 준비 및 긴급 대책" },
            d1: { type: Type.STRING, description: "D1: Use Team / 교차 기능 팀(CFT) 구성 및 주요 역할" },
            d2: { type: Type.STRING, description: "D2: Problem Description / 5W2H 기반의 불량 정량적 기술" },
            d3: { type: Type.STRING, description: "D3: Interim Containment Actions / 임시 유출 방지 조치 및 검증 결과" },
            d4: { type: Type.STRING, description: "D4: Root Cause Analysis / 잠재적 원인 분석 및 가설 검증 계획" },
            d5: { type: Type.STRING, description: "D5: Permanent Corrective Actions / 잠재적 영구 시정 조치 수립 방향" },
            d6: { type: Type.STRING, description: "D6: Implement & Verify / 영구 시정 조치 효과 사전 검증 계획" },
            d7: { type: Type.STRING, description: "D7: Prevent Recurrence / 공정 설계 지침 변경 및 표준화 수립 방향" },
            d8: { type: Type.STRING, description: "D8: Congratulate Team / CFT 공헌도 평가 및 프로세스 이관" },
            why1: { type: Type.STRING, description: "5Why 분석을 시작하기 위한 첫 번째 핵심 인과관계 질문 (한 문장)" },
          },
          required: ["d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "why1"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini API가 빈 응답을 반환했습니다.");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Error in generate-8d:", error);
    res.status(500).json({ error: "8D 보고서 초안 생성 중 오류가 발생했습니다.", details: error.message });
  }
});

// API Endpoint 2: 5Why Interactive Interview
app.post("/api/why-interview", async (req, res) => {
  const { defectInput, whyHistory, currentWhyIndex, nextAnswer } = req.body;

  if (!defectInput || !whyHistory || currentWhyIndex === undefined || !nextAnswer) {
    return res.status(400).json({ error: "필요한 정보가 부족합니다." });
  }

  // Build the conversation history format for the prompt
  const formattedHistory = whyHistory
    .map((item: WhyItem) => `Why ${item.index}: ${item.question}\n답변 ${item.index}: ${item.answer}`)
    .join("\n\n");

  const prompt = `
사용자가 진행 중인 5Why 분석 인터뷰 내역은 다음과 같습니다.
[불량 및 공정 기본 정보]
- 불량현상: ${defectInput.defect}
- 발생공정: ${defectInput.process}
- 불량률: ${defectInput.defectRate}
- 임시조치: ${defectInput.containmentAction}

[지금까지 진행된 5Why 인터뷰 히스토리]
${formattedHistory}

[사용자의 직전 질문에 대한 답변]
- Why ${currentWhyIndex} 질문: ${whyHistory[whyHistory.length - 1]?.question || ""}
- 사용자의 최신 답변: ${nextAnswer}

[분석 및 다음 단계 지침]
1. 사용자의 최근 답변(${nextAnswer})을 기반으로, 인과관계가 깊어지는 다음 단계의 질문(Why ${currentWhyIndex + 1})을 구체적으로 도출하십시오.
2. 만약 현재 Why 인덱스가 5에 도달했거나, 또는 5단계 이전이라도 더 이상 파고들 질문이 없으며 기계적/설계적/시스템적 또는 조직 절차적 근본 원인이 명확히 완성된 경우, 즉시 인터뷰를 종료 처리(isCompleted: true)하십시오.
3. 근본 원인이 완성된 경우, 최종적인 'D4용 근본 원인 분석 요약문'을 \`rootCause\` 필드에 자세히 기술해 주십시오. 5Why 인과 관계가 한눈에 들어오는 요약이어야 하며, 공정상 원인(설비/공정 조건)과 시스템적 원인(규정/표준 관리 미흡)이 정밀하게 기술되어야 합니다.
4. 질문은 한 번에 절대 여러 개 던질 수 없으며, 다음 질문은 오직 한 문장만 작성하십시오.
`;

  try {
    const aiClient = getAiClient(req);
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextQuestion: { type: Type.STRING, description: "다음 단계의 5Why 질문 문장 (예: 'Why 3: 왜 압력이 과도하게 충전되었습니까?'). 완료 시 비워둡니다." },
            isCompleted: { type: Type.BOOLEAN, description: "근본 원인이 명확히 규명되어 인터뷰를 종료할지 여부" },
            rootCause: { type: Type.STRING, description: "최종 정리된 근본 원인 분석 요약문 (D4용). 인터뷰가 진행 중일 때는 비워둡니다." },
          },
          required: ["nextQuestion", "isCompleted", "rootCause"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini API가 빈 응답을 반환했습니다.");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Error in why-interview:", error);
    res.status(500).json({ error: "인터뷰 진행 중 오류가 발생했습니다.", details: error.message });
  }
});

// API Endpoint 3: Finalize 8D Report with Root Cause
app.post("/api/finalize-8d", async (req, res) => {
  const { initialReport, rootCause, defectInput, whyHistory } = req.body;

  if (!initialReport || !rootCause || !defectInput) {
    return res.status(400).json({ error: "필요한 정보가 부족합니다." });
  }

  const formattedHistory = whyHistory
    .map((item: WhyItem) => `Why ${item.index}: ${item.question}\n답변 ${item.index}: ${item.answer}`)
    .join("\n");

  const prompt = `
초기 8D 보고서 초안과 도출된 최종 근본 원인 정보를 결합하여, 가장 사실적이고 구체적인 최종 8D 보고서를 작성하십시오.

[기본 정보]
- 불량현상: ${defectInput.defect}
- 발생공정: ${defectInput.process}
- 불량률: ${defectInput.defectRate}
- 임시조치: ${defectInput.containmentAction}

[5Why 진행 이력 및 도출된 근본 원인]
${formattedHistory}

- 최종 합의된 근본 원인: ${rootCause}

[작성 및 다듬기 지침]
1. D4 (Root Cause Analysis): 최종 합의된 근본 원인과 5Why 분석 이력을 결합하여 기술적 원인과 관리적/시스템적 원인으로 나누어 상세하게 묘사하십시오.
2. D5 (Permanent Corrective Actions): 도출된 근본 원인(설비 보완, 레시피 가이드 수정, 작업자 교육, 표준 관리 등)을 완벽히 무력화할 수 있는 영구적이고 구체적인 대책을 작성하십시오.
3. D6 (Implement & Verify): 영구 대책 실행 내역과 유효성 검증 방법(CpK 분석, 불량률 추이 검증 등)을 논리적으로 작성하십시오.
4. D7 (Prevent Recurrence): 이번 발생 사례가 다른 라인이나 차기 모델 설계 등에 횡전개(Horizontal Expansion) 및 표준화(Standardization, FMEA 개정, QC 공정표 반영)될 수 있도록 예방 조치를 구체화하십시오.
5. 기존 D0, D1, D2, D3, D8 내용도 이번 분석 결과와 유기적으로 연결되도록 아주 자연스럽고 완성도 높게 다듬어 주십시오.
- 모든 답변 문장은 줄바꿈(\\n)을 적절히 포함하여 실무용 양식처럼 구성해 주십시오.
`;

  try {
    const aiClient = getAiClient(req);
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            d0: { type: Type.STRING, description: "D0: Plan" },
            d1: { type: Type.STRING, description: "D1: Use Team" },
            d2: { type: Type.STRING, description: "D2: Problem Description" },
            d3: { type: Type.STRING, description: "D3: Interim Containment Actions" },
            d4: { type: Type.STRING, description: "D4: Root Cause Analysis (5Why 이력 및 근본 원인 완벽 반영)" },
            d5: { type: Type.STRING, description: "D5: Permanent Corrective Actions (근본 원인 해결을 위한 영구 시정 조치)" },
            d6: { type: Type.STRING, description: "D6: Implement & Verify (영구 조치 적용 및 정량적 유효성 검증)" },
            d7: { type: Type.STRING, description: "D7: Prevent Recurrence (절차서 FMEA 개정 및 재발 방지)" },
            d8: { type: Type.STRING, description: "D8: Congratulate Team" },
          },
          required: ["d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini API가 빈 응답을 반환했습니다.");
    }

    const data = JSON.parse(resultText);
    res.json({ finalizedReport: data });
  } catch (error: any) {
    console.error("Error in finalize-8d:", error);
    res.status(500).json({ error: "최종 8D 보고서 다듬기 중 오류가 발생했습니다.", details: error.message });
  }
});

// API Endpoint 4: Verify Custom API Key
app.post("/api/verify-key", async (req, res) => {
  try {
    const aiClient = getAiClient(req);
    // Simple verification request
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
      config: {
        maxOutputTokens: 5,
      },
    });
    if (response) {
      return res.json({ success: true, message: "Gemini API Key가 정상적으로 인증되었습니다." });
    }
    throw new Error("응답을 받지 못했습니다.");
  } catch (error: any) {
    console.error("Error verifying API key:", error);
    res.status(401).json({ error: "유효하지 않은 API Key이거나 요청 중 오류가 발생했습니다.", details: error.message });
  }
});

// Start Server
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${isProd ? "production" : "development"} mode.`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
