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
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
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
  console.log(code);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `ONLY GIVE VALID AND PARSIBLE JSON RESPONSE TO BE USED IN TYPESCRIPT. AVOID TELLING ANYTHING ELSE EXCEPT WHAT I WANT AS BELOW:

            As a highly skilled developer proficient in all programming languages, frameworks, SDKs, APIs, architectures, and platforms, perform the following steps:
            
            Step 1: Read and analyze the provided code snippet. Understand the general meaning and the logic behind each line.
            
            Step 2: Decompose the code into distinct methods and parts. For each method/part, prepare an explanation tailored for a beginner developer, ensuring clarity and comprehensibility.
            
            Step 3: Generate a JSON response that includes: (a) A general explanation of the code's purpose and logic, (b) The programming language used in the code, and (c) A detailed breakdown of the code into its component methods, each accompanied by an explanatory note.
            
            The response should be structured as follows:
            
            {
            
            "general_explanation": "[General explanation of the code]",
            "detected_language": "[Programming language of the code]",
            "parts": [
            {
            "explanation": "Explanation of a specific method", 
            "code": [Exact Start line number, Exact End line number]
            },
            ]
            
            }
            
            Step 4 - Check if you put the numbers correctly for the start and end of each part in the JSON before giving it back." +
            ${code},`,
        },
      ],
    });

    const gptResponse = response.data.choices[0].message?.content || "";
    const parsedObject: CodeSnippet = JSON.parse(gptResponse);
    console.log(parsedObject);

    res.json(parsedObject);
  } catch (error) {
    res.status(500).json({ error: "Error processing request" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
