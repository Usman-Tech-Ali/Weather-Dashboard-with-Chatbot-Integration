const API_KEY = "076d4656c9f58268879199e0e3a57dc9"; // API key for OpenWeatherMap
document.getElementById("menu-toggle").addEventListener("click", function () {
  document.querySelector(".side-menu").classList.toggle("nav-open");
});

// Show the spinner
function showLoadingSpinner() {
  document.querySelector(".spinner-container").style.display = "flex";
}

// Hide the spinner
function hideLoadingSpinner() {
  setTimeout(() => {
    document.querySelector(".spinner-container").style.display = "none";
  }, 500);
}

// Toggle functionality for switching between Celsius and Fahrenheit
let isCelsius = true;
let currentWeatherData = null;
let currentForecastData = null;

document.querySelector(".toggle").addEventListener("change", function () {
  isCelsius = !isCelsius;
  if (currentWeatherData) updateTemperatureDisplay(currentWeatherData);
  if (currentForecastData)
    updateForecastTemperatureDisplay(currentForecastData);
});

// Function to convert Celsius to Fahrenheit
function convertToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}
// update temperature for any weather
function updateTemperature(data, isForecast = false) {
  const temp = isCelsius
    ? `${data.main.temp}°C`
    : `${convertToFahrenheit(data.main.temp).toFixed(2)}°F`;
  return temp;
}

// Function to update the temperature display based on the current unit
function updateTemperatureDisplay(data) {
  document.getElementById("temperature").textContent = updateTemperature(data);
}

// Function to update forecast temperature display
function updateForecastTemperatureDisplay(data) {
  const forecastDays = document.querySelectorAll(".forecast-day");
  for (let i = 0; i < forecastDays.length; i++) {
    const dayData = data.list[i * 8];
    forecastDays[i].querySelector(".forecast-temp").textContent =
      updateTemperature(dayData, true);
  }
}

// Function to fetch weather data and forecast using AJAX
function fetchWeatherData(city) {
  showLoadingSpinner();
  const weatherRequest = new XMLHttpRequest();
  const forecastRequest = new XMLHttpRequest();

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&units=metric&appid=${API_KEY}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&units=metric&appid=${API_KEY}`;

  weatherRequest.open("GET", weatherUrl, true);
  forecastRequest.open("GET", forecastUrl, true);

  let flag = false;

  // Handle the weather request
  weatherRequest.onreadystatechange = function () {
    if (weatherRequest.readyState === 4) {
      hideLoadingSpinner();
      if (weatherRequest.status === 200) {
        const weatherData = JSON.parse(weatherRequest.responseText);
        currentWeatherData = weatherData; // Store the fetched data for future use
        displayWeatherData(weatherData); // Display the data on the page
        updateTemperatureDisplay(weatherData); // Update temperature based on the toggle state
      } else {
        flag = true;
        alert("City not found. Please try again.");
      }
    }
  };

  // Handle the forecast request
  forecastRequest.onreadystatechange = function () {
    if (forecastRequest.readyState === 4) {
      hideLoadingSpinner();
      if (forecastRequest.status === 200) {
        const forecastData = JSON.parse(forecastRequest.responseText);
        displayCharts(forecastData); // Call function to display charts
      } else {
        if (flag != false) {
          alert("City not found. Please try again.");
        }
      }
    }
  };

  weatherRequest.send();
  forecastRequest.send();
}

// Function to fetch weather data based on geolocation
function fetchWeatherByLocation(lat, lon) {
  showLoadingSpinner();
  const weatherRequest = new XMLHttpRequest();
  const forecastRequest = new XMLHttpRequest();

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

  weatherRequest.open("GET", weatherUrl, true);
  forecastRequest.open("GET", forecastUrl, true);

  // Handle the weather request
  weatherRequest.onreadystatechange = function () {
    if (weatherRequest.readyState === 4) {
      hideLoadingSpinner();
      if (weatherRequest.status === 200) {
        const weatherData = JSON.parse(weatherRequest.responseText);
        currentWeatherData = weatherData;
        displayWeatherData(weatherData);
        updateTemperatureDisplay(weatherData);
        document.getElementById("city-input").value = weatherData.name;
        myFunction();
      } else {
        alert("Weather information for this location not found.");
      }
    }
  };

  // Handle the forecast request
  forecastRequest.onreadystatechange = function () {
    if (forecastRequest.readyState === 4) {
      hideLoadingSpinner();
      if (forecastRequest.status === 200) {
        const forecastData = JSON.parse(forecastRequest.responseText);
        displayCharts(forecastData); // Call function to display charts
      } else {
        alert("Forecast data not found for this location.");
      }
    }
  };

  weatherRequest.send();
  forecastRequest.send();
}

// Get the user's geolocation and fetch weather data based on location
function getGeolocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByLocation(lat, lon);
      },
      function (error) {
        alert("Unable to retrieve your location.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}
// Set background and icon based on weather condition
function setWeatherIconAndBackground(data, isForecast = false) {
  const condition = data.weather[0].main;
  const weatherIcon = document.getElementById(
    isForecast ? "forecast-icon" : "weather-icon"
  );

  switch (condition) {
    case "Clear":
      document.body.style.background =
        "linear-gradient(to top, #fbc2eb, #a6c1ee)";
      weatherIcon.src = "images/clear.png";
      break;
    case "Clouds":
      document.body.style.background =
        "linear-gradient(to top, #bdc3c7, #2c3e50)";
      weatherIcon.src = "images/clouds.png";
      break;
    case "Rain":
      document.body.style.background =
        "linear-gradient(to top, #3a6186, #89253e)";
      weatherIcon.src = "images/rain.png";
      break;
    case "Thunderstorm":
      document.body.style.background =
        "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)";
      weatherIcon.src = "images/thunderstorm.png";
      break;
    case "Drizzle":
      document.body.style.background =
        "linear-gradient(to top, #77a1d3, #79cbca, #e684ae)";
      weatherIcon.src = "images/drizzle.png";
      break;
    case "Snow":
      document.body.style.background =
        "linear-gradient(to top, #e6dada, #274046)";
      weatherIcon.src = "images/snow.png";
      break;
    case "Mist":
      document.body.style.background =
        "linear-gradient(to bottom, #606c88, #3f4c6b)";
      weatherIcon.src = "images/mist.png";
      break;
    case "Smoke":
      document.body.style.background =
        "linear-gradient(to bottom, #636363, #a2ab58)";
      weatherIcon.src = "images/smoke.png";
      break;
    case "Haze":
      document.body.style.background =
        "linear-gradient(to bottom, #b7ada8, #f7f8f8)";
      weatherIcon.src = "images/haze.png";
      break;
    case "Fog":
      document.body.style.background =
        "linear-gradient(to bottom, #b7ada8, #f7f8f8)";
      weatherIcon.src = "images/fog.png";
      break;

    default:
      // Default to OpenWeather background
      document.body.style.background =
        "linear-gradient(to bottom, #a1c4fd, #c2e9f0)";
      weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  }
}
// Function to display the fetched weather data on the webpage
function displayWeatherData(data) {
  setWeatherIconAndBackground(data);

  document.getElementById("city-name").textContent = data.name;
  document.getElementById("weather-type").textContent = data.weather[0].main;
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("wind-speed").textContent = `${data.wind.speed} m/s`;
  document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;

  updateTemperatureDisplay(data);
  document.getElementById("weather-widget").style.display = "flex";
}

// Global variables to store chart instances
let tempChartInstance = null;
let conditionChartInstance = null;
let windChartInstance = null;

// Function to display the charts
function displayCharts(forecastData) {
  const temps = [];
  const labels = [];
  const weatherConditions = {};

  for (let i = 0; i < forecastData.list.length; i += 8) {
    const forecast = forecastData.list[i];
    temps.push(forecast.main.temp);
    labels.push(new Date(forecast.dt_txt).toLocaleDateString());

    const condition = forecast.weather[0].main;
    weatherConditions[condition] = (weatherConditions[condition] || 0) + 1;
  }

  // Destroy existing chart instances if they exist
  if (tempChartInstance) {
    tempChartInstance.destroy();
  }
  if (conditionChartInstance) {
    conditionChartInstance.destroy();
  }
  if (windChartInstance) {
    windChartInstance.destroy();
  }

  // Bar Chart: Temperature Variation for next 5 days
  const tempCtx = document.getElementById("tempChart").getContext("2d");
  tempChartInstance = new Chart(tempCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temps,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: {
        delay: 500,
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  const conditionCtx = document
    .getElementById("conditionChart")
    .getContext("2d");
  conditionChartInstance = new Chart(conditionCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(weatherConditions),
      datasets: [
        {
          data: Object.values(weatherConditions),
          backgroundColor: [
            "#FF6B6B",
            "#4D96FF",
            "#F6D55C",
            "#88D498",
            "#6C5B7B",
          ],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: {
        delay: 300,
      },
    },
  });

  const windCtx = document.getElementById("windChart").getContext("2d");
  const windSpeeds = forecastData.list
    .slice(0, 5)
    .map((item) => item.wind.speed);

  windChartInstance = new Chart(windCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Wind Speed (m/s)",
          data: windSpeeds,
          backgroundColor: "rgba(100, 181, 246, 0.2)",
          borderColor: "rgba(33, 150, 243, 1)",
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: {
        onComplete: function () {
          this.options.animation.duration = 0;
        },
        easing: "easeInBounce",
        duration: 1500,
      },
    },
  });

  document.querySelector(".chart-section").style.display = "flex";
}

//5-day forecast
async function myFunction() {
  const cityName = document.getElementById("city-input").value;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    currentForecastData = data;

    updateForecastTemperatureDisplay(data);

    const forecastContainer = document.getElementById("five-day-forecast");
    forecastContainer.style.display = "block";

    const forecastDays = document.querySelectorAll(".forecast-day");

    for (let i = 0; i < forecastDays.length; i++) {
      const dayData = data.list[i * 8];

      const dayName = new Date(dayData.dt_txt).toLocaleDateString("en-US", {
        weekday: "long",
      });
      forecastDays[i].querySelector(".day-name").textContent = dayName;

      const iconCode = dayData.weather[0].icon;
      const weatherMain = dayData.weather[0].main;
      const iconInForecast = forecastDays[i].querySelector(".forecast-icon");

      if (weatherMain === "Clouds") {
        iconInForecast.src = "images/clouds.png";
      } else if (weatherMain === "Clear") {
        iconInForecast.src = "images/clear.png";
      } else if (weatherMain === "Rain") {
        iconInForecast.src = "images/rain.png";
      } else if (weatherMain === "Smoke") {
        iconInForecast.src = "images/smoke.png";
      } else if (weatherMain === "Thunderstorm") {
        iconInForecast.src = "images/thunderstorm.png";
      } else if (weatherMain === "Drizzle") {
        iconInForecast.src = "images/drizzle.png";
      } else if (weatherMain === "Snow") {
        iconInForecast.src = "images/snow.png";
      } else if (weatherMain === "Mist") {
        iconInForecast.src = "images/mist.png";
      } else if (weatherMain === "Haze") {
        iconInForecast.src = "images/haze.png";
      } else {
        // Default to OpenWeather icon if no custom match
        iconInForecast.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
      }
    }
  } catch (error) {
    console.error("Error fetching 5-day forecast:", error);
  }
}

// Event listener for the "Get Weather" button
document.getElementById("fetch-weather").addEventListener("click", () => {
  const city = document.getElementById("city-input").value.trim();
  if (city) {
    showLoadingSpinner();
    fetchWeatherData(city);
    myFunction();
  } else {
    alert("Please enter a city name.");
  }
});

document.getElementById("city-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    document.getElementById("fetch-weather").click();
  }
});

// Event listener for geolocation button
document
  .getElementById("geolocation-button")
  .addEventListener("click", function () {
    showLoadingSpinner();
    myFunction();
    getGeolocationWeather();
  });
// Automatically fetch weather data for current location when the website is loaded
document.addEventListener("DOMContentLoaded", function () {
  getGeolocationWeather();
});
