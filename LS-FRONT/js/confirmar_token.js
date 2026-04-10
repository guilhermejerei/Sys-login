async function confirmar() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        document.getElementById("confirmar-titulo").textContent = "Token inválido";
        document.getElementById("confirmar-mensagem").textContent = "O link que você acessou é inválido.";
        document.getElementById("spinner").style.display = "none";
        return;
    }

    const resposta = await fetch(`${CONFIG.CONFIRMAR}/${token}`);
    const data = await resposta.json();

    document.getElementById("spinner").style.display = "none";

    if (data.erro) {
        document.getElementById("confirmar-titulo").textContent = "Ops!";
        document.getElementById("confirmar-mensagem").textContent = data.erro;
    } else {
        document.getElementById("confirmar-titulo").textContent = "Conta Criada!";
        document.getElementById("confirmar-mensagem").textContent = "Sua conta foi criada!";
        document.getElementById("confirmar-link").style.display = "block";
    }
}
confirmar();