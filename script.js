async function loadQuestions() {
    try {
        const response = await fetch('questoes.json');
        const data = await response.json();
        // console.log(data)
        return data; 
    } catch (error) {
        console.error('Erro ao carregar as questões:', error);
        return []; 
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
            const alternativeMatch = line.trim().match(/^\(([A-D])\)/);
            if (alternativeMatch) {
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

let allQuestions = []; 

async function initializeQuiz() {
    try {
        allQuestions = await loadQuestions();
        const disciplinaSelect = document.getElementById('disciplinaSelect');
        const assuntoSelect = document.getElementById('assuntoSelect');
        const cargoSelect = document.getElementById('cargoSelect');
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

        disciplinaSelect.addEventListener('change', () => {
            const selectedDisciplina = disciplinaSelect.value;
            updateAssuntosAndCargos(selectedDisciplina);
        });
        displayAllQuestions();
        document.querySelector('.filtra-questoes').addEventListener('click', function (event) {
            event.preventDefault(); 

            updateFilteredQuestions();
        });
    } catch (error) {
        console.error('Erro ao carregar as questões:', error);
    }
}

function updateAssuntosAndCargos(selectedDisciplina) {
    const assuntoSelect = document.getElementById('assuntoSelect');
    const cargoSelect = document.getElementById('cargoSelect');

    assuntoSelect.innerHTML = '';
    cargoSelect.innerHTML = '';

    const defaultAssuntoOption = document.createElement('option');
    defaultAssuntoOption.value = '';
    defaultAssuntoOption.textContent = 'Selecione...';
    assuntoSelect.appendChild(defaultAssuntoOption);

    const defaultCargoOption = document.createElement('option');
    defaultCargoOption.value = '';
    defaultCargoOption.textContent = 'Selecione...';
    cargoSelect.appendChild(defaultCargoOption);

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

    assuntos.forEach(assunto => {
        const option = document.createElement('option');
        option.value = assunto;
        option.textContent = assunto;
        assuntoSelect.appendChild(option);
    });

    cargos.forEach(cargo => {
        const option = document.createElement('option');
        option.value = cargo;
        option.textContent = cargo;
        cargoSelect.appendChild(option);
    });
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
    quizContainer.innerHTML = ''; 
    filteredQuestions.forEach(questionData => {
        const questionDiv = document.createElement('div');
        questionDiv.id = 'question-' + questionData.id;
        questionDiv.classList.add('question');

        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'mb-3', 'animate__animated', 'animate__fadeInUp');

        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.classList.add('card-body');

        cardBodyDiv.innerHTML = processQuestionText(questionData.filtro.Alternativas.join('\n'), questionData.id); 

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
            const selectedAnswer = document.querySelector('input[name="alternativa-' + questionData.id + '"]:checked'); 
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

let currentQuestionIndex = 0;

function displayAllQuestions() {
    const questionsPerPage = 100;
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = ''; 
    displayQuestionsInRange(currentQuestionIndex, currentQuestionIndex + questionsPerPage);
    currentQuestionIndex += questionsPerPage;

    function addMoreQuestions() {
        quizContainer.innerHTML = '';
        displayQuestionsInRange(currentQuestionIndex, currentQuestionIndex + questionsPerPage);
        currentQuestionIndex += questionsPerPage;
        window.scrollTo({
            top: 0,
            behavior: 'smooth' 
        });
        if (currentQuestionIndex < allQuestions.length) {
            addMoreQuestionsButton();
        }
    }

    function addMoreQuestionsButton() {
        const maisQuestoesButton = document.createElement('button');
        maisQuestoesButton.type = 'button';
        maisQuestoesButton.classList.add('btn', 'btn-primary', 'btn-custom', 'mais-questoes');
        maisQuestoesButton.textContent = 'Mais Questões';
        maisQuestoesButton.onclick = addMoreQuestions;
        quizContainer.appendChild(maisQuestoesButton);
    }

    addMoreQuestionsButton();
    window.scrollTo({
        top: 0,
        behavior: 'smooth' 
    });
}

function displayQuestionsInRange(startIndex, endIndex) {
    for (let i = startIndex; i < endIndex && i < allQuestions.length; i++) {
        const questionData = allQuestions[i];

        const questionDiv = document.createElement('div');
        questionDiv.id = 'question-' + questionData.id;
        questionDiv.classList.add('question');

        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'mb-3', 'animate__animated', 'animate__fadeInUp');

        const cardBodyDiv = document.createElement('div');
        cardBodyDiv.classList.add('card-body');
        cardBodyDiv.innerHTML = processQuestionText(questionData.filtro.Alternativas.join('\n'), questionData.id); 

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
            const selectedAnswer = document.querySelector('input[name="alternativa-' + questionData.id + '"]:checked'); 
            if (selectedAnswer) {
                submitAnswer(allQuestions, questionData.id, selectedAnswer.value);
            } else {
                console.error('Nenhuma resposta selecionada para a questão:', questionData.id);
            }
        };

        cardDiv.appendChild(cardBodyDiv);
        questionDiv.appendChild(cardDiv);
        document.getElementById('quiz-container').appendChild(questionDiv);
    }
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
            correctAnswersCount++; 
        } else {
            feedbackMessage = '<i class="fas fa-times text-danger"></i> Você errou! Resposta: ' + correctAnswer;
            feedbackElement.classList.add('incorrect');
            wrongAnswersCount++; 
        }
        feedbackElement.innerHTML = feedbackMessage;
        feedbackElement.style.display = 'block';

        if (feedbackElement.parentNode.getElementsByClassName('resolution').length === 0) {
            const resolutionIndex = correctAnswerIndex + 1;
            const resolutionText = question.filtro.Alternativas[resolutionIndex].replace('RESOLUÇÃO: ', '').trim();
            if (resolutionText) {
                const resolutionDiv = document.createElement('div');
                resolutionDiv.classList.add('resolution'); 
                resolutionDiv.textContent = resolutionText;
                feedbackElement.parentNode.appendChild(resolutionDiv);
            } else {
                console.error('Resolução da questão não encontrada para:', questionId);
            }
        }
    } else {
        console.error('Elemento de feedback não encontrado para a questão:', questionId);
    }

    updateScoreDisplay();
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


