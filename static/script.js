// ✅ Función para obtener la URL de la bandera o icono de cada moneda
function getFlagUrl(currencyCode) {
    const customFlags = {
        "XAG": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Silver_symbol.png", // Plata 🪙
        "XAU": "https://upload.wikimedia.org/wikipedia/commons/6/60/Gold_bar_icon.png", // Oro 🏆
        "XDR": "https://upload.wikimedia.org/wikipedia/commons/5/5c/IMF_SDR_Logo.png", // Derechos Especiales de Giro 💵
        "XPF": "https://upload.wikimedia.org/wikipedia/commons/5/5e/CFP_franc_symbol.png", // Franco CFP 🇵🇫
        "XAF": "https://upload.wikimedia.org/wikipedia/commons/1/1a/CFA_Franc_BEAC_logo.png", // Franco CFA BEAC 🇨🇲
        "XOF": "https://upload.wikimedia.org/wikipedia/commons/4/4f/CFA_Franc_BCEAO.png", // Franco CFA BCEAO 🇸🇳
        "XCD": "https://upload.wikimedia.org/wikipedia/commons/d/df/East_Caribbean_Dollar_symbol.png", // Dólar del Caribe Oriental 🇦🇬
        "BTC": "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg"  // Bitcoin 🟠
    };

    return customFlags[currencyCode] || `https://flagcdn.com/w40/${currencyCode.substring(0, 2).toLowerCase()}.png`;
}

// ✅ Función para cargar todas las monedas desde la API
async function loadCurrencies() {
    const API_KEY = "95bd535d0c3a98bcb86fa63ab863a966";
    const BASE_URL_LIST = "http://apilayer.net/api/list";

    try {
        const response = await fetch(`${BASE_URL_LIST}?access_key=${API_KEY}`);
        const data = await response.json();

        if (data.success) {
            return data.currencies;  // ✅ Devuelve TODAS las monedas
        } else {
            console.error("Error en la API:", data.error.info);
            return {};
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        return {};
    }
}

// ✅ Cargar monedas en los dropdowns con banderas
async function loadCurrencyDropdown(dropdownId, buttonId, flagId, defaultCurrency) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '';

    const currencies = await loadCurrencies(); // 🔹 Obtener TODAS las monedas de la API

    // ✅ Barra de búsqueda
    const searchBox = document.createElement("input");
    searchBox.type = "text";
    searchBox.placeholder = "Buscar...";
    searchBox.classList.add("search-box");
    searchBox.onkeyup = function () {
        filterDropdown(dropdownId, this.value);
    };
    dropdown.appendChild(searchBox);

    for (const code in currencies) {
        const div = document.createElement("div");
        div.classList.add("dropdown-item");
        div.innerHTML = `<img src="${getFlagUrl(code)}" alt="Flag"> ${code} - ${currencies[code]}`;
        div.onclick = function () {
            document.getElementById(buttonId).innerHTML = `<img src="${getFlagUrl(code)}" alt="Flag"> ${code}`;
            document.getElementById(flagId).src = getFlagUrl(code);
            dropdown.style.display = "none"; // Cierra el dropdown después de la selección
            convertCurrency(); // Actualiza la conversión
        };
        dropdown.appendChild(div);
    }

    // ✅ Configurar moneda predeterminada
    document.getElementById(buttonId).innerHTML = `<img src="${getFlagUrl(defaultCurrency)}" alt="Flag"> ${defaultCurrency}`;
    document.getElementById(flagId).src = getFlagUrl(defaultCurrency);
}

// ✅ Aplicar dropdowns con buscador en AMBOS SELECTORES al inicio
window.onload = async function () {
    await loadCurrencyDropdown("from_currency_list", "from_currency_btn", "from_flag", "EUR");
    await loadCurrencyDropdown("to_currency_list", "to_currency_btn", "to_flag", "USD");
};
