from flask import Flask, render_template, request
import requests
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

app = Flask(__name__)

# Clave API de CurrencyLayer
API_KEY = "95bd535d0c3a98bcb86fa63ab863a966"
BASE_URL_LIVE = "http://apilayer.net/api/live"
BASE_URL_LIST = "http://apilayer.net/api/list"

# Configuración de la base de datos
DATABASE_URL = "sqlite:///currencies.db"
Base = declarative_base()

# Definición del modelo de la tabla de tasas de cambio
class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    id = Column(String, primary_key=True)  # Ejemplo: "USD_EUR"
    rate = Column(Float, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow)

# Configurar la base de datos
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Obtener todas las monedas soportadas por la API
def get_currencies():
    response = requests.get(BASE_URL_LIST, params={"access_key": API_KEY})
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            return data.get("currencies", {})
    return {}

# Guardar tasas de cambio en la base de datos
def save_rates_to_db(rates):
    for key, value in rates.items():
        rate_entry = session.query(ExchangeRate).filter_by(id=key).first()
        if rate_entry:
            # Actualizar la tasa si ya existe
            rate_entry.rate = value
            rate_entry.last_updated = datetime.utcnow()
        else:
            # Crear una nueva entrada si no existe
            rate_entry = ExchangeRate(id=key, rate=value)
            session.add(rate_entry)
    session.commit()

# Obtener tasa de cambio desde la base de datos
def get_rate_from_db(from_currency, to_currency):
    rate_key = f"{from_currency}{to_currency}"
    rate_entry = session.query(ExchangeRate).filter_by(id=rate_key).first()
    return rate_entry.rate if rate_entry else None

# Lista de monedas cargadas al inicio
CURRENCIES = get_currencies()

@app.route("/", methods=["GET", "POST"])
def home():
    result = None
    error = None

    if request.method == "POST":
        # Capturar datos del formulario
        amount = request.form.get("amount", type=float)
        from_currency = request.form.get("from_currency", default="USD")
        to_currency = request.form.get("to_currency", default="EUR")

        # Llamar a la API de CurrencyLayer
        params = {
            "access_key": API_KEY,
            "currencies": to_currency,
            "source": from_currency,
            "format": 1
        }
        response = requests.get(BASE_URL_LIVE, params=params)

        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                # Guardar las tasas en la base de datos
                save_rates_to_db(data["quotes"])
                
                # Obtener la tasa de cambio
                rate_key = f"{from_currency}{to_currency}"
                exchange_rate = data["quotes"].get(rate_key)

                if exchange_rate:
                    # Calcular el resultado
                    result = round(amount * exchange_rate, 2)
                else:
                    error = "La moneda no está disponible."
            else:
                error = "Error en la respuesta de la API."
        else:
            # Si la API falla, usar datos de la base de datos
            exchange_rate = get_rate_from_db(from_currency, to_currency)

            if exchange_rate:
                result = round(amount * exchange_rate, 2)
                error = "Se utilizó una copia local de las tasas de cambio."
            else:
                error = "No se pudieron obtener las tasas de cambio ni de la API ni de los datos locales."

    return render_template("index.html", result=result, error=error, currencies=CURRENCIES)

if __name__ == "__main__":
    app.run(debug=True)
