const hostLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const URL_PRODUCAO_BACKEND = "https://sys-login-site-production.up.railway.app";

const API_URL = hostLocal
    ? `http://${window.location.hostname}:3000`
    : URL_PRODUCAO_BACKEND;

const CONFIG = {
    API_URL: API_URL,
    LOGIN: API_URL + "/login",
    REGISTRO: API_URL + "/register",
    PERFIL: API_URL + "/perfil",
    LOGOUT: API_URL + "/logout",
    ATUALIZAR_USUARIO: API_URL + "/usuario",
    ALTERAR_SENHA: API_URL + "/usuario/senha",
    EXCLUIR_CONTA: API_URL + "/usuario",
    CONFIRMAR: API_URL + "/confirmar",
    ESQUECI_SENHA: API_URL + "/esqueci-senha",
    REDEFINIR_SENHA: API_URL + "/redefinir-senha"
};
