import smtplib
import subprocess
import os
from email.message import EmailMessage
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# ======================
# CONFIGURAÇÕES GERAIS
# ======================
load_dotenv() 

EMAIL_REMETENTE = "imoveisbresolinsite@gmail.com"
SENHA_APP_GMAIL = "yaax cfbu qfml kutj"
DESTINATARIOS = [
    "pedrohenrique@gmail.com",
    "imoveisbresolinsite@gmail.com"
    # "otavio.bresolin@creci.org.br"
]

DATABASE_URL = os.getenv("DATABASE_URL")

# ======================
# GERA BACKUP DO POSTGRES
# ======================
# Caminho completo fora do projeto
BACKUP_DIR = r"E:\PROJECTS\Bresolin Imóveis\Backups\BANCO_DE_DADOS"
os.makedirs(BACKUP_DIR, exist_ok=True)

BACKUP_PATH = os.path.join(
    BACKUP_DIR,
    f"backup_{datetime.now().strftime('%Y-%m-%d')}.sql"
)

def gerar_backup():
    print("[INFO] Gerando backup do banco...")

    os.environ["PGPASSWORD"] = "0p7QgP2uBSV8i4WlbFoxIef0IuUpHNAJ"  # senha do banco

    subprocess.run([
        "pg_dump",
        "-h", "dpg-d1pik63uibrs73dpto50-a.oregon-postgres.render.com",
        "-U", "bresolin_user",
        "-d", "bresolin",
        "-f", BACKUP_PATH
    ], check=True)

    print(f"[INFO] Backup salvo em {BACKUP_PATH}")

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

    with open(BACKUP_PATH, "rb") as f:
        msg.add_attachment(
            f.read(),
            maintype="application",
            subtype="sql",
            filename=os.path.basename(BACKUP_PATH)
        )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(EMAIL_REMETENTE, SENHA_APP_GMAIL)
        smtp.send_message(msg)

    print("[INFO] E-mail enviado com sucesso.")

# ======================
# EXECUÇÃO
# ======================
if __name__ == "__main__":
    total, ranking = gerar_relatorio()
    gerar_backup()
    enviar_email(total, ranking)
