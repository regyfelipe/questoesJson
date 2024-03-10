const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI('AIzaSyDcOM1kl6SwEbAde_zIXSMsHGvfAfz4NZI');

const modelCache = {};

async function generateQuestions(disciplina, assunto, banca, instituicao, ano, cargo, nivel, areaDeFormacao, areaDeAtuacao, dificuldade, numeroDeQuestoes, iteracao) {
    const cacheKey = `${disciplina}-${assunto}-${banca}-${instituicao}-${ano}-${cargo}-${nivel}-${areaDeFormacao}-${areaDeAtuacao}-${dificuldade}-${numeroDeQuestoes}-${iteracao}`;
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
+ Resultado e Resolução da QUESTAO CRIADA,
OBRIGATORIO = NAO PODE REPETIR PERGUNTA.
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


async function displayQuestionsLoop() {
    let iteracao = 0;
    while (true) {
        const disciplina = "";
        const assunto = "";
        const banca = "Cebraspe";
        const nivel = " ";
        const instituicao = " ";
        const ano = "";
        const cargo = "";
        const areaDeFormacao = "";
        const areaDeAtuacao = "POLICIA FEDERAL";
        const modalidade = "múltipla escolha";
        const dificuldade = "";
        const numeroDeQuestoes = 10;

        const questoes = [];

        try {
            const perguntas = await generateQuestions(disciplina, assunto, banca, instituicao, ano, cargo, nivel, areaDeFormacao, areaDeAtuacao, dificuldade, numeroDeQuestoes, iteracao);

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
                        "Disciplina": disciplina,
                        "Assunto": assunto,
                        "Banca": banca,
                        "Nível": nivel,
                        "Instituição": instituicao,
                        "Ano": ano,
                        "Cargo": cargo,
                        "Formação": areaDeFormacao,
                        "Área de Atuação": areaDeAtuacao,
                        "Modalidade": modalidade,
                        "Dificuldade": dificuldade,
                        "Pergunta": pergunta.question[0].replace("**", ""),
                        "Alternativas": pergunta.question.slice(1)
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

        // Aguarda 1 segundo antes de gerar as próximas questões
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

displayQuestionsLoop().catch(console.error);







// async function displayQuestions() {
//     const disciplina = "Direito Constitucional";
//     const assunto = "";
//     const banca = "Cebraspe";
//     const nivel = " ";
//     const instituicao = " ";
//     const ano = "";
//     const cargo = "";
//     const areaDeFormacao = "Direito";
//     const areaDeAtuacao = "POLICIA FEDERAL";
//     const modalidade = "múltipla escolha";
//     const dificuldade = "";
//     const numeroDeQuestoes = 10;


//     const questoes = [];

//     try {
//         const perguntas = await generateQuestions(disciplina, assunto, banca, instituicao, ano, cargo, nivel, areaDeFormacao, areaDeAtuacao, dificuldade, numeroDeQuestoes);
        
//         let questoesExistentes = [];
//         try {
//             const data = fs.readFileSync('questoes.json', 'utf8');
//             questoesExistentes = JSON.parse(data);
//         } catch (err) {
//             console.error('Erro ao ler o arquivo questoes.json:', err);
//         }
        
//         const questoesExistentesCount = questoesExistentes.length;

//         for (let index = 0; index < perguntas.length; index++) {
//             const pergunta = perguntas[index];
//             const questaoId = questoesExistentesCount + index + 1; 
//             const questao = {
//                 id: questaoId, 
//                 filtro: {
//                     "Disciplina": disciplina,
//                     "Assunto": assunto,
//                     "Banca": banca,
//                     "Nível": nivel,
//                     "Instituição": instituicao,
//                     "Ano": ano,
//                     "Cargo": cargo,
//                     "Formação": areaDeFormacao,
//                     "Área de Atuação": areaDeAtuacao,
//                     "Modalidade": modalidade,
//                     "Dificuldade": dificuldade,
//                     "Pergunta": pergunta.question[0].replace("**", ""),
//                     "Alternativas": pergunta.question.slice(1)
                    
//                 }
//             };
//             const informacoesParaRemover = [
//                 "**Instituição:**",
//                 "**Ano:**",
//                 "**Cargo:**",
//                 "**Nível:**",
//                 "**Área de formação:**",
//                 "**Área de atuação:**",
//                 "**Dificuldade:**"
//             ];
//             pergunta.question = pergunta.question.filter(item => {
//                 return informacoesParaRemover.every(info => !item.includes(info));
//             });

//             console.log(JSON.stringify(questao, null, 2));
//             questoes.push(questao);
//         }

//         fs.writeFileSync('questoes.json', JSON.stringify([...questoesExistentes, ...questoes], null, 2));

//     } catch (error) {
//         console.error(error.message);
//     }
// }
// async function executeWithRetry() {
//     const maxAttempts = 3; 
//     let currentAttempt = 1;

//     while (currentAttempt <= maxAttempts) {
//         try {
//             await displayQuestions(); 
//             break; 
//         } catch (error) {
//             console.error(`Erro na tentativa ${currentAttempt}: ${error.message}`);
//             currentAttempt++; 
//         }
//     }

//     if (currentAttempt > maxAttempts) {
//         console.error(`Número máximo de tentativas (${maxAttempts}) atingido. Não foi possível concluir a operação.`);
//     }
// }

// executeWithRetry();
