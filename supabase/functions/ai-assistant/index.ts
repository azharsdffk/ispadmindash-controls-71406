import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = "chat" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = "أنت مساعد ذكي لنظام إدارة الإنترنت والمشتركين. تساعد في الإجابة على الأسئلة وتقديم الاقتراحات الذكية.";
    
    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
    };

    // Add tools based on request type
    if (type === "classify_ticket") {
      systemPrompt = "أنت نظام تصنيف ذكي لتذاكر الصيانة. قم بتحليل الوصف وتحديد الأولوية المناسبة والفئة.";
      body.messages[0].content = systemPrompt;
      body.tools = [
        {
          type: "function",
          function: {
            name: "classify_maintenance_ticket",
            description: "تصنيف تذكرة الصيانة وتحديد الأولوية",
            parameters: {
              type: "object",
              properties: {
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "urgent"],
                  description: "مستوى الأولوية المقترح"
                },
                category: {
                  type: "string",
                  description: "فئة المشكلة (مثل: انقطاع الخدمة، بطء الإنترنت، مشكلة فنية)"
                },
                estimated_time: {
                  type: "number",
                  description: "الوقت المقدر للحل بالساعات"
                },
                reason: {
                  type: "string",
                  description: "سبب التصنيف"
                }
              },
              required: ["priority", "category", "estimated_time", "reason"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "classify_maintenance_ticket" } };
    } else if (type === "suggest_payments") {
      systemPrompt = "أنت نظام ذكي لتحليل المدفوعات واقتراح إجراءات التحصيل المناسبة.";
      body.messages[0].content = systemPrompt;
      body.tools = [
        {
          type: "function",
          function: {
            name: "suggest_payment_actions",
            description: "اقتراح إجراءات التحصيل للمشتركين",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      subscriber_id: { type: "string" },
                      action: { 
                        type: "string",
                        enum: ["reminder", "discount_offer", "payment_plan", "service_suspension"]
                      },
                      priority: {
                        type: "string",
                        enum: ["low", "medium", "high"]
                      },
                      reason: { type: "string" }
                    },
                    required: ["subscriber_id", "action", "priority", "reason"],
                    additionalProperties: false
                  }
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "suggest_payment_actions" } };
    } else if (type === "assign_technician") {
      systemPrompt = "أنت نظام ذكي لتوزيع المهام على الفنيين بناءً على الموقع والتخصص والتوفر.";
      body.messages[0].content = systemPrompt;
      body.tools = [
        {
          type: "function",
          function: {
            name: "assign_technician_smart",
            description: "اختيار أفضل فني للمهمة",
            parameters: {
              type: "object",
              properties: {
                technician_id: {
                  type: "string",
                  description: "معرف الفني المقترح"
                },
                score: {
                  type: "number",
                  description: "درجة التطابق من 0 إلى 100"
                },
                reason: {
                  type: "string",
                  description: "سبب الاختيار"
                },
                estimated_arrival: {
                  type: "string",
                  description: "الوقت المقدر للوصول"
                }
              },
              required: ["technician_id", "score", "reason", "estimated_arrival"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "assign_technician_smart" } };
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد إلى حساب Lovable AI" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    
    // Extract tool call result if present
    if (data.choices?.[0]?.message?.tool_calls?.[0]) {
      const toolCall = data.choices[0].message.tool_calls[0];
      const result = JSON.parse(toolCall.function.arguments);
      
      return new Response(
        JSON.stringify({ 
          result,
          type: 'tool_call',
          function_name: toolCall.function.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return regular chat response
    return new Response(
      JSON.stringify({ 
        message: data.choices[0].message.content,
        type: 'chat'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
