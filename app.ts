import dotenv from "dotenv";
dotenv.config();

import express from "express";

const app = express();
app.use(express.json());

import cors from "cors";
app.use(cors());

const PORT = process.env.PORT || 5000;

import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";
const configuration = new Configuration({ 
  organization: process.env.OPENAI_ORGANIZATION_ID,
  apiKey: process.env.OPENAI_API_KEY 
});
const openai = new OpenAIApi(configuration);

app.get("/", (req, res) => {
  res.send("Hello Maher!");
});

interface CodeSnippet {
  general_explanation: string;
  detected_language: string;
  parts: Array<{
    explanation: string;
    code: number[];
  }>;
}

app.post("/analyze-code", async (req, res) => {
  const { code } = req.body;

  // Function to prefix each line with its line number
  const prefixLinesWithNumbers = (codeArray: string[]): string[] => {
    return codeArray.map((line, index) => `${index + 1}: ${line}`);
  };
  
  // Prefixing each line of the code with its corresponding number
  const numberedCode = prefixLinesWithNumbers(code.split('\n')).join('\n');
  console.log(numberedCode);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `ONLY GIVE VALID AND PARSIBLE JSON RESPONSE TO BE USED IN TYPESCRIPT. AVOID TELLING ANYTHING ELSE EXCEPT WHAT I WANT AS BELOW:

            As a senior developer, do the following:
            
            Step 1: Read the following code.

            Step 2: Understand the logic behind each line of the code.
            
            The response should be structured as follows:
            
            {
            
            "explanation": "[explanation of the code]",
            "detected_language": "Programming language of the code",
            "parts": [
            {
            "title": "TITLE OF THE PART", 
            "code": [Exact Start line number, Exact End line number]
            },
            ]
            
            }
            +
            ${numberedCode},`,
        },
      ],
    });

    const gptResponse = response.data.choices[0].message?.content || "";
    const parsedObject: CodeSnippet = JSON.parse(gptResponse);
    console.log(parsedObject);

    res.json(parsedObject);
  } catch (error) {
    // print the error details
    console.log(error);
    res.status(500).json({ error: "Error processing request"});
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
