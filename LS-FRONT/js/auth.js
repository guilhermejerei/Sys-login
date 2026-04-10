const email_input = document.getElementById("email-input");
const senha_input = document.getElementById("senha-input");

const usuario_registro = document.getElementById("usuario-registro");
const email_registro = document.getElementById("email-registro");
const senha_registro = document.getElementById("senha-registro");
const rp_senha_registro = document.getElementById("rp-senha-registro");

const icon_lock = document.getElementById("lock");
const rp_icon_lock = document.getElementById("rp-lock");

const error_visual = document.getElementById("erro-notificacao");
const tela_notificacao = document.getElementById("notificacao");

const tela_login = document.getElementById("login");
const tela_registro = document.getElementById("registro");
const tela_inicial = document.getElementById("inicial");

const direcionar_para_registro = document.getElementById("direcionar-registro");
const botao_criar = document.getElementById("botao-criar");
const botao_retorno = document.getElementById("botao-retorno");
const botao_login = document.getElementById("botao-login");
const botao_teste = document.getElementById("botao-teste");

const modal_esqueci = document.getElementById("modal-esqueci");
const email_esqueci = document.getElementById("email-esqueci");
const erro_esqueci = document.getElementById("erro-esqueci");
const botao_enviar_esqueci = document.getElementById("botao-enviar-esqueci");
const fechar_modal = document.getElementById("fechar-modal");
const direcionar_esqueci = document.getElementById("direcionar-esqueci");

tela_notificacao.addEventListener("animationend", () => {
    tela_notificacao.classList.remove("visivel");
});

direcionar_para_registro.addEventListener("click", (e) => {
    e.preventDefault();
    mostrar_tela(tela_registro);
});

botao_retorno.addEventListener("click", (e) => {
    e.preventDefault();
    mostrar_tela(tela_login);
});

icon_lock.addEventListener("click", () => {
    senha_registro.type = senha_registro.type === "password" ? "text" : "password";
    icon_lock.textContent = senha_registro.type === "text" ? "lock_open" : "lock";
});

rp_icon_lock.addEventListener("click", () => {
    rp_senha_registro.type = rp_senha_registro.type === "password" ? "text" : "password";
    rp_icon_lock.textContent = rp_senha_registro.type === "text" ? "lock_open" : "lock";
});


//  REGISTRO
botao_criar.addEventListener("click", async (e) => {
    e.preventDefault();

    let erros = [];

    if (usuario_registro.value.length < 6)
        erros.push("Usuário deve ter no mínimo 6 caracteres");

    if (senha_registro.value.length < 6)
        erros.push("Senha deve ter no mínimo 6 caracteres");

    if (rp_senha_registro.value !== senha_registro.value)
        erros.push("Senhas não correspondem");

    if (!validator.isEmail(email_registro.value))
        erros.push("Email inválido");

    error_visual.textContent = erros.join("\n");
    if (erros.length > 0) return;

    botao_criar.disabled = true;
    botao_criar.textContent = "Criando...";

    try {
        const resposta = await fetch(CONFIG.REGISTRO, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                usuario: usuario_registro.value,
                email: email_registro.value,
                senha: senha_registro.value,
                rp_senha: rp_senha_registro.value
            })
        });

        const data = await resposta.json();

        if (data.erro) {
            error_visual.textContent = data.erro;
            return;
        }

        mostrar_tela(tela_login);

        usuario_registro.value = "";
        email_registro.value = "";
        senha_registro.value = "";
        rp_senha_registro.value = "";

        tela_notificacao.textContent = "Confirme seu email para ativar a conta!";
        tela_notificacao.classList.remove("visivel");
        requestAnimationFrame(() => {
            tela_notificacao.classList.add("visivel");
        });

    } catch {
        error_visual.textContent = "Erro de conexão com servidor.";
    }

    botao_criar.disabled = false;
    botao_criar.textContent = "Criar";
});


//  LOGIN
botao_login.addEventListener("click", async (e) => {
    e.preventDefault();

    botao_login.disabled = true;
    botao_login.textContent = "Entrando...";

    try {
        const resposta = await fetch(CONFIG.LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email: email_input.value,
                senha: senha_input.value
            })
        });

        const contentType = resposta.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await resposta.json()
            : null;

        if (!resposta.ok) {
            error_visual.textContent = (data && data.erro) || "Falha no login. Verifique se a API está rodando na porta 3000.";
            botao_login.disabled = false;
            botao_login.textContent = "Entrar";
            return;
        }

        if (data && data.erro) {
            error_visual.textContent = data.erro;

            botao_login.disabled = false;
            botao_login.textContent = "Entrar";
            return;
        }

        window.location.replace("/LS-FRONT/pages/dashboard.html");
        return;

    } catch (error) {
        console.error("ERRO:", error);
        error_visual.textContent = "Erro ao conectar com servidor.";

        botao_login.disabled = false;
        botao_login.textContent = "Entrar";
    }
});


// PERFIL 
botao_teste.addEventListener("click", async () => {
    try {
        const resposta = await fetch(CONFIG.PERFIL, {
            credentials: "include"
        });

        const data = await resposta.json();

        if (!data.usuario) {
            mostrar_tela(tela_login);
            return;
        }

        tela_inicial.innerHTML = "";
        const boas_vindas = document.createElement("p");
        boas_vindas.textContent = `Olá, ${data.usuario.email}!`;
        tela_inicial.appendChild(boas_vindas);

    } catch {
        mostrar_tela(tela_login);
    }
});


// ESQUECI SENHA
direcionar_esqueci.addEventListener("click", (e) => {
    e.preventDefault();
    modal_esqueci.classList.add("visivel");
});

fechar_modal.addEventListener("click", (e) => {
    e.preventDefault();
    modal_esqueci.classList.remove("visivel");
    email_esqueci.value = "";
    erro_esqueci.textContent = "";
});

botao_enviar_esqueci.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!validator.isEmail(email_esqueci.value)) {
        erro_esqueci.textContent = "Email inválido";
        return;
    }

    botao_enviar_esqueci.disabled = true;
    botao_enviar_esqueci.textContent = "Enviando...";

    try {
        const resposta = await fetch(CONFIG.ESQUECI_SENHA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email: email_esqueci.value })
        });

        const data = await resposta.json();
        erro_esqueci.textContent = data.mensagem || data.erro;

        if (data.segundos_restantes || data.mensagem) {
            iniciar_contador(data.segundos_restantes || 300);
        } else {
            botao_enviar_esqueci.disabled = false;
            botao_enviar_esqueci.textContent = "Enviar link";
        }

    } catch {
        erro_esqueci.textContent = "Erro de conexão com servidor.";
        botao_enviar_esqueci.disabled = false;
        botao_enviar_esqueci.textContent = "Enviar link";
    }
});

function iniciar_contador(segundos) {
    const intervalo = setInterval(() => {
        segundos--;

        const minutos = Math.floor(segundos / 60);
        const seg = segundos % 60;

        botao_enviar_esqueci.textContent = `Aguarde ${minutos}:${seg.toString().padStart(2, "0")}`;

        if (segundos <= 0) {
            clearInterval(intervalo);
            botao_enviar_esqueci.disabled = false;
            botao_enviar_esqueci.textContent = "Enviar link";
        }
    }, 1000);
}