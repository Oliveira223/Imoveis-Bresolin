import smtplib
import subprocess
import os
import logging
from email.message import EmailMessage
from datetime import datetime
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# ======================
# CONFIGURAÇÕES GERAIS
# ======================
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(levelname)s %(message)s')
logger = logging.getLogger(__name__)

EMAIL_REMETENTE = os.getenv("EMAIL_REMETENTE")
SENHA_APP_GMAIL = os.getenv("SENHA_APP_GMAIL")
DESTINATARIOS = [e.strip() for e in os.getenv("EMAIL_DESTINATARIOS", "").split(",") if e.strip()]

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise EnvironmentError("Variável DATABASE_URL não definida.")

# Usa variável de ambiente BACKUP_DIR ou fallback portátil em ~/backups/bresolin
BACKUP_DIR = Path(os.getenv("BACKUP_DIR", str(Path.home() / "backups" / "bresolin")))
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

BACKUP_PATH = BACKUP_DIR / f"backup_{datetime.now().strftime('%Y-%m-%d')}.sql"

# ======================
# GERA BACKUP DO POSTGRES
# ======================
def gerar_backup():
    logger.info("Gerando backup do banco...")
    subprocess.run(
        ["pg_dump", DATABASE_URL, "-f", str(BACKUP_PATH)],
        check=True
    )
    logger.info("Backup salvo em %s", BACKUP_PATH)

# ======================
# CONSULTA RELATÓRIO
# ======================
def gerar_relatorio():
    with psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) FROM acessos
                WHERE timestamp >= NOW() - INTERVAL '7 days'
            """)
            total_acessos = cur.fetchone()["count"]

            cur.execute("""
                SELECT imoveis.id AS imovel_id, imoveis.titulo, COUNT(*) AS total
                FROM acessos
                JOIN imoveis ON acessos.imovel_id = imoveis.id
                WHERE timestamp >= NOW() - INTERVAL '7 days'
                GROUP BY imoveis.id, imoveis.titulo
                ORDER BY total DESC
                LIMIT 10
            """)
            ranking = cur.fetchall()

    return total_acessos, ranking

# ======================
# ENVIA O E-MAIL
# ======================
def enviar_email(total_acessos, ranking):
    msg = EmailMessage()
    msg["Subject"] = f"📊 Relatório Semanal - {datetime.now().strftime('%d/%m/%Y')}"
    msg["From"] = EMAIL_REMETENTE
    msg["To"] = ", ".join(DESTINATARIOS)

    html = f"""
    <html>
      <body>
        <h2>📊 Relatório Semanal - Bresolin Imóveis</h2>
        <p><b>Total de acessos nos últimos 7 dias:</b> {total_acessos}</p>
        <h3>🏆 Imóveis mais visualizados:</h3>
        <ul>
        {''.join(f"<li>{r['titulo']} (ID {r['imovel_id']}): {r['total']} acessos</li>" for r in ranking)}
        </ul>
        <p><i>Backup do banco de dados está em anexo (.sql).</i></p>
      </body>
    </html>
    """

    msg.set_content("Relatório semanal em HTML.")
    msg.add_alternative(html, subtype='html')

    with open(str(BACKUP_PATH), "rb") as f:
        msg.add_attachment(
            f.read(),
            maintype="application",
            subtype="sql",
            filename=os.path.basename(BACKUP_PATH)
        )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(EMAIL_REMETENTE, SENHA_APP_GMAIL)
        smtp.send_message(msg)

    logger.info("E-mail enviado com sucesso.")

# ======================
# EXECUÇÃO
# ======================
if __name__ == "__main__":
    total, ranking = gerar_relatorio()
    gerar_backup()
    enviar_email(total, ranking)
