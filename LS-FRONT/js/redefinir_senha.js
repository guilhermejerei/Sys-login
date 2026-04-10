const nova_senha = document.getElementById("nova-senha");
const rp_nova_senha = document.getElementById("rp-nova-senha");
const erro_redefinir = document.getElementById("erro-redefinir");
const botao_redefinir = document.getElementById("botao-redefinir");
const lock_redefinir = document.getElementById("lock-redefinir");
const rp_lock_redefinir = document.getElementById("rp-lock-redefinir");

lock_redefinir.addEventListener("click", function() {
    nova_senha.type = nova_senha.type === "password" ? "text" : "password";
    lock_redefinir.textContent = nova_senha.type === "text" ? "lock_open" : "lock";
});

rp_lock_redefinir.addEventListener("click", function() {
    rp_nova_senha.type = rp_nova_senha.type === "password" ? "text" : "password";
    rp_lock_redefinir.textContent = rp_nova_senha.type === "text" ? "lock_open" : "lock";
});

botao_redefinir.addEventListener("click", async function(acao) {
    acao.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        erro_redefinir.textContent = "Token inválido.";
        return;
    }

    if (nova_senha.value.length < 6) {
        erro_redefinir.textContent = "Senha deve ter no mínimo 6 caracteres";
        return;
    }

    if (nova_senha.value.length > 30) {
        erro_redefinir.textContent = "Senha muito longa";
        return;
    }

    if (nova_senha.value !== rp_nova_senha.value) {
        erro_redefinir.textContent = "Senhas não correspondem";
        return;
    }

    botao_redefinir.disabled = true;

    try {
        const resposta = await fetch(CONFIG.REDEFINIR_SENHA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: token,
                nova_senha: nova_senha.value
            })
        });

        const data = await resposta.json();

        if (data.erro) {
            erro_redefinir.textContent = data.erro;
            botao_redefinir.disabled = false;
            return;
        }

        erro_redefinir.style.color = "#402319";
        erro_redefinir.textContent = "Senha redefinida com sucesso!";

        setTimeout(() => {
            window.location.href = "../index.html";
        }, 2000);

    } catch (error) {
        erro_redefinir.textContent = "Erro de conexão com servidor.";
        botao_redefinir.disabled = false;
    }
});