const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const validator = require("validator");

module.exports = (db, transporter) => {

router.post("/esqueci-senha", async (requisicao, resposta) => {

    const { email } = requisicao.body;

    if (!email || !validator.isEmail(email))
        return resposta.json({ mensagem: "Se esse email estiver cadastrado, você receberá um link." });

    db.query(
        "SELECT id FROM usuarios WHERE email = ?",
        [email],
        async (erro, resultado) => {

            if (erro || resultado.length === 0)
                return resposta.json({ mensagem: "Se esse email estiver cadastrado, você receberá um link." });

            db.query(
                "SELECT criado_em FROM tokens_reset WHERE email = ? ORDER BY criado_em DESC LIMIT 1",
                [email],
                (erro, ultimo) => {
                    if (ultimo.length > 0) {
                        const diff = (Date.now() - new Date(ultimo[0].criado_em).getTime()) / 1000;
                        if (diff < 300) {
                            const restante_segundos = Math.ceil(300 - diff);
                            const restante_minutos = Math.ceil(restante_segundos / 60);
                            return resposta.json({ 
                                erro: `Aguarde ${restante_minutos} minuto(s) para solicitar um novo link.`,
                                segundos_restantes: restante_segundos
                            });
                        }
                    }

                    const token = crypto.randomBytes(32).toString("hex");
                    const expira_em = new Date(Date.now() + 15 * 60 * 1000);

                    db.query(
                        "DELETE FROM tokens_reset WHERE email = ?",
                        [email],
                        (erro) => {
                            if (erro)
                                return resposta.json({ mensagem: "Se esse email estiver cadastrado, você receberá um link." });

                            db.query(
                                "INSERT INTO tokens_reset (email, token, expira_em) VALUES (?,?,?)",
                                [email, token, expira_em],
                                (erro) => {
                                    if (erro)
                                        return resposta.json({ mensagem: "Se esse email estiver cadastrado, você receberá um link." });

                                    const link = `${process.env.FRONTEND_URL}/LS-FRONT/redefinir.html?token=${token}`;

                                    transporter.sendMail({
                                        from: `"Login System - Guilherme" <${process.env.EMAIL_USER}>`,
                                        to: email,
                                        subject: "Redefinição de senha",
                                        html: `
                                            <div style="font-family:'Trebuchet MS','Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#D99B77;border-radius:8px;overflow:hidden;">
                                                <div style="background:#402319;padding:24px 32px;">
                                                    <h2 style="color:#D99B77;margin:0;font-size:20px;letter-spacing:0.5px;">Login System</h2>
                                                </div>
                                                <div style="padding:32px;">
                                                    <h3 style="color:#402319;margin:0 0 12px 0;font-size:18px;">Redefinir senha</h3>
                                                    <p style="color:#6b3a26;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                                                        Recebemos uma solicitação para redefinir sua senha.<br>
                                                        Clique no botão abaixo para criar uma nova senha.
                                                    </p>
                                                    <a href="${link}" style="display:block;text-align:center;padding:14px 24px;background:#402319;color:#D99B77;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:0.5px;">
                                                        Redefinir senha
                                                    </a>
                                                    <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(64,35,25,0.15);">
                                                        <p style="color:#88412a;font-size:11px;margin:0;line-height:1.5;">
                                                            Este link expira em <strong>15 minutos</strong>.<br>
                                                            Se você não solicitou a redefinição, ignore este email.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        `
                                    }).catch(erro => console.error("Erro ao enviar email:", erro));

                                    resposta.json({ mensagem: "Se esse email estiver cadastrado, você receberá um link." });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


router.post("/redefinir-senha", async (requisicao, resposta) => {

    const { token, nova_senha } = requisicao.body;

    if (!token || !nova_senha)
        return resposta.json({ erro: "Dados inválidos" });

    if (nova_senha.length < 6)
        return resposta.json({ erro: "Senha deve ter no mínimo 6 caracteres" });

    if (nova_senha.length > 30)
        return resposta.json({ erro: "Senha muito longa" });

    db.query(
        "SELECT * FROM tokens_reset WHERE token = ?",
        [token],
        async (erro, resultado) => {

            if (erro)
                return resposta.json({ erro: "Erro de comunicação com servidor" });

            if (resultado.length === 0)
                return resposta.json({ erro: "Token inválido" });

            const dados = resultado[0];

            if (new Date() > new Date(dados.expira_em)) {
                db.query("DELETE FROM tokens_reset WHERE token = ?", [token]);
                return resposta.json({ erro: "Token expirado. Solicite um novo link." });
            }

            const hash = await bcrypt.hash(nova_senha, 10);

            db.query(
                "UPDATE usuarios SET senha = ? WHERE email = ?",
                [hash, dados.email],
                (erro) => {
                    if (erro)
                        return resposta.json({ erro: "Erro ao redefinir senha" });

                    db.query("DELETE FROM tokens_reset WHERE token = ?", [token]);
                    resposta.json({ mensagem: "Senha redefinida com sucesso!" });
                }
            );
        }
    );
});

    return router;
};