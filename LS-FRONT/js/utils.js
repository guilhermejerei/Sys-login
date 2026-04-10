function mostrar_tela(tela) {
    document.querySelectorAll(".tela_").forEach(t =>
        t.classList.remove("visivel")
    );
    tela.classList.add("visivel");
}

function verificar_token() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            return false;
        }
        return true;
    } catch {
        localStorage.removeItem("token");
        return false;
    }
}