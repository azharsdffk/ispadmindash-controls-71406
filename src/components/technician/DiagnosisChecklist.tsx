import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Package,
  Shield,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DiagnosisItem {
  id: string;
  step: string;
  checked: boolean;
}

interface ToolItem {
  name: string;
  required: boolean;
}

interface SparePart {
  name: string;
  probability: "high" | "medium" | "low";
}

interface DiagnosisData {
  issueType: string;
  steps: string[];
  tools: ToolItem[];
  spareParts: SparePart[];
  safetyWarnings: string[];
  tips: string[];
}

// Comprehensive diagnosis data for each issue type
const diagnosisDatabase: Record<string, DiagnosisData> = {
  "ضعف بالخدمة": {
    issueType: "ضعف بالخدمة",
    steps: [
      "فحص مستوى إشارة ONT (يجب أن تكون أعلى من -25dBm)",
      "التحقق من جميع توصيلات الكابل",
      "فحص حالة الـ Splitter",
      "اختبار السرعة من ONT مباشرة",
      "فحص إعدادات الراوتر",
      "التحقق من عدد الأجهزة المتصلة",
    ],
    tools: [
      { name: "جهاز قياس الضوء (Power Meter)", required: true },
      { name: "لابتوب للفحص", required: true },
      { name: "كابل إيثرنت", required: true },
      { name: "OTDR", required: false },
    ],
    spareParts: [
      { name: "Splitter", probability: "medium" },
      { name: "كابل توصيل", probability: "medium" },
      { name: "فيشة جديدة", probability: "low" },
    ],
    safetyWarnings: [
      "لا تنظر مباشرة إلى الليزر",
      "تأكد من إيقاف الإشارة قبل العمل على الكابل",
    ],
    tips: [
      "إذا كانت الإشارة ضعيفة، تحقق من الوصلات أولاً",
      "قارن القراءة مع المشتركين المجاورين",
    ],
  },
  "تبديل جهاز الـ ONT": {
    issueType: "تبديل جهاز الـ ONT",
    steps: [
      "تسجيل الرقم التسلسلي للجهاز القديم",
      "فصل الكابل الضوئي بحذر",
      "توصيل الجهاز الجديد",
      "تسجيل الرقم التسلسلي الجديد في النظام",
      "انتظار تفعيل الجهاز",
      "اختبار الاتصال والسرعة",
    ],
    tools: [
      { name: "ONT جديد", required: true },
      { name: "جهاز قياس الضوء", required: true },
      { name: "لابتوب للتسجيل", required: true },
      { name: "مناديل تنظيف", required: true },
    ],
    spareParts: [
      { name: "ONT", probability: "high" },
      { name: "محول كهرباء", probability: "low" },
    ],
    safetyWarnings: [
      "تعامل بحذر مع الكابل الضوئي",
      "لا تثني الكابل بزاوية حادة",
    ],
    tips: [
      "تأكد من تطابق نوع الجهاز مع الخدمة",
      "احتفظ بصورة للرقم التسلسلي",
    ],
  },
  "قطع في الكابل الرئيسي": {
    issueType: "قطع في الكابل الرئيسي",
    steps: [
      "تحديد موقع القطع باستخدام OTDR",
      "فحص المنطقة المحتملة للقطع",
      "تجهيز موقع اللحام",
      "لحام الكابل أو تبديل المقطع",
      "اختبار الخط بعد الإصلاح",
      "التأكد من جودة الإشارة لجميع المشتركين",
    ],
    tools: [
      { name: "OTDR", required: true },
      { name: "جهاز لحام الألياف", required: true },
      { name: "أدوات تقشير الكابل", required: true },
      { name: "كحول تنظيف", required: true },
      { name: "علبة لحام", required: true },
    ],
    spareParts: [
      { name: "كابل ضوئي احتياطي", probability: "high" },
      { name: "علبة لحام", probability: "high" },
      { name: "أنابيب حرارية", probability: "high" },
    ],
    safetyWarnings: [
      "ارتدِ نظارات الحماية",
      "احذر من قطع الألياف المتطايرة",
      "لا تلمس العدسات بيدك",
    ],
    tips: [
      "خذ قراءة OTDR قبل وبعد الإصلاح",
      "تأكد من نظافة سطح اللحام",
    ],
  },
  "تبديل جهاز الراوتر": {
    issueType: "تبديل جهاز الراوتر",
    steps: [
      "تسجيل إعدادات الراوتر القديم",
      "فصل جميع الكابلات",
      "توصيل الراوتر الجديد",
      "إعداد الشبكة اللاسلكية",
      "اختبار جميع المنافذ",
      "التأكد من اتصال جميع الأجهزة",
    ],
    tools: [
      { name: "راوتر جديد", required: true },
      { name: "كابل إيثرنت", required: true },
      { name: "لابتوب للإعداد", required: true },
    ],
    spareParts: [
      { name: "راوتر", probability: "high" },
      { name: "محول كهرباء", probability: "low" },
      { name: "كابل إيثرنت", probability: "low" },
    ],
    safetyWarnings: [
      "تأكد من فصل الكهرباء قبل التبديل",
    ],
    tips: [
      "استخدم نفس اسم الشبكة وكلمة المرور القديمة",
      "اختبر السرعة بعد الإعداد",
    ],
  },
  "فيشة مكسورة خارجيه": {
    issueType: "فيشة مكسورة خارجية",
    steps: [
      "تحديد نوع الفيشة المطلوبة",
      "قطع الجزء التالف من الكابل",
      "تقشير الكابل بشكل صحيح",
      "تركيب الفيشة الجديدة",
      "اختبار الاتصال",
    ],
    tools: [
      { name: "أداة تقشير", required: true },
      { name: "أداة كبس الفيشة", required: true },
      { name: "جهاز قياس الضوء", required: true },
    ],
    spareParts: [
      { name: "فيشة SC/APC", probability: "high" },
      { name: "فيشة SC/UPC", probability: "medium" },
    ],
    safetyWarnings: [
      "احذر من الحواف الحادة",
    ],
    tips: [
      "تأكد من نظافة نهاية الكابل",
      "استخدم النوع الصحيح من الفيشة",
    ],
  },
  "مشترك جديد": {
    issueType: "تركيب مشترك جديد",
    steps: [
      "التحقق من وصول الكابل للموقع",
      "تركيب ONT في مكان مناسب",
      "توصيل الكابل الضوئي",
      "تفعيل الخدمة في النظام",
      "إعداد الراوتر",
      "اختبار السرعة والاتصال",
      "شرح الخدمة للمشترك",
    ],
    tools: [
      { name: "ONT", required: true },
      { name: "راوتر", required: true },
      { name: "كابلات توصيل", required: true },
      { name: "جهاز قياس الضوء", required: true },
      { name: "أدوات تثبيت", required: true },
    ],
    spareParts: [
      { name: "ONT", probability: "high" },
      { name: "راوتر", probability: "high" },
      { name: "كابل توصيل", probability: "high" },
      { name: "فيشات", probability: "medium" },
    ],
    safetyWarnings: [
      "تأكد من سلامة التوصيلات الكهربائية",
      "ثبت الأجهزة بشكل آمن",
    ],
    tips: [
      "اختر موقع مناسب للأجهزة",
      "زود المشترك بمعلومات الشبكة مكتوبة",
    ],
  },
};

interface DiagnosisChecklistProps {
  issueType: string | null;
  onClose?: () => void;
}

const DiagnosisChecklist = ({ issueType, onClose }: DiagnosisChecklistProps) => {
  const [checklist, setChecklist] = useState<DiagnosisItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(["steps", "tools"]);

  const data = issueType ? diagnosisDatabase[issueType] || null : null;

  // Initialize checklist when issue type changes
  useState(() => {
    if (data) {
      setChecklist(data.steps.map((step, i) => ({
        id: `step-${i}`,
        step,
        checked: false,
      })));
    }
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const getProbabilityColor = (probability: "high" | "medium" | "low") => {
    switch (probability) {
      case "high": return "bg-red-500/20 text-red-300 border-red-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "low": return "bg-green-500/20 text-green-300 border-green-500/50";
    }
  };

  if (!data) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <p className="text-slate-400">اختر نوع العطل لعرض قائمة التشخيص</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Steps Checklist */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection("steps")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              خطوات الفحص
            </CardTitle>
            {expandedSections.includes("steps") ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>
        {expandedSections.includes("steps") && (
          <CardContent className="space-y-2">
            {data.steps.map((step, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-2 bg-slate-700/30 rounded-lg"
              >
                <Checkbox
                  id={`step-${index}`}
                  checked={checklist.find(c => c.id === `step-${index}`)?.checked || false}
                  onCheckedChange={() => toggleCheck(`step-${index}`)}
                />
                <label 
                  htmlFor={`step-${index}`}
                  className="text-slate-200 text-sm cursor-pointer flex-1"
                >
                  {index + 1}. {step}
                </label>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Required Tools */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection("tools")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-400" />
              الأدوات المطلوبة
            </CardTitle>
            {expandedSections.includes("tools") ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>
        {expandedSections.includes("tools") && (
          <CardContent className="space-y-2">
            {data.tools.map((tool, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
              >
                <span className="text-slate-200 text-sm">{tool.name}</span>
                <Badge variant={tool.required ? "destructive" : "secondary"}>
                  {tool.required ? "ضروري" : "اختياري"}
                </Badge>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Spare Parts */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection("parts")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              قطع الغيار المحتملة
            </CardTitle>
            {expandedSections.includes("parts") ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>
        {expandedSections.includes("parts") && (
          <CardContent className="space-y-2">
            {data.spareParts.map((part, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
              >
                <span className="text-slate-200 text-sm">{part.name}</span>
                <Badge className={getProbabilityColor(part.probability)}>
                  {part.probability === "high" ? "احتمال عالي" :
                   part.probability === "medium" ? "احتمال متوسط" : "احتمال منخفض"}
                </Badge>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Safety Warnings */}
      {data.safetyWarnings.length > 0 && (
        <Card className="bg-red-900/20 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              تحذيرات السلامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.safetyWarnings.map((warning, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 p-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-red-200 text-sm">{warning}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {data.tips.length > 0 && (
        <Card className="bg-green-900/20 border-green-500/50">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              نصائح مفيدة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.tips.map((tip, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 p-2"
              >
                <Lightbulb className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-200 text-sm">{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagnosisChecklist;
