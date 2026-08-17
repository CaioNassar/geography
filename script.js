const inputPais = document.getElementById('input-pais');
const btnComecar = document.getElementById('btn-comecar');
const divTempo = document.getElementById('tempo');
const listasContainer = document.getElementById('listas-container');
const tooltip = document.getElementById('tooltip');
const mapaSvg = document.querySelector('svg');
const divContador = document.getElementById('contador');

let acertos = [];
let tempoRestante = 20 * 60; 
let intervaloDeTempo;
let jogoRodando = false;
let jogoFinalizado = false; // Controle para o tooltip funcionar só no fim

function renderizarListas() {
    listasContainer.innerHTML = ''; 
    const continentes = [...new Set(territorios.map(t => t.continente))].sort();

    continentes.forEach(continente => {
        const paisesDoContinente = territorios
            .filter(t => t.continente === continente)
            .sort((a, b) => a.nomeOficial.localeCompare(b.nomeOficial));

        const divColuna = document.createElement('div');
        divColuna.className = 'continente-coluna';

        const divHeader = document.createElement('div');
        divHeader.className = 'continente-header';
        divHeader.textContent = continente;
        divColuna.appendChild(divHeader);

        paisesDoContinente.forEach(pais => {
            const divPais = document.createElement('div');
            divPais.className = 'pais-item';
            divPais.id = `lista-${pais.id}`;
            
            // Cria a imagem da bandeira
            const imgBandeira = document.createElement('img');
            imgBandeira.src = pais.bandeiraUrl;
            imgBandeira.className = 'bandeira-lista';
            
            // Cria o texto do país
            const spanNome = document.createElement('span');
            spanNome.textContent = pais.nomeOficial;
            
            divPais.appendChild(imgBandeira);
            divPais.appendChild(spanNome);
            divColuna.appendChild(divPais);
        });

        listasContainer.appendChild(divColuna);
    });
}

function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function atualizarPlacar() {
    divContador.textContent = `${acertos.length} / ${territorios.length}`;
}

function atualizarTelaTempo() {
    const minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;
    if (segundos < 10) segundos = '0' + segundos;
    divTempo.textContent = `${minutos}:${segundos}`;
}

function finalizarJogo() {
    clearInterval(intervaloDeTempo);
    jogoRodando = false;
    mapaSvg.classList.add('mapa-livre'); // Libera o cursor: pointer no mapa
    
    inputPais.disabled = true;
    btnComecar.textContent = "Jogar Novamente"; 
    
    territorios.forEach(pais => {
        if (!acertos.includes(pais.id)) {
            const pathNoMapa = document.getElementById(pais.id);
            if (pathNoMapa) pathNoMapa.classList.add('errou');
            
            const itemNaLista = document.getElementById(`lista-${pais.id}`);
            if (itemNaLista) itemNaLista.classList.add('nao-adivinhado');
        }
    });

    setTimeout(() => {
        if (acertos.length === territorios.length) {
            alert("Parabéns! Você adivinhou todos os países!");
        } else {
            alert(`Fim de jogo! Você acertou ${acertos.length} de ${territorios.length} países.`);
        }
    }, 100);
}

btnComecar.addEventListener('click', () => {
    if (jogoRodando) {
        finalizarJogo();
        return;
    }

    jogoRodando = true;
    acertos = []; 
    atualizarPlacar();

    mapaSvg.classList.remove('mapa-livre');
    tooltip.classList.add('escondido');
    
    document.querySelectorAll('.acertou').forEach(el => el.classList.remove('acertou'));
    document.querySelectorAll('.errou').forEach(el => el.classList.remove('errou'));
    document.querySelectorAll('.adivinhado').forEach(el => el.classList.remove('adivinhado'));
    document.querySelectorAll('.nao-adivinhado').forEach(el => el.classList.remove('nao-adivinhado'));

    inputPais.disabled = false;
    inputPais.value = '';
    inputPais.focus();
    btnComecar.textContent = "Desistir";

    tempoRestante = 20 * 60;
    atualizarTelaTempo();

    intervaloDeTempo = setInterval(() => {
        tempoRestante--;
        atualizarTelaTempo();
        if (tempoRestante <= 0) finalizarJogo();
    }, 1000);
});

inputPais.addEventListener('input', (e) => {
    if (!jogoRodando) return;
    
    const digitado = normalizarTexto(e.target.value);

    territorios.forEach(pais => {
        if (!acertos.includes(pais.id) && pais.aliases.includes(digitado)) {
            
            const pathNoMapa = document.getElementById(pais.id);
            if (pathNoMapa) pathNoMapa.classList.add('acertou');

            const itemNaLista = document.getElementById(`lista-${pais.id}`);
            if (itemNaLista) itemNaLista.classList.add('adivinhado');

            acertos.push(pais.id);
            atualizarPlacar();
            inputPais.value = ''; 

            if (acertos.length === territorios.length) {
                finalizarJogo();
            }
        }
    });
});

// --- LÓGICA DO TOOLTIP NO MAPA ---
// --- LÓGICA DO TOOLTIP NO MAPA ---

// 1. Remove as tags <title> nativas do mapa para matar a caixinha preta do navegador
document.querySelectorAll('svg title').forEach(titulo => titulo.remove());

// 2. Ouve o movimento do mouse no SVG inteiro (capturando paths, circles e polygons)
mapaSvg.addEventListener('mousemove', (e) => {
    if (jogoRodando) return; 
    
    let paisInfo = null;
    let elementoAtual = e.target;

    // Se o mouse estiver no fundo azul ou no próprio tooltip, esconde a caixa
    if (elementoAtual.tagName === 'svg' || elementoAtual.closest('#tooltip')) {
        tooltip.classList.add('escondido');
        return;
    }

    // Sobe na estrutura das "pastas" do SVG até achar um ID da nossa lista
    while (elementoAtual && elementoAtual.tagName !== 'svg') {
        paisInfo = territorios.find(t => t.id === elementoAtual.id);
        if (paisInfo) break; // Achou o país!
        elementoAtual = elementoAtual.parentNode; 
    }
    
    if (paisInfo) {
            const linhaFato = paisInfo.fato ? `<br><b>Fato:</b> ${paisInfo.fato}` : '';

            tooltip.innerHTML = `
                <img src="${paisInfo.bandeiraUrl}" alt="Bandeira de ${paisInfo.nomeOficial}">
                <strong>${paisInfo.nomeOficial}</strong>
                <b>Capital:</b> ${paisInfo.capital}<br>
                <b>População:</b> ${paisInfo.populacao}<br>
                <b>Área:</b> ${paisInfo.area}
                ${linhaFato}
            `;
            tooltip.classList.remove('escondido');
            
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY + 15) + 'px';
    } else {
        tooltip.classList.add('escondido');
    }
});

mapaSvg.addEventListener('mouseout', (e) => {
    // Garante que o tooltip suma se o mouse sair do mapa
    if (!mapaSvg.contains(e.relatedTarget)) {
        tooltip.classList.add('escondido');
    }
});

renderizarListas();
mapaSvg.classList.add('mapa-livre');
atualizarPlacar();
// --- LÓGICA DE ZOOM E NAVEGAÇÃO (PAN) ---
let nivelZoom = 0; 
const escalasZoom = [1, 4, 8, 16]; 
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;

function atualizarTransform() {
    mapaSvg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${escalasZoom[nivelZoom]})`;
}

// 1. Roda do Mouse (Zoom)
mapaSvg.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.target.closest('#tooltip')) return;

    if (nivelZoom === 0 && e.deltaY < 0) {
        const rect = mapaSvg.getBoundingClientRect();
        const xPos = e.clientX - rect.left;
        const yPos = e.clientY - rect.top;
        const xPercent = (xPos / rect.width) * 100;
        const yPercent = (yPos / rect.height) * 100;
        mapaSvg.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    }

    if (e.deltaY < 0) {
        if (nivelZoom < 3) nivelZoom++;
    } else {
        if (nivelZoom > 0) nivelZoom--;
    }

    // Se tirar todo o zoom, reseta a posição arrastada para o centro
    if (nivelZoom === 0) {
        translateX = 0;
        translateY = 0;
    }

    atualizarTransform();

}, { passive: false });

// 2. Segurar o clique (Inicia o arraste)
mapaSvg.addEventListener('mousedown', (e) => {
    if (nivelZoom > 0) {
        e.preventDefault(); // Evita que o navegador tente "selecionar" o mapa como imagem
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    }
});

// 3. Mover o mouse (Arrasta o mapa)
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    atualizarTransform();
});

// 4. Soltar o clique (Para o arraste)
window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
    }
});