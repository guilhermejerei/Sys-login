const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const validator = require("validator");
const jwt = require("jsonwebtoken");

module.exports = (db, transporter) => {

router.post("/register", async (requisicao, resposta) => {
    const { usuario, email, senha, rp_senha } = requisicao.body;

    if (!usuario || !email || !senha || !rp_senha)
        return resposta.json({ erro: "Preencha todos os campos" });

    if (usuario.length < 6)
        return resposta.json({ erro: "Usuário deve ter no mínimo 6 caracteres" });

    if (usuario.length > 30)
        return resposta.json({ erro: "Usuário deve ter no máximo 30 caracteres" });

    if (usuario.includes(" "))
        return resposta.json({ erro: "Usuário não pode ter espaços" });

    if (senha.length < 6)
        return resposta.json({ erro: "Senha deve ter no mínimo 6 caracteres" });

    if (senha.length > 30)
        return resposta.json({ erro: "Senha muito longa" });

    if (rp_senha !== senha)
        return resposta.json({ erro: "Senhas não correspondem" });

    if (!validator.isEmail(email))
        return resposta.json({ erro: "Email inválido" });

    db.query(
        "SELECT id FROM usuarios WHERE email = ?",
        [email],
        async (erro, resultado) => {

            if (erro)
                return resposta.json({ erro: "Erro de comunicação com servidor" });

            if (resultado.length > 0)
                return resposta.json({ erro: "Dados inválidos" });

            const hash = await bcrypt.hash(senha, 10);
            const token = crypto.randomBytes(32).toString("hex");
            const expira_em = new Date(Date.now() + 5 * 60 * 1000);

            db.query(
                "DELETE FROM tokens_confirmacao WHERE email = ?",
                [email],
                (erro) => {
                    if (erro)
                        return resposta.json({ erro: "Erro de comunicação com servidor" });

                    db.query(
                        "INSERT INTO tokens_confirmacao (usuario, email, senha, token, expira_em) VALUES (?,?,?,?,?)",
                        [usuario, email, hash, token, expira_em],
                        (erro) => {
                            if (erro)
                                return resposta.json({ erro: "Erro ao processar cadastro" });

                            const link = `${process.env.FRONTEND_URL}/LS-FRONT/pages/confirmar.html?token=${token}`;

                            transporter.sendMail({
                                from: `"Login System - Guilherme" <${process.env.EMAIL_USER}>`,
                                to: email,
                                subject: "Confirme seu cadastro",
                                html: `
                                    <div style="font-family:'Trebuchet MS','Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#D99B77;border-radius:8px;overflow:hidden;">
                                        <div style="background:#402319;padding:24px 32px;">
                                            <h2 style="color:#D99B77;margin:0;font-size:20px;letter-spacing:0.5px;">Login System</h2>
                                        </div>
                                        <div style="padding:32px;">
                                            <h3 style="color:#402319;margin:0 0 12px 0;font-size:18px;">Confirme seu cadastro</h3>
                                            <p style="color:#6b3a26;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                                                Olá, <strong style="color:#402319;">${usuario}</strong>!<br>
                                                Clique no botão abaixo para confirmar sua conta e começar a usar o sistema.
                                            </p>
                                            <a href="${link}" style="display:block;text-align:center;padding:14px 24px;background:#402319;color:#D99B77;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:0.5px;">
                                                Confirmar conta
                                            </a>
                                            <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(64,35,25,0.15);">
                                                <p style="color:#88412a;font-size:11px;margin:0;line-height:1.5;">
                                                    Este link expira em <strong>5 minutos</strong>.<br>
                                                    Se você não solicitou esse cadastro, ignore este email.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                `
                            }).catch(erro => console.error("Erro ao enviar email:", erro));

                            resposta.json({ mensagem: "Email de confirmação enviado!" });
                        }
                    );
                }
            );
        }
    );
});

router.get("/confirmar/:token", (requisicao, resposta) => {

        const { token } = requisicao.params;

        db.query(
            "SELECT * FROM tokens_confirmacao WHERE token = ?",
            [token],
            async (erro, resultado) => {

                if (erro)
                    return resposta.json({ erro: "Erro de comunicação com servidor" });

                if (resultado.length === 0)
                    return resposta.json({ erro: "Token inválido" });

                const dados = resultado[0];

                if (new Date() > new Date(dados.expira_em)) {
                    db.query("DELETE FROM tokens_confirmacao WHERE token = ?", [token]);
                    return resposta.json({ erro: "Token expirado. Faça o cadastro novamente." });
                }

                db.query(
                    "INSERT INTO usuarios (usuario, email, senha) VALUES (?,?,?)",
                    [dados.usuario, dados.email, dados.senha],
                    (erro) => {
                        if (erro)
                            return resposta.json({ erro: "Erro ao criar usuário" });

                        db.query("DELETE FROM tokens_confirmacao WHERE token = ?", [token]);
                        resposta.json({ mensagem: "Conta confirmada com sucesso!" });
                    }
                );
            }
        );
    });

router.post("/login", async (requisicao, resposta) => {

    const { email, senha } = requisicao.body;

    if (!email || !senha)
        return resposta.json({ erro: "Preencha todos os campos" });

    db.query(
        "SELECT id, email, senha FROM usuarios WHERE email = ?",
        [email],
        async (erro, resultado) => {

            if (erro)
                return resposta.json({ erro: "Erro de comunicação com servidor" });

            if (resultado.length === 0)
                return resposta.json({ erro: "Dados inválidos" });

            const usuario = resultado[0];
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

            if (!senhaCorreta)
                return resposta.json({ erro: "Dados inválidos" });

            const token = jwt.sign(
                { id: usuario.id, email: usuario.email },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            const emProducao = process.env.NODE_ENV === "production";

            resposta.cookie("token", token, {
                httpOnly: true,
                secure: emProducao,
                sameSite: emProducao ? "none" : "lax",
                path: "/",
                maxAge: 1000 * 60 * 60
            });

            resposta.json({ sucesso: true });
        }
    );
});

    return router;
};