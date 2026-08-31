const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const cityName = document.getElementById("cityName");
const currentDate = document.getElementById("currentDate");

const temperature = document.getElementById("temperature");
const temperatureUnit = document.getElementById("temperatureUnit");
const description = document.getElementById("description");
const weatherIcon = document.getElementById("weatherIcon");

const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feelsLike = document.getElementById("feelsLike");

const forecastContainer =
    document.getElementById("forecastContainer");

const currentWeather =
    document.getElementById("currentWeather");

const forecastSection =
    document.getElementById("forecastSection");

const loading =
    document.getElementById("loading");

const errorMessage =
    document.getElementById("errorMessage");

const suggestions =
    document.getElementById("suggestions");

const themeBtn =
    document.getElementById("themeBtn");

const celsiusBtn =
    document.getElementById("celsiusBtn");

const fahrenheitBtn =
    document.getElementById("fahrenheitBtn");


// ===============================
// VARIABLES
// ===============================

let selectedLocation = null;
let currentWeatherData = null;
let temperatureUnitValue = "C";
let searchTimeout;
let searchRequestId = 0;


// ===============================
// GET CITY COORDINATES
// ===============================

async function getCoordinates(city) {

    const url =
        `https://geocoding-api.open-meteo.com/v1/search?` +
        `name=${encodeURIComponent(city)}` +
        `&count=1` +
        `&language=en` +
        `&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not search city");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found");
    }

    return {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country,
        admin1: data.results[0].admin1 || ""
    };
}


// ===============================
// SEARCH SUGGESTIONS
// ===============================

async function searchLocations(city) {

    if (city.length < 2) {
        suggestions.innerHTML = "";
        return;
    }

    const requestId = ++searchRequestId;

    try {

        const url =
            `https://geocoding-api.open-meteo.com/v1/search?` +
            `name=${encodeURIComponent(city)}` +
            `&count=8` +
            `&language=en` +
            `&format=json`;

        const response = await fetch(url);

        const data = await response.json();

        // Ignore this response if a newer search has started since,
        // otherwise fast typing can let an older result overwrite a newer one.
        if (requestId !== searchRequestId) {
            return;
        }

        suggestions.innerHTML = "";

        if (!data.results) {
            return;
        }

        data.results.forEach(location => {

            const item =
                document.createElement("div");

            item.className = "suggestion";

            const admin =
                location.admin1
                    ? `${location.admin1}, `
                    : "";

            item.innerHTML = `
                <div class="suggestion-name">
                    ${location.name}
                </div>

                <div class="suggestion-location">
                    ${admin}${location.country}
                </div>
            `;

            item.addEventListener("click", () => {

                selectedLocation = location;

                cityInput.value =
                    location.name;

                suggestions.innerHTML = "";

                searchSelectedLocation();
            });

            suggestions.appendChild(item);
        });

    } catch (error) {

        console.error(
            "Suggestion error:",
            error
        );
    }
}


// ===============================
// GET WEATHER
// ===============================

async function getWeather(latitude, longitude) {

    const url =
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=` +
        `temperature_2m,` +
        `relative_humidity_2m,` +
        `apparent_temperature,` +
        `wind_speed_10m,` +
        `weather_code,` +
        `is_day` +
        `&daily=` +
        `weather_code,` +
        `temperature_2m_max,` +
        `temperature_2m_min,` +
        `precipitation_probability_max` +
        `&temperature_unit=celsius` +
        `&wind_speed_unit=kmh` +
        `&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Weather data unavailable"
        );
    }

    return await response.json();
}


// ===============================
// WEATHER INFORMATION
// ===============================

function getWeatherInfo(code) {

    if (code === 0) {
        return {
            icon: "☀️",
            description: "Clear sky"
        };
    }

    if (code === 1) {
        return {
            icon: "🌤️",
            description: "Mainly clear"
        };
    }

    if (code === 2) {
        return {
            icon: "⛅",
            description: "Partly cloudy"
        };
    }

    if (code === 3) {
        return {
            icon: "☁️",
            description: "Overcast"
        };
    }

    if ([45, 48].includes(code)) {
        return {
            icon: "🌫️",
            description: "Foggy"
        };
    }

    if ([51, 53, 55].includes(code)) {
        return {
            icon: "🌦️",
            description: "Drizzle"
        };
    }

    if ([61, 63, 65].includes(code)) {
        return {
            icon: "🌧️",
            description: "Rain"
        };
    }

    if ([71, 73, 75].includes(code)) {
        return {
            icon: "❄️",
            description: "Snow"
        };
    }

    if ([80, 81, 82].includes(code)) {
        return {
            icon: "🌦️",
            description: "Rain showers"
        };
    }

    if ([95, 96, 99].includes(code)) {
        return {
            icon: "⛈️",
            description: "Thunderstorm"
        };
    }

    return {
        icon: "🌡️",
        description: "Unknown"
    };
}


// ===============================
// DISPLAY CURRENT WEATHER
// ===============================

function displayCurrentWeather(location, data) {

    const current = data.current;

    const weather =
        getWeatherInfo(
            current.weather_code
        );

    cityName.textContent =
        `${location.name}, ${location.country}`;

    const today = new Date();

    currentDate.textContent =
        today.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    temperature.textContent =
        convertTemperature(
            current.temperature_2m
        );

    temperatureUnit.textContent =
        getTemperatureSymbol();

    description.textContent =
        weather.description;

    weatherIcon.textContent =
        weather.icon;

    humidity.textContent =
        `${current.relative_humidity_2m}%`;

    wind.textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;

    feelsLike.textContent =
        `${convertTemperature(
            current.apparent_temperature
        )}${getTemperatureSymbol()}`;
}


// ===============================
// DISPLAY 7-DAY FORECAST
// ===============================

function displayForecast(daily) {

    forecastContainer.innerHTML = "";

    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        const date =
            new Date(daily.time[i]);

        const dayName =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );

        const weather =
            getWeatherInfo(
                daily.weather_code[i]
            );

        const card =
            document.createElement("div");

        card.className =
            "forecast-card";

        card.innerHTML = `
            <div class="forecast-day">
                ${i === 0 ? "Today" : dayName}
            </div>

            <div class="forecast-icon">
                ${weather.icon}
            </div>

            <div class="forecast-temp">
                ${convertTemperature(
                    daily.temperature_2m_max[i]
                )}${getTemperatureSymbol()}
            </div>

            <div class="forecast-min">
                ${convertTemperature(
                    daily.temperature_2m_min[i]
                )}${getTemperatureSymbol()}
            </div>

            <div class="forecast-rain">
                💧 ${daily.precipitation_probability_max[i]}%
            </div>
        `;

        forecastContainer.appendChild(card);
    }
}


// ===============================
// TEMPERATURE CONVERSION
// ===============================

function convertTemperature(celsius) {

    if (temperatureUnitValue === "C") {
        return Math.round(celsius);
    }

    return Math.round(
        (celsius * 9 / 5) + 32
    );
}


function getTemperatureSymbol() {

    return temperatureUnitValue === "C"
        ? "°C"
        : "°F";
}


// ===============================
// WEATHER BACKGROUND
// ===============================

function updateWeatherBackground(code, isDay) {

    document.body.classList.remove(
        "sunny",
        "cloudy",
        "rainy",
        "storm",
        "night"
    );

    if (isDay === 0) {

        document.body.classList.add(
            "night"
        );

        return;
    }

    if (code === 0 || code === 1) {

        document.body.classList.add(
            "sunny"
        );

    } else if (
        code === 2 ||
        code === 3
    ) {

        document.body.classList.add(
            "cloudy"
        );

    } else if (
        [61, 63, 65, 80, 81, 82]
            .includes(code)
    ) {

        document.body.classList.add(
            "rainy"
        );

    } else if (
        [95, 96, 99]
            .includes(code)
    ) {

        document.body.classList.add(
            "storm"
        );

    } else {

        document.body.classList.add(
            "cloudy"
        );
    }
}


// ===============================
// LOADING
// ===============================

function showLoading() {

    loading.classList.remove(
        "hidden"
    );

    currentWeather.classList.add(
        "hidden"
    );

    forecastSection.classList.add(
        "hidden"
    );

    errorMessage.textContent = "";
}


function hideLoading() {

    loading.classList.add(
        "hidden"
    );

    currentWeather.classList.remove(
        "hidden"
    );

    forecastSection.classList.remove(
        "hidden"
    );
}


// ===============================
// SEARCH SELECTED LOCATION
// ===============================

async function searchSelectedLocation() {

    if (!selectedLocation) {
        return;
    }

    try {

        showLoading();

        const data =
            await getWeather(
                selectedLocation.latitude,
                selectedLocation.longitude
            );

        currentWeatherData = data;

        displayCurrentWeather(
            selectedLocation,
            data
        );

        displayForecast(
            data.daily
        );

        updateWeatherBackground(
            data.current.weather_code,
            data.current.is_day
        );

        hideLoading();

    } catch (error) {

        console.error(error);

        loading.classList.add(
            "hidden"
        );

        errorMessage.textContent =
            "Unable to fetch weather.";
    }
}


// ===============================
// MAIN SEARCH
// ===============================

async function searchWeather() {

    const city =
        cityInput.value.trim();

    if (city === "") {

        errorMessage.textContent =
            "Please enter a city name.";

        return;
    }

    suggestions.innerHTML = "";

    try {

        showLoading();

        const location =
            await getCoordinates(city);

        selectedLocation = location;

        const data =
            await getWeather(
                location.latitude,
                location.longitude
            );

        currentWeatherData = data;

        displayCurrentWeather(
            location,
            data
        );

        displayForecast(
            data.daily
        );

        updateWeatherBackground(
            data.current.weather_code,
            data.current.is_day
        );

        hideLoading();

    } catch (error) {

        console.error(error);

        loading.classList.add(
            "hidden"
        );

        currentWeather.classList.add(
            "hidden"
        );

        forecastSection.classList.add(
            "hidden"
        );

        errorMessage.textContent =
            "City not found. Please try another city.";
    }
}


// ===============================
// SEARCH SUGGESTIONS WHILE TYPING
// ===============================

cityInput.addEventListener(
    "input",
    () => {

        clearTimeout(searchTimeout);

        const value =
            cityInput.value.trim();

        searchTimeout =
            setTimeout(
                () => {
                    searchLocations(value);
                },
                300
            );
    }
);


// ===============================
// SEARCH BUTTON
// ===============================

searchBtn.addEventListener(
    "click",
    searchWeather
);


// ===============================
// ENTER KEY
// ===============================

cityInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            searchWeather();
        }
    }
);


// ===============================
// CELSIUS
// ===============================

celsiusBtn.addEventListener(
    "click",
    () => {

        temperatureUnitValue = "C";

        celsiusBtn.classList.add(
            "active"
        );

        fahrenheitBtn.classList.remove(
            "active"
        );

        if (currentWeatherData) {

            displayCurrentWeather(
                selectedLocation,
                currentWeatherData
            );

            displayForecast(
                currentWeatherData.daily
            );
        }
    }
);


// ===============================
// FAHRENHEIT
// ===============================

fahrenheitBtn.addEventListener(
    "click",
    () => {

        temperatureUnitValue = "F";

        fahrenheitBtn.classList.add(
            "active"
        );

        celsiusBtn.classList.remove(
            "active"
        );

        if (currentWeatherData) {

            displayCurrentWeather(
                selectedLocation,
                currentWeatherData
            );

            displayForecast(
                currentWeatherData.daily
            );
        }
    }
);


// ===============================
// CLOSE SUGGESTIONS ON OUTSIDE CLICK / ESCAPE
// ===============================

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(".search-wrapper")
        ) {
            suggestions.innerHTML = "";
        }
    }
);


cityInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            suggestions.innerHTML = "";
        }
    }
);


// ===============================
// DARK / LIGHT MODE
// ===============================

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );

        if (
            document.body.classList.contains(
                "dark"
            )
        ) {

            themeBtn.textContent = "☀️";

        } else {

            themeBtn.textContent = "🌙";
        }
    }
);