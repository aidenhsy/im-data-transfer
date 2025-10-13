import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/resources/index';

const openai = new OpenAI({
  apiKey: 'sk-87d5481e977947c484e5a215ea453f2b',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// hard-coded "company DB"
const companyFacts = {
  founded_year: '2019',
  hq_city: 'Tokyo',
  legal_name: 'Younger 7 株式会社',
};

// lateness deduction tiers
const latenessRules = [
  { min: 0, max: 5, deduction: 0 },
  { min: 6, max: 10, deduction: 10 },
  { min: 11, max: 20, deduction: 20 },
];

function getCompanyFact({ key }: { key: keyof typeof companyFacts }) {
  return { key, value: companyFacts[key] ?? 'unknown' };
}

function getLatePenalty({
  employeeId,
  minutesLate,
}: {
  employeeId: string;
  minutesLate: number;
}) {
  const rule = latenessRules.find(
    (r) => minutesLate >= r.min && minutesLate <= r.max
  );
  return {
    employeeId,
    minutesLate,
    deduction: rule ? rule.deduction : 0,
    currency: 'USD',
    policy_version: 'v1.0-demo',
  };
}

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getCompanyFact',
      description:
        'Return a company fact such as founded_year, hq_city, or legal_name.',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            enum: ['founded_year', 'hq_city', 'legal_name'],
          },
        },
        required: ['key'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getLatePenalty',
      description:
        'Return lateness deduction amount for an employee given minutesLate.',
      parameters: {
        type: 'object',
        properties: {
          employeeId: { type: 'string' },
          minutesLate: { type: 'integer' },
        },
        required: ['employeeId', 'minutesLate'],
      },
    },
  },
];

const runDemo = async (question: string, employeeId = 'E123') => {
  // Step 1: send the user question
  const resp = await openai.chat.completions.create({
    model: 'qwen-plus',
    messages: [
      {
        role: 'system',
        content:
          "You are the company's HR assistant. " +
          'If a question requires a rule or fact, call a tool. ' +
          'Always explain your final answer clearly.',
      },
      { role: 'user', content: question },
    ],
    tools: tools,
    tool_choice: 'auto',
  });

  const choice = resp.choices?.[0];
  const call = choice?.message?.tool_calls?.[0];

  // Step 2: if the model decided to call a tool, run it locally
  let finalAnswer;
  if (call && call.type === 'function') {
    const args = JSON.parse(call.function.arguments || '{}');
    let result;
    if (call.function.name === 'getCompanyFact') {
      result = getCompanyFact(args);
    } else if (call.function.name === 'getLatePenalty') {
      result = getLatePenalty({
        employeeId,
        minutesLate: args.minutesLate,
      });
    }

    // Step 3: send the tool result back for the natural-language answer
    const follow = await openai.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: "You are the company's HR assistant." },
        { role: 'user', content: question },
        { role: 'assistant', tool_calls: [call] },
        {
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        },
      ],
    });

    finalAnswer = follow.choices?.[0]?.message?.content;
  } else {
    // model answered directly (no tool)
    finalAnswer = choice?.message?.content;
  }

  console.log('Q:', question);
  console.log('A:', finalAnswer);
};

runDemo('我的工号是E123 如果我10分钟迟到 会扣多少钱');
