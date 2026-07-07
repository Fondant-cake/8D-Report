export interface Report8D {
  d0: string; // Plan / 준비 및 비상 대응 조치
  d1: string; // Use Team / 팀 구성 및 역할 분담
  d2: string; // Problem Description / 불량 현상 및 문제 정의
  d3: string; // Interim Containment Actions / 임시 조치 사항
  d4: string; // Root Cause Analysis / 근본 원인 분석 (5Why 결과가 반영될 곳)
  d5: string; // Permanent Corrective Actions / 영구 시정 조치 계획
  d6: string; // Implement Permanent Corrective Actions / 영구 조치 실행 및 효과 검증
  d7: string; // Prevent Recurrence / 재발 방지 대책 수립
  d8: string; // Congratulate Team / 팀 평가 및 공식 종료
}

export interface WhyItem {
  index: number; // 1, 2, 3, 4, 5
  question: string;
  answer: string;
}

export interface DefectInput {
  defect: string;
  process: string;
  defectRate: string;
  containmentAction: string;
}

export interface InterviewSession {
  defectInput: DefectInput;
  initialReport: Report8D;
  currentWhyIndex: number; // 1 to 5
  whyHistory: WhyItem[];
  isCompleted: boolean;
  rootCause: string;
}
