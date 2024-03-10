const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI('AIzaSyDcOM1kl6SwEbAde_zIXSMsHGvfAfz4NZI');

const modelCache = {};

async function generateQuestions(disciplina, assunto, banca, instituicao, ano, cargo, nivel, areaDeFormacao, areaDeAtuacao, dificuldade, numeroDeQuestoes) {
    const cacheKey = `${disciplina}-${assunto}-${banca}-${instituicao}-${ano}-${cargo}-${nivel}-${areaDeFormacao}-${areaDeAtuacao}-${dificuldade}-${numeroDeQuestoes}`;
    if (cacheKey in modelCache) {
        return modelCache[cacheKey];
    }
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Crie ${numeroDeQuestoes} questões de MULTIPLA ESCOLHA com os seguintes critérios:


- Disciplina: ${disciplina},
- Assunto: ${assunto},
- Banca: ${banca},
- Instituição: ${instituicao},
- Ano: ${ano},
- Cargo: ${cargo},
- Nível: ${nivel},
- Área de formação: ${areaDeFormacao},
- Área de atuação: ${areaDeAtuacao},
- Dificuldade: ${dificuldade},
`;


try {
    const result = await model.generateContent(prompt);
    const response = result?.response;

    if (response) {
        const questionsArray = response.text().split('\n').filter(Boolean);
        const questions = [];
        let currentQuestion = null;

        for (const line of questionsArray) {
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

        modelCache[cacheKey] = questions;
        return questions;
    } else {
        throw new Error("Não foi possível obter uma resposta do modelo.");
    }
} catch (error) {
    console.error("Ocorreu um erro ao tentar gerar conteúdo:", error);
    return null;
}
}

async function displayQuestions() {
const disciplina = "Direito Constitucional";
const assunto = "Direitos e Deveres individuais e coletivos";
const banca = "Cebraspe";
const nivel = "Médio";
const instituicao = " ";
const ano = 2024;
const cargo = "Analista em Gestão Municipal";
const areaDeFormacao = "Direito";
const areaDeAtuacao = "Direito Constitucional";
const modalidade = "múltipla escolha";
const dificuldade = "média";
const numeroDeQuestoes = 10;


try {
    let questoes = []; 
    // Verificando se existe um arquivo questoes.json e carregando as questões existentes
    if (fs.existsSync('questoes.json')) {
        const data = fs.readFileSync('questoes.json', 'utf8');
        questoes = JSON.parse(data);
    }


    const perguntas = await generateQuestions(disciplina, assunto, banca, instituicao, ano, cargo, nivel, areaDeFormacao, areaDeAtuacao, dificuldade, numeroDeQuestoes);
    for (let index = 0; index < perguntas.length; index++) {
        const pergunta = perguntas[index];
        const questao = {
            [`QUESTAO ${index + 1}`]: {
                filtro: {
                    "Disciplina": disciplina,
                    "Assunto": assunto,
                    "Banca": banca,
                    "Nível": nivel,
                    "instituição": instituicao,
                    "Ano": ano,
                    "Cargo": cargo,
                    "Formação": areaDeFormacao,
                    "area De Atuacao": areaDeAtuacao,
                    "Modalidade": modalidade,
                    "Dificuldade": dificuldade,
                    "Pergunta": pergunta.question[0].replace("**", ""), 
                    "Alternativas": pergunta.question.slice(1) 
                },
            }
        };
        const informacoesParaRemover = [
            "**Instituição:**",
            "**Ano:**",
            "**Cargo:**",
            "**Nível:**",
            "**Área de formação:**",
            "**Área de atuação:**",
            "**Dificuldade:**"
        ];
        pergunta.question = pergunta.question.filter(item => {
            return informacoesParaRemover.every(info => !item.includes(info));
        });

        console.log(JSON.stringify(questao, null, 2));
        questoes.push(questao);
    }
    
    // Escrevendo todas as questões no arquivo questoes.json
    fs.writeFileSync('questoes.json', JSON.stringify(questoes, null, 2));

} catch (error) {
    console.error(error.message);
}
}

displayQuestions();