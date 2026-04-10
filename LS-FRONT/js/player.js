const mini_player = document.getElementById("mini-player");
const mini_player_icone = document.getElementById("mini-player-icone");
const musica_pause = document.getElementById("musica-pause");
const volume_controle = document.getElementById("volume-controle");
const volume_valor = document.getElementById("volume-valor");
const volume_icone = document.getElementById("volume-icone");
const pontinhos_deco = document.querySelector(".pontinhos_deco");

const audio = new Audio();
audio.volume = 0.1;
const caminho_audio_base = window.location.pathname.includes("/pages/") ? "../audio/" : "audio/";
const chave_player_estado = "player_estado";
let intervalo_salvar = null;

const musicas = [
    caminho_audio_base + "lofi-1.mp3",
    caminho_audio_base + "lofi-2.mp3",
    caminho_audio_base + "lofi-3.mp3",
    caminho_audio_base + "lofi-4.mp3",
    caminho_audio_base + "lofi-5.mp3"
];

function tocar_aleatoria() {
    const indice = Math.floor(Math.random() * musicas.length);
    audio.src = musicas[indice];
    audio.play().catch(() => {});
}

function salvar_estado_player() {
    const estado = {
        src: audio.src || "",
        currentTime: audio.currentTime || 0,
        volume: audio.volume,
        paused: audio.paused,
        aberto: mini_player.classList.contains("aberto")
    };

    localStorage.setItem(chave_player_estado, JSON.stringify(estado));
}

function atualizar_ui_volume(valor) {
    volume_controle.value = String(valor);
    volume_valor.textContent = valor + "%";
    volume_controle.style.background = `linear-gradient(to right, #88412a 0%, #88412a ${valor}%, rgba(64,35,25,0.2) ${valor}%)`;

    if (valor == 0) {
        volume_icone.textContent = "volume_off";
    } else if (valor < 50) {
        volume_icone.textContent = "volume_down";
    } else {
        volume_icone.textContent = "volume_up";
    }
}

function restaurar_estado_player() {
    const estado_bruto = localStorage.getItem(chave_player_estado);
    if (!estado_bruto) {
        atualizar_ui_volume(10);
        return;
    }

    try {
        const estado = JSON.parse(estado_bruto);
        const volume = Math.max(0, Math.min(100, Math.round((estado.volume ?? 0.1) * 100)));

        audio.volume = volume / 100;
        atualizar_ui_volume(volume);

        if (estado.src) {
            audio.src = estado.src;
        }

        if (estado.aberto) {
            mini_player.classList.add("aberto");
        }

        if (estado.paused) {
            musica_pause.textContent = "play_arrow";
            pontinhos_deco.classList.add("pausado");
        } else if (estado.src) {
            musica_pause.textContent = "pause";
            pontinhos_deco.classList.remove("pausado");

            audio.addEventListener("loadedmetadata", function restaurar_tempo() {
                audio.currentTime = Math.max(0, estado.currentTime || 0);
                audio.removeEventListener("loadedmetadata", restaurar_tempo);
                audio.play().catch(() => {
                    musica_pause.textContent = "play_arrow";
                    pontinhos_deco.classList.add("pausado");
                });
            });
        }
    } catch {
        atualizar_ui_volume(10);
    }
}

mini_player_icone.addEventListener("click", function(evento) {
    evento.stopPropagation();
    mini_player.classList.toggle("aberto");
    if (audio.paused && musica_pause.textContent == "pause") {
        tocar_aleatoria();
        pontinhos_deco.classList.remove("pausado");
    }
    salvar_estado_player();
});

audio.addEventListener("ended", function() {
    tocar_aleatoria();
    salvar_estado_player();
});

musica_pause.addEventListener("click", function(evento) {
    evento.stopPropagation();
    if (audio.paused) {
        audio.play().catch(() => {});
        musica_pause.textContent = "pause";
        pontinhos_deco.classList.remove("pausado");
    } else {
        audio.pause();
        musica_pause.textContent = "play_arrow";
        pontinhos_deco.classList.add("pausado");
    }
    salvar_estado_player();
});

volume_icone.addEventListener("click", function(evento) {
    evento.stopPropagation();
    if (audio.volume > 0) {
        audio.volume = 0;
        atualizar_ui_volume(0);
    } else {
        audio.volume = 0.1;
        atualizar_ui_volume(10);
    }
    salvar_estado_player();
});

volume_controle.addEventListener("input", function(evento) {
    evento.stopPropagation();
    const valor = volume_controle.value;
    audio.volume = valor / 100;
    atualizar_ui_volume(Number(valor));
    salvar_estado_player();
});

intervalo_salvar = setInterval(salvar_estado_player, 1000);
window.addEventListener("beforeunload", () => {
    salvar_estado_player();
    clearInterval(intervalo_salvar);
});

restaurar_estado_player();