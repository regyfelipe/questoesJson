async function loadQuestions() {
    try {
        const response = await fetch('questoes.json');
        const data = await response.json();
        // console.log(data)
        return data; // Retorna o array de questões carregadas do JSON

    } catch (error) {
        console.error('Erro ao carregar as questões:', error);
        return []; // Retorna um array vazio em caso de erro
    }
}
function processQuestionText(questionText, questionId) {
    const lines = questionText.split('\n');
    const processedLines = [];
    let enunciadoStarted = false;
    let alternativasStarted = false;

    lines.forEach(line => {
        if (line.startsWith('Banca do Concurso:')) {
            processedLines.push(`<h6>${line}</h6>`);
        } else if (line.match(/^(?:\*\*)?Enunciado(?: da questão)?:?(?:\*\*)?/i)) {
            enunciadoStarted = true;
            processedLines.push(`<div>${line.replace(/^(?:\*\*)?Enunciado(?: da questão)?:?(?:\*\*)?/i, '')}</div>`);
        } else if (enunciadoStarted && !alternativasStarted && line.trim() !== '') {
            processedLines.push(`<h5>${line}</h5>`);
            alternativasStarted = true;
        } else if (alternativasStarted && line.trim() !== '' && line.trim().startsWith('(')) {
            // Verifica se a linha começa com uma letra dentro de parênteses
            const alternativeMatch = line.trim().match(/^\(([A-D])\)/);
            if (alternativeMatch) {
                // Se corresponder, adiciona apenas o texto após a letra dentro do parêntese
                const alternativeText = line.trim().replace(/^\([A-D]\)/, '');
                processedLines.push(`
                    <div class="form-check">
                        <input class="form-check-input radio-input" type="radio" name="alternativa-${questionId}" id="alternativa-${questionId}-${alternativeMatch[1]}" value="${alternativeMatch[1]}">
                        <label class="form-check-label radio-label" for="alternativa-${questionId}-${alternativeMatch[1]}">
                        <div class="radio-custom" data-text="${alternativeMatch[1]}"></div>
                        ${alternativeText}</label>
                    </div>
                `);
            } else {
                // Se não corresponder, adiciona a linha como está
                processedLines.push(`
                    <div class="form-check">
                        <input class="form-check-input radio-input" type="radio" name="alternativa-${questionId}" id="alternativa-${questionId}-${line.trim().charAt(1)}" value="${line.trim().charAt(1)}">
                        <label class="form-check-label radio-label" for="alternativa-${questionId}-${line.trim().charAt(1)}">
                        <div class="radio-custom" data-text="${line.trim().charAt(1)}"></div>
                        ${line}</label>
                    </div>
                `);
            }
        } else if (line.startsWith('RESPOSTA:')) {
            processedLines.push(`<div style="display: none;" class="resposta-correta">${line}</div>`);
            // console.log(line)

        } else if (line.startsWith('RESOLUÇÃO:')) {
            processedLines.push(`<div style="display: none;" class="resolucao">${line}</div>`);
            // console.log(line)
        }
    });


    return processedLines.join('');
}


let allQuestions = []; // Variável global para armazenar todas as questões

async function initializeQuiz() {
    try {
        allQuestions = await loadQuestions();

        const disciplinaSelect = document.getElementById('disciplinaSelect');
        const assuntoSelect = document.getElementById('assuntoSelect');
        const cargoSelect = document.getElementById('cargoSelect');

        // Carregar todas as disciplinas disponíveis
        let disciplinas = new Set();
        allQuestions.forEach(questionData => {
            const firstLine = questionData.filtro.Alternativas[0];
            const disciplinaMatch = firstLine.match(/Disciplina: ([^-]+) - Assunto:/);
            if (disciplinaMatch) disciplinas.add(disciplinaMatch[1].trim());
        });
        disciplinas = Array.from(disciplinas).sort();
        disciplinas.forEach(disciplina => {
            const option = document.createElement('option');
            option.value = disciplina;
            option.textContent = disciplina;
            disciplinaSelect.appendChild(option);
        });

        // Adicionar evento de mudança ao select de disciplina
        disciplinaSelect.addEventListener('change', () => {
            const selectedDisciplina = disciplinaSelect.value;
            updateAssuntosAndCargos(selectedDisciplina);
        });

        // Exibir todas as questões ao inicializar o quiz
        displayAllQuestions();
        document.querySelector('.filtra-questoes').addEventListener('click', function (event) {
            event.preventDefault(); // Evita o comportamento padrão do botão de enviar em um formulário

            updateFilteredQuestions();
        });

    } catch (error) {
        console.error('Erro ao carregar as questões:', error);
    }
}

function updateAssuntosAndCargos(selectedDisciplina) {
    const assuntoSelect = document.getElementById('assuntoSelect');
    const cargoSelect = document.getElementById('cargoSelect');

    // Limpar opções anteriores
    assuntoSelect.innerHTML = '';
    cargoSelect.innerHTML = '';

    // Adicionar opção "Selecione..." manualmente para assunto
    const defaultAssuntoOption = document.createElement('option');
    defaultAssuntoOption.value = '';
    defaultAssuntoOption.textContent = 'Selecione...';
    assuntoSelect.appendChild(defaultAssuntoOption);

    // Adicionar opção "Selecione..." manualmente para cargo
    const defaultCargoOption = document.createElement('option');
    defaultCargoOption.value = '';
    defaultCargoOption.textContent = 'Selecione...';
    cargoSelect.appendChild(defaultCargoOption);

    // Filtrar assuntos e cargos para a disciplina selecionada
    let assuntos = new Set();
    let cargos = new Set();
    allQuestions.forEach(questionData => {
        const firstLine = questionData.filtro.Alternativas[0];
        if (firstLine.includes(`Disciplina: ${selectedDisciplina}`)) {
            const assuntoMatch = firstLine.match(/Assunto: ([^-]+) - Ano:/);
            const cargoMatch = firstLine.match(/Cargo: ([^-]+) - Dificuldade:/);
            if (assuntoMatch) assuntos.add(assuntoMatch[1].trim());
            if (cargoMatch) cargos.add(cargoMatch[1].trim());
        }
    });
    assuntos = Array.from(assuntos).sort();
    cargos = Array.from(cargos).sort();

    // Preencher o select de assunto com as opções extraídas
    assuntos.forEach(assunto => {
        const option = document.createElement('option');
        option.value = assunto;
        option.textContent = assunto;
        assuntoSelect.appendChild(option);
    });

    // Preencher o select de cargo com as opções extraídas
    cargos.forEach(cargo => {
        const option = document.createElement('option');
        option.value = cargo;
        option.textContent = cargo;
        cargoSelect.appendChild(option);
    });

    // Filtrar e exibir questões com base na disciplina selecionada
    filterQuestions(selectedDisciplina, 'Disciplina');
}



function updateFilteredQuestions() {
    const selectedDisciplina = disciplinaSelect.value;
    const selectedAssunto = assuntoSelect.value;
    const selectedCargo = cargoSelect.value;

    const filteredQuestions = allQuestions.filter(questionData => {
        const firstLine = questionData.filtro.Alternativas[0];
        const disciplinaMatch = firstLine.includes(`Disciplina: ${selectedDisciplina}`);
        const assuntoMatch = firstLine.includes(`Assunto: ${selectedAssunto}`);
        const cargoMatch = firstLine.includes(`Cargo: ${selectedCargo}`);

        return disciplinaMatch && assuntoMatch && cargoMatch;
    });

    displayFilteredQuestions(filteredQuestions);
}

function displayFilteredQuestions(filteredQuestions) {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = ''; // Limpar o contêiner de questões

    // Exibir as questões filtradas
    filteredQuestions.forEach(questionData => {
        const questionDiv = document.createElement('div');
        questionDiv.id = 'question-' + questionData.id;
        questionDiv.classList.add('question');

        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'mb-3', 'animate__animated', 'animate__fadeInUp');

        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.classList.add('card-body');

        cardBodyDiv.innerHTML = processQuestionText(questionData.filtro.Alternativas.join('\n'), questionData.id); // Correção aqui: passando o ID da questão

        const submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.classList.add('btn', 'btn-primary', 'mt-3');
        submitButton.textContent = 'Enviar Resposta';
        submitButton.dataset.questionId = questionData.id;
        cardBodyDiv.appendChild(submitButton);

        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'feedback-' + questionData.id;
        feedbackDiv.classList.add('feedback', 'mt-2');
        feedbackDiv.style.display = 'none';
        cardBodyDiv.appendChild(feedbackDiv);

        submitButton.onclick = function () {
            const selectedAnswer = document.querySelector('input[name="alternativa-' + questionData.id + '"]:checked'); // Correção aqui: seleção correta do input
            if (selectedAnswer) {
                submitAnswer(allQuestions, questionData.id, selectedAnswer.value);
            } else {
                console.error('Nenhuma resposta selecionada para a questão:', questionData.id);
            }
        };

        cardDiv.appendChild(cardBodyDiv);
        questionDiv.appendChild(cardDiv);
        quizContainer.appendChild(questionDiv);
    });
}

function displayAllQuestions() {
    // Exibir todas as questões sem filtros
    allQuestions.forEach(questionData => {
        const questionDiv = document.createElement('div');
        questionDiv.id = 'question-' + questionData.id;
        questionDiv.classList.add('question');

        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'mb-3', 'animate__animated', 'animate__fadeInUp');

        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.classList.add('card-body');

        cardBodyDiv.innerHTML = processQuestionText(questionData.filtro.Alternativas.join('\n'), questionData.id); // Correção aqui: passando o ID da questão

        const submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.classList.add('btn', 'btn-primary', 'mt-3');
        submitButton.textContent = 'Enviar Resposta';
        submitButton.dataset.questionId = questionData.id;
        cardBodyDiv.appendChild(submitButton);

        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'feedback-' + questionData.id;
        feedbackDiv.classList.add('feedback', 'mt-2');
        feedbackDiv.style.display = 'none';
        cardBodyDiv.appendChild(feedbackDiv);

        submitButton.onclick = function () {
            const selectedAnswer = document.querySelector('input[name="alternativa-' + questionData.id + '"]:checked'); // Correção aqui: seleção correta do input
            if (selectedAnswer) {
                submitAnswer(allQuestions, questionData.id, selectedAnswer.value);
            } else {
                console.error('Nenhuma resposta selecionada para a questão:', questionData.id);
            }
        };

        cardDiv.appendChild(cardBodyDiv);
        questionDiv.appendChild(cardDiv);
        document.getElementById('quiz-container').appendChild(questionDiv);
    });
}





let correctAnswersCount = 0;
let wrongAnswersCount = 0;

function submitAnswer(questions, questionId, selectedAnswer) {
    const question = questions.find(question => question.id === questionId);
    if (!question) {
        console.error('Questão não encontrada:', questionId);
        return;
    }

    const correctAnswerIndex = question.filtro.Alternativas.findIndex(item => item.startsWith('RESPOSTA:'));
    const correctAnswer = question.filtro.Alternativas[correctAnswerIndex].replace('RESPOSTA: ', '').trim();

    const isCorrect = selectedAnswer === correctAnswer;

    const feedbackElement = document.getElementById('feedback-' + questionId);
    if (feedbackElement) {
        let feedbackMessage = '';
        if (isCorrect) {
            feedbackMessage = '<i class="fas fa-check text-success"></i> Parabéns! Você acertou!';
            feedbackElement.classList.add('correct');
            correctAnswersCount++; // Incrementa o contador de respostas corretas
        } else {
            feedbackMessage = '<i class="fas fa-times text-danger"></i> Você errou! Resposta: ' + correctAnswer;
            feedbackElement.classList.add('incorrect');
            wrongAnswersCount++; // Incrementa o contador de respostas erradas
        }
        feedbackElement.innerHTML = feedbackMessage;
        feedbackElement.style.display = 'block';

        // Verifica se já existe um elemento de resolução antes de adicioná-lo
        if (feedbackElement.parentNode.getElementsByClassName('resolution').length === 0) {
            const resolutionIndex = correctAnswerIndex + 1;
            const resolutionText = question.filtro.Alternativas[resolutionIndex].replace('RESOLUÇÃO: ', '').trim();
            if (resolutionText) {
                const resolutionDiv = document.createElement('div');
                resolutionDiv.classList.add('resolution'); // Adiciona uma classe para identificar a resolução
                resolutionDiv.textContent = resolutionText;
                feedbackElement.parentNode.appendChild(resolutionDiv);
            } else {
                console.error('Resolução da questão não encontrada para:', questionId);
            }
        }
    } else {
        console.error('Elemento de feedback não encontrado para a questão:', questionId);
    }

    updateScoreDisplay(); // Atualiza a exibição dos contadores na interface do usuário
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.innerHTML = `Acertos: ${correctAnswersCount} | Erros: ${wrongAnswersCount}`;
    }
}




function getCorrectAnswer(alternativas) {
    const correctAnswerIndex = alternativas.findIndex(item => item.startsWith('RESPOSTA:'));
    if (correctAnswerIndex !== -1) {
        return alternativas[correctAnswerIndex].replace('RESPOSTA: ', '').trim();
    }
    return 'Resposta correta não encontrada';
}


window.onload = function () {
    initializeQuiz();
};