const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI('AIzaSyDcOM1kl6SwEbAde_zIXSMsHGvfAfz4NZI');

async function generateQuestions(disciplina, assunto, nivel, banca, ano, cargo, formacao, atuacao, modalidade, dificuldade, numberOfQuestions) {
    try {
        const prompt = await formatPrompt(disciplina, assunto, nivel, banca, ano, cargo, formacao, atuacao, modalidade, dificuldade, numberOfQuestions);

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = result?.response;

        if (!response) {
            throw new Error("Não foi possível obter uma resposta do modelo.");
        }

        const questionsArray = response.text().split('\n').filter(Boolean);
        const questions = [];
        let currentQuestion = null;

        for (let i = 0; i < questionsArray.length; i++) {
            const line = questionsArray[i];

            if (line.startsWith("**Questão ")) {
                if (currentQuestion !== null) {
                    questions.push(currentQuestion);
                }
                currentQuestion = { intro: [], question: [] };
                currentQuestion.intro.push(line);
            } else {
                currentQuestion.question.push(line);
            }
        }

        if (currentQuestion !== null) {
            questions.push(currentQuestion);
        }

        return questions;
    } catch (error) {
        console.error("Ocorreu um erro ao tentar gerar conteúdo:", error);
        return null;
    }
}


module.exports = { generateResponse };
