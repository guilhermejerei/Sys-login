const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

module.exports = (db) => {
    
    const autenticar = (requisicao, resposta, next) => {
        const token = requisicao.cookies.token;

        if (!token) {
            return resposta.json({ erro: "Não autenticado" });
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            requisicao.usuario = payload;
            next();
        } catch {
            return resposta.json({ erro: "Token inválido ou expirado" });
        }
    };

    router.get("/perfil", autenticar, (req, res) => {
        db.query(
            "SELECT id, usuario, email FROM usuarios WHERE id = ?",
            [req.usuario.id],
            (erro, resultado) => {
                if (erro) return res.status(500).json({ erro: "Erro de comunicação com servidor" });
                if (resultado.length === 0) return res.status(404).json({ erro: "Usuário não encontrado" });

                const usuario = resultado[0];
                res.json({
                    mensagem: "Autenticado!",
                    usuario: {
                        id: usuario.id,
                        usuario: usuario.usuario,
                        email: usuario.email
                    },
                    membro_desde: req.usuario.iat ? new Date(req.usuario.iat * 1000).toISOString() : null
                });
            }
        );
    });

    router.post("/logout", (req, res) => {
        const emProducao = process.env.NODE_ENV === "production";

        res.clearCookie("token", {
            httpOnly: true,
            secure: emProducao,
            sameSite: emProducao ? "none" : "lax",
            path: "/"
        });

        res.json({ mensagem: "Logout realizado com sucesso." });
    });

    router.patch("/usuario", autenticar, (req, res) => {
        const { usuario } = req.body;

        if (!usuario || typeof usuario !== "string") {
            return res.status(400).json({ erro: "Nome de usuário inválido" });
        }

        const nome = usuario.trim();

        if (nome.length < 3) return res.status(400).json({ erro: "Usuário deve ter no mínimo 3 caracteres" });
        if (nome.length > 30) return res.status(400).json({ erro: "Usuário deve ter no máximo 30 caracteres" });
        if (nome.includes(" ")) return res.status(400).json({ erro: "Usuário não pode ter espaços" });

        db.query(
            "UPDATE usuarios SET usuario = ? WHERE id = ?",
            [nome, req.usuario.id],
            (erro) => {
                if (erro) return res.status(500).json({ erro: "Erro ao atualizar usuário" });
                return res.json({ mensagem: "Usuário atualizado com sucesso." });
            }
        );
    });

    router.patch("/usuario/senha", autenticar, (req, res) => {
        const { senha_atual, nova_senha } = req.body;

        if (!senha_atual || !nova_senha) {
            return res.status(400).json({ erro: "Preencha todos os campos" });
        }

        if (nova_senha.length < 6) return res.status(400).json({ erro: "Senha deve ter no mínimo 6 caracteres" });
        if (nova_senha.length > 30) return res.status(400).json({ erro: "Senha muito longa" });

        db.query(
            "SELECT senha FROM usuarios WHERE id = ?",
            [req.usuario.id],
            async (erro, resultado) => {
                if (erro) return res.status(500).json({ erro: "Erro de comunicação com servidor" });
                if (resultado.length === 0) return res.status(404).json({ erro: "Usuário não encontrado" });

                const senhaCorreta = await bcrypt.compare(senha_atual, resultado[0].senha);
                if (!senhaCorreta) return res.status(401).json({ erro: "Senha atual incorreta" });

                const hash = await bcrypt.hash(nova_senha, 10);

                db.query(
                    "UPDATE usuarios SET senha = ? WHERE id = ?",
                    [hash, req.usuario.id],
                    (erroUpdate) => {
                        if (erroUpdate) return res.status(500).json({ erro: "Erro ao atualizar senha" });
                        return res.json({ mensagem: "Senha atualizada com sucesso." });
                    }
                );
            }
        );
    });

    router.delete("/usuario", autenticar, (req, res) => {
        const { senha, confirmacao } = req.body;

        if (!senha) return res.status(400).json({ erro: "Informe sua senha para excluir a conta" });
        if (confirmacao !== "EXCLUIR") {
            return res.status(400).json({ erro: "Confirmação inválida. Digite EXCLUIR para continuar" });
        }

        db.query(
            "SELECT senha FROM usuarios WHERE id = ?",
            [req.usuario.id],
            async (erro, resultado) => {
                if (erro) return res.status(500).json({ erro: "Erro de comunicação com servidor" });
                if (resultado.length === 0) return res.status(404).json({ erro: "Usuário não encontrado" });

                const senhaCorreta = await bcrypt.compare(senha, resultado[0].senha);
                if (!senhaCorreta) return res.status(401).json({ erro: "Senha incorreta" });

                db.query(
                    "DELETE FROM usuarios WHERE id = ?",
                    [req.usuario.id],
                    (erroDelete) => {
                        if (erroDelete) return res.status(500).json({ erro: "Erro ao excluir conta" });

                        const emProducao = process.env.NODE_ENV === "production";
                        res.clearCookie("token", {
                            httpOnly: true,
                            secure: emProducao,
                            sameSite: emProducao ? "none" : "lax",
                            path: "/"
                        });

                        return res.json({ mensagem: "Conta excluida com sucesso." });
                    }
                );
            }
        );
    });

    return router;
};