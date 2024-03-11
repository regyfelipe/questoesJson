const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI('AIzaSyDcOM1kl6SwEbAde_zIXSMsHGvfAfz4NZI');

const modelCache = {};

async function generateQuestions(disciplina, assunto, banca, instituicao, ano, cargo, nivel, areaDeFormacao, areaDeAtuacao, dificuldade, numeroDeQuestoes, materia, iteracao) {
    const cacheKey = `${disciplina}-${assunto}-${banca}-${instituicao}-${ano}-${cargo}-${nivel}-${areaDeFormacao}-${areaDeAtuacao}-${dificuldade}-${numeroDeQuestoes}-${materia}-${iteracao}`;
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
- Materia: ${materia},

Para cada questão, inclua obrigatoriamente:
+ Informação : Banca do Consurso:  - Disciplina: - Assunto:  - Ano:  - Cargo:  - Dificuldade:  
+ Enunciado da questão :
+ Alternativas DENTRO DE () COM LETRA MAIÚSCULA:
+ Resposta correta: ,
+ Resolução da questão: .

seguindo o seguinte exemplo:
Banca do Concurso: IBGE - Disciplina: Estatística - Assunto: Gráficos e tabelas - Ano: 2015 - Cargo: POLICIAL - Dificuldade: Fácil",
Enunciado da questão:
"Qual dos seguintes gráficos é mais adequado para representar dados de frequência?"

"A) Gráfico de linhas"
"B) Gráfico de barras"
"C) Gráfico de pizza"
"D) Gráfico de dispersão"
RESPOSTA: A
RESOLUÇÃO: 

OBRIGATÓRIO: NÃO PODE REPETIR PERGUNTA.
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
                        // Remove os '**' das linhas introdutórias
                        currentQuestion.intro = currentQuestion.intro.map(line => line.replace(/^\*\*/, ''));
                        questions.push(currentQuestion);
                    }
                    currentQuestion = { intro: [], question: [] };
                    currentQuestion.intro.push(line);
                } else if (line.startsWith("**RESPOSTA:")) {
                    // Remove os '**' da linha de resposta
                    let formattedLine = line.replace(/^\*\*/, '');
                    // Verifica se a linha é uma única alternativa, e se for, formata-a
                    if (/^\([A-Z]\)$/.test(formattedLine)) {
                        formattedLine = formattedLine.replace(/^\((.*?)\)$/, '$1)');
                    }
                    currentQuestion.question.push(formattedLine);
                } else {
                    currentQuestion.question.push(line);
                }
            }
            
            
            

            if (currentQuestion !== null) {
                currentQuestion.intro = currentQuestion.intro.map(line => line.replace(/^\*\*/, ''));
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



async function displayQuestionsLoop() {
    let iteracao = 0;
    while (true) {
        const disciplina = "";
        const assunto = "";
        const banca = "";
        const nivel = " ";
        const instituicao = " ";
        const ano = "";
        const cargo = "";
        const areaDeFormacao = "";
        const areaDeAtuacao = "";
        const modalidade = "múltipla escolha";
        const dificuldade = "";
        const materia = "";
        const numeroDeQuestoes = 10;

        const questoes = [];

        try {
            const perguntas = await generateQuestions(disciplina, assunto, banca, instituicao, ano, cargo, nivel, areaDeFormacao, areaDeAtuacao, dificuldade, numeroDeQuestoes,materia, iteracao);

            let questoesExistentes = [];
            try {
                const data = fs.readFileSync('questoes.json', 'utf8');
                questoesExistentes = JSON.parse(data);
            } catch (err) {
                console.error('Erro ao ler o arquivo questoes.json:', err);
            }

            const questoesExistentesCount = questoesExistentes.length;

            for (let index = 0; index < perguntas.length; index++) {
                const pergunta = perguntas[index];
                const questaoId = questoesExistentesCount + index + 1;
                const questao = {
                    id: questaoId,
                    filtro: {

                        "Alternativas": pergunta.question,

                    }
                };
                
            
                console.log(JSON.stringify(questao, null, 2));
                questoes.push(questao);
            }
            

            fs.writeFileSync('questoes.json', JSON.stringify([...questoesExistentes, ...questoes], null, 2));

        } catch (error) {
            console.error(error.message);
        }
        iteracao++;

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

displayQuestionsLoop().catch(console.error);






