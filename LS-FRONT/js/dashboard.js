const spinner_dashboard = document.getElementById("dashboard-spinner");
const titulo_dashboard = document.getElementById("dashboard-titulo");
const mensagem_dashboard = document.getElementById("dashboard-mensagem");
const nome_dashboard = document.getElementById("dashboard-usuario");
const email_dashboard = document.getElementById("dashboard-email");
const avatar_dashboard = document.getElementById("dashboard-avatar");
const membro_desde_dashboard = document.getElementById("dashboard-desde");
const card_perfil_dashboard = document.getElementById("dashboard-perfil");
const link_login_dashboard = document.getElementById("dashboard-link-login");

const botao_logout_dashboard = document.getElementById("dashboard-botao-logout");
const botao_editar_dashboard = document.getElementById("dashboard-botao-editar");
const botao_senha_dashboard = document.getElementById("dashboard-botao-senha");
const botao_excluir_dashboard = document.getElementById("dashboard-botao-excluir");

const modal_dashboard = document.getElementById("dashboard-modal");
const modal_titulo_dashboard = document.getElementById("dashboard-modal-titulo");
const modal_descricao_dashboard = document.getElementById("dashboard-modal-descricao");
const modal_input_1_dashboard = document.getElementById("dashboard-modal-input-1");
const modal_input_2_dashboard = document.getElementById("dashboard-modal-input-2");
const modal_erro_dashboard = document.getElementById("dashboard-modal-erro");
const modal_confirmar_dashboard = document.getElementById("dashboard-modal-confirmar");
const modal_cancelar_dashboard = document.getElementById("dashboard-modal-cancelar");

let tipo_acao_modal = "";
let dados_usuario_atual = null;

// CONTROLE DE AUTO-HIDE
let timeout_mensagem_dashboard = null;

function atualizar_mensagem_dashboard(texto) {
    mensagem_dashboard.textContent = texto;
    mensagem_dashboard.style.display = "block";

    if (timeout_mensagem_dashboard) {
        clearTimeout(timeout_mensagem_dashboard);
    }

    timeout_mensagem_dashboard = setTimeout(() => {
        mensagem_dashboard.style.display = "none";
    }, 15000);
}

function mostrar_acoes_autenticado(autenticado) {
    card_perfil_dashboard.style.display = autenticado ? "flex" : "none";
    botao_editar_dashboard.style.display = autenticado ? "flex" : "none";
    botao_senha_dashboard.style.display = autenticado ? "flex" : "none";
    botao_excluir_dashboard.style.display = autenticado ? "flex" : "none";
    botao_logout_dashboard.style.display = autenticado ? "flex" : "none";
    link_login_dashboard.style.display = autenticado ? "none" : "inline-block";
    spinner_dashboard.style.display = "none";
}

async function parse_json_seguro(resposta) {
    const content_type = resposta.headers.get("content-type") || "";
    if (!content_type.includes("application/json")) return null;

    try {
        return await resposta.json();
    } catch {
        return null;
    }
}

function formatar_membro_desde(data_iso) {
    if (!data_iso) return "membro desde --";

    const data = new Date(data_iso);
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    return `membro desde ${meses[data.getMonth()]}. ${data.getFullYear()}`;
}

function preencher_card_perfil(dados) {
    dados_usuario_atual = dados.usuario;

    const nome_usuario = dados.usuario.usuario || "Usuario";
    const email_usuario = dados.usuario.email || "email@exemplo.com";
    const iniciais = nome_usuario ? nome_usuario.slice(0, 2).toUpperCase() : "US";

    nome_dashboard.textContent = nome_usuario;
    email_dashboard.textContent = email_usuario;
    avatar_dashboard.textContent = iniciais;
    membro_desde_dashboard.textContent = formatar_membro_desde(dados.membro_desde);

    atualizar_mensagem_dashboard(dados.mensagem || "Sessao ativa.");
}

async function carregar_perfil() {
    try {
        const resposta = await fetch(CONFIG.PERFIL, {
            credentials: "include"
        });

        const dados = await parse_json_seguro(resposta);

        if (!resposta.ok || !dados || !dados.usuario) {
            titulo_dashboard.textContent = "Nao autenticado";
            atualizar_mensagem_dashboard((dados && dados.erro) || "Faca login para acessar o dashboard.");
            mostrar_acoes_autenticado(false);
            return;
        }

        titulo_dashboard.textContent = "Dashboard";
        preencher_card_perfil(dados);
        mostrar_acoes_autenticado(true);
    } catch {
        titulo_dashboard.textContent = "Erro ao carregar";
        atualizar_mensagem_dashboard("Erro de conexao com o servidor.");
        mostrar_acoes_autenticado(false);
    }
}

function abrir_modal_dashboard(config) {
    tipo_acao_modal = config.acao;

    modal_titulo_dashboard.textContent = config.titulo;
    modal_descricao_dashboard.textContent = config.descricao;

    modal_input_1_dashboard.type = config.input_um_tipo || "text";
    modal_input_1_dashboard.placeholder = config.input_um_placeholder || "";
    modal_input_1_dashboard.value = config.input_um_valor || "";
    modal_input_1_dashboard.style.display = config.input_um_visivel ? "block" : "none";

    modal_input_2_dashboard.type = config.input_dois_tipo || "text";
    modal_input_2_dashboard.placeholder = config.input_dois_placeholder || "";
    modal_input_2_dashboard.value = "";
    modal_input_2_dashboard.style.display = config.input_dois_visivel ? "block" : "none";

    modal_erro_dashboard.textContent = "";
    modal_dashboard.classList.add("visivel");
}

function fechar_modal_dashboard() {
    tipo_acao_modal = "";
    modal_dashboard.classList.remove("visivel");
}

async function editar_usuario_dashboard() {
    const novo_usuario = modal_input_1_dashboard.value.trim();

    if (!novo_usuario) {
        modal_erro_dashboard.textContent = "Informe o novo nome de usuario.";
        return;
    }

    const resposta = await fetch(CONFIG.ATUALIZAR_USUARIO, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario: novo_usuario })
    });

    const dados = await parse_json_seguro(resposta);

    if (!resposta.ok) {
        modal_erro_dashboard.textContent = (dados && dados.erro) || "Falha ao atualizar usuario.";
        return;
    }

    await carregar_perfil();
    fechar_modal_dashboard();
}

async function alterar_senha_dashboard() {
    const senha_atual = modal_input_1_dashboard.value;
    const nova_senha = modal_input_2_dashboard.value;

    if (!senha_atual || !nova_senha) {
        modal_erro_dashboard.textContent = "Preencha os dois campos.";
        return;
    }

    const resposta = await fetch(CONFIG.ALTERAR_SENHA, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            senha_atual,
            nova_senha
        })
    });

    const dados = await parse_json_seguro(resposta);

    if (!resposta.ok) {
        modal_erro_dashboard.textContent = (dados && dados.erro) || "Falha ao alterar senha.";
        return;
    }

    atualizar_mensagem_dashboard((dados && dados.mensagem) || "Senha alterada com sucesso.");
    fechar_modal_dashboard();
}

async function excluir_conta_dashboard() {
    const senha = modal_input_1_dashboard.value;
    const confirmacao = modal_input_2_dashboard.value.trim().toUpperCase();

    if (!senha) {
        modal_erro_dashboard.textContent = "Informe sua senha para confirmar.";
        return;
    }

    if (confirmacao !== "EXCLUIR") {
        modal_erro_dashboard.textContent = "Digite EXCLUIR para confirmar a exclusao.";
        return;
    }

    const resposta = await fetch(CONFIG.EXCLUIR_CONTA, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            senha,
            confirmacao
        })
    });

    const dados = await parse_json_seguro(resposta);

    if (!resposta.ok) {
        modal_erro_dashboard.textContent = (dados && dados.erro) || "Falha ao excluir conta.";
        return;
    }

    window.location.replace("/LS-FRONT/index.html");
}

modal_confirmar_dashboard.addEventListener("click", async () => {
    try {
        modal_confirmar_dashboard.disabled = true;

        if (tipo_acao_modal === "editar") await editar_usuario_dashboard();
        if (tipo_acao_modal === "senha") await alterar_senha_dashboard();
        if (tipo_acao_modal === "excluir") await excluir_conta_dashboard();
    } finally {
        modal_confirmar_dashboard.disabled = false;
    }
});

modal_cancelar_dashboard.addEventListener("click", fechar_modal_dashboard);

botao_editar_dashboard.addEventListener("click", () => {
    abrir_modal_dashboard({
        acao: "editar",
        titulo: "Editar usuario",
        descricao: "Informe um novo nome de usuario.",
        input_um_visivel: true,
        input_um_tipo: "text",
        input_um_placeholder: "Novo usuario",
        input_um_valor: dados_usuario_atual ? dados_usuario_atual.usuario : "",
        input_dois_visivel: false
    });
});

botao_senha_dashboard.addEventListener("click", () => {
    abrir_modal_dashboard({
        acao: "senha",
        titulo: "Alterar senha",
        descricao: "Digite sua senha atual e a nova senha.",
        input_um_visivel: true,
        input_um_tipo: "password",
        input_um_placeholder: "Senha atual",
        input_dois_visivel: true,
        input_dois_tipo: "password",
        input_dois_placeholder: "Nova senha"
    });
});

botao_excluir_dashboard.addEventListener("click", () => {
    abrir_modal_dashboard({
        acao: "excluir",
        titulo: "Excluir conta",
        descricao: "Acao permanente. Digite sua senha e EXCLUIR para confirmar.",
        input_um_visivel: true,
        input_um_tipo: "password",
        input_um_placeholder: "Senha",
        input_dois_visivel: true,
        input_dois_tipo: "text",
        input_dois_placeholder: "Digite EXCLUIR"
    });
});

botao_logout_dashboard.addEventListener("click", async () => {
    botao_logout_dashboard.disabled = true;

    try {
        await fetch(CONFIG.LOGOUT, {
            method: "POST",
            credentials: "include"
        });
    } finally {
        window.location.replace("/LS-FRONT/index.html");
    }
});

carregar_perfil();