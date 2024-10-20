const geminiApiKey = "AIzaSyAHY-nCRaVM6ptiiYlpVpRYLd2Ej9nnlCc"; // Replace with your Gemini API key
const ApiKey = "076d4656c9f58268879199e0e3a57dc9"; // Replace with your OpenWeather API key
const MODEL_NAME = "gemini-1.5-flash"; // Replace with your model name

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

// Function to fetch the Gemini API response
async function fetchGeminiReply(userInput) {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: userInput,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch response");
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (data.candidates && data.candidates.length > 0) {
      const contentText = data.candidates[0].content.parts[0].text;
      addMessageToChat("Chatbot", contentText);
    } else {
      throw new Error("No candidates found");
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("chat-messages").innerText =
      "Error: " + error.message;
  }
}

// Function to handle the user's query
async function processUserQuery() {
  const userQuery = document.getElementById("chat-input").value;

  try {
    const location = await getUserLocation();
    const response = await generateChatResponse(
      userQuery,
      location.latitude,
      location.longitude
    );
    addMessageToChat("Chatbot", response);
  } catch (error) {
    console.error("Error getting location:", error);
    const response = await generateChatResponse(userQuery);
    addMessageToChat("Chatbot", response);
  }
}

async function getWeatherByCoords(lat, lon) {
  const apiEndPoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${ApiKey}&units=metric`;
  try {
    const response = await fetch(apiEndPoint);
    if (!response.ok) {
      throw new Error("Unable to retrieve weather information.");
    }
    const weatherdata = await response.json();
    return `The weather at your location is currently ${weatherdata.weather[0].description} with a temperature of ${weatherdata.main.temp}°C.`;
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    return "Apologies, I couldn't get the weather details at the moment.";
  }
}
// Provide a random response for general inquiries
function randomGeminiFallback() {
  const messages = [
    "I'm not quite sure how to respond to that.",
    "Could you try asking in a different way?",
    "I'm still improving—maybe ask me something else?",
    "I don't have the right answer for that right now.",
    "That's outside my scope, but I'm here to help with something else!",
    "Let me think... nope, I don't have an answer yet.",
    "I might not know that, but I'm always ready to learn more!",
    "That's an interesting question—I'll try to find out next time.",
    "I'm sorry, but I don't have that information right now.",
    "Hmm... that's beyond what I can answer, but I'm here for anything else!",
  ];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Main chatbot response handler
async function generateChatResponse(userInput, lat = null, lon = null) {
  const weatherPattern = /weather in ([a-zA-Z\s]+)/i;
  const fiveDayPattern = /5[-\s]?day forecast for ([a-zA-Z\s]+)/i;
  const weatherPatternAlt1 = /weather of ([a-zA-Z\s]+)/i;
  const weatherPatternAlt2 = /weather for ([a-zA-Z\s]+)/i;
  const forecastPatternAlt = /5[-\s]?day forecast of ([a-zA-Z\s]+)/i;
  const greetingPattern =
    /hi|hello|hey|good morning|good afternoon|good evening/i;
  const inquiryPattern = /what|how|when|where|why/i;
  const datePattern =
    /Weather of ([a-zA-Z\s]+) on (\d{1,2})(st|nd|rd|th)?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;

  if (datePattern.test(userInput)) {
    const matchedCity = datePattern.exec(userInput)[1].trim();
    const dayOfMonth = datePattern.exec(userInput)[2].trim();
    const monthName = datePattern.exec(userInput)[4].trim();

    const monthMap = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const formattedrDate = `${monthMap[monthName]}/${dayOfMonth.padStart(
      2,
      "0"
    )}`;

    const forecastData = await getFiveDayForecast(matchedCity);
    const forecastEntries = forecastData.split("📅");

    const matchedEntry = forecastEntries.find((entry) => {
      const entryDate = entry
        .trim()
        .split(":")[0]
        .split("/")
        .slice(0, 2)
        .join("/");
      return entryDate === formattedrDate;
    });

    if (matchedEntry) {
      return `Here is the weather forecast for ${matchedCity} on ${formattedrDate}: ${matchedEntry.trim()}`;
    } else {
      return `Sorry, I couldn't find a weather forecast for ${matchedCity} on ${formattedrDate}.`;
    }
  } else if (inquiryPattern.test(userInput)) {
    const geminiResponse = randomGeminiFallback();
    return geminiResponse;
  } else if (weatherPatternAlt2.test(userInput)) {
    const city = weatherPatternAlt2.exec(userInput)[1].trim();
    const weatherResponse = await getCityWeatherFunction(city);
    return weatherResponse;
  } else if (greetingPattern.test(userInput)) {
    return "Hello! How can I help you today?";
  } else if (weatherPatternAlt1.test(userInput)) {
    const city = weatherPatternAlt1.exec(userInput)[1].trim();
    const weatherResponse = await getCityWeatherFunction(city);
    return weatherResponse;
  } else if (forecastPatternAlt.test(userInput)) {
    const city = forecastPatternAlt.exec(userInput)[1].trim();
    const forecastResponse = await getFiveDayForecast(city);
    return forecastResponse;
  } else if (weatherPattern.test(userInput)) {
    const city = weatherPattern.exec(userInput)[1].trim();
    const weatherResponse = await getCityWeatherFunction(city);
    return weatherResponse;
  } else if (fiveDayPattern.test(userInput)) {
    const city = fiveDayPattern.exec(userInput)[1].trim();
    const forecastResponse = await getFiveDayForecast(city);
    return forecastResponse;
  } else if (userInput.toLowerCase().includes("weather")) {
    if (lat && lon) {
      const weatherResponse = await getWeatherByCoords(lat, lon);
      return weatherResponse;
    } else {
      const geminiResponse = await fetchGeminiReply(userInput);
      return geminiResponse;
    }
  } else {
    const geminiResponse = await fetchGeminiReply(userInput);
    return geminiResponse;
  }
}
// State to track the last sender
let lastSender = null;
let awaitingChatbotResponse = false;

function addMessageToChat(sender, message) {
  const chatBody = document.getElementById("chat-messages");

  // Prevent the user from sending another message if chatbot hasn't responded
  if (sender === "You" && awaitingChatbotResponse) {
    console.warn("Please wait for the chatbot's response.");
    return;
  }

  if (sender === "Chatbot" && lastSender === "Chatbot") {
    console.warn("Cannot add consecutive chatbot messages.");
    return;
  }

  const messageDiv = document.createElement("div");

  if (sender === "You") {
    awaitingChatbotResponse = true;
    messageDiv.classList.add("flex", "justify-end", "mb-4");
    messageDiv.innerHTML = `
      <div class="max-w-xs rounded-lg bg-blue-500 text-white p-3">
        <p class="text-sm">
          <i class="fas fa-user-circle mr-2"></i> ${message}
        </p>
      </div>
    `;
  } else if (sender === "Chatbot") {
    awaitingChatbotResponse = false;
    messageDiv.classList.add("flex", "justify-start", "mb-4");
    messageDiv.innerHTML = `
      <div class="max-w-xs rounded-lg bg-gray-200 text-gray-800 p-3">
        <p class="text-sm">
          <i class="fas fa-robot mr-2"></i> ${message}
        </p>
      </div>
    `;
  }

  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  lastSender = sender;
}
// Fetch weather data by city
async function getCityWeatherFunction(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${ApiKey}&units=metric`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Error fetching weather data for city");
    }
    const data = await response.json();
    return `The weather in ${city} is currently ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`;
  } catch (error) {
    console.error("Weather API Error:", error);
    return "Sorry, I could not fetch the weather data for that city.";
  }
}

// Fetch 5-day weather forecast by city
async function getFiveDayForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${ApiKey}&units=metric`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Error fetching 5-day forecast");
    }
    const data = await response.json();
    let forecast = "";
    data.list.forEach((entry) => {
      const date = entry.dt_txt.split(" ")[0];
      const temp = entry.main.temp;
      const weatherDesc = entry.weather[0].description;
      forecast += `📅 ${date}: ${weatherDesc}, ${temp}°C\n`;
    });
    return forecast.trim();
  } catch (error) {
    console.error("5-Day Forecast API Error:", error);
    return "Sorry, I could not fetch the 5-day forecast.";
  }
}

// Function to get user location
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}

// Event listener for sending a message
document.getElementById("chat-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const userInput = event.target.value;
    addMessageToChat("You", userInput);
    processUserQuery();
    event.target.value = "";
  }
});
// Event listener for sending a message on button click
document.querySelector(".btn-for-chatbot").addEventListener("click", () => {
  const chatInput = document.getElementById("chat-input");
  const userInput = chatInput.value;
  if (userInput.trim() !== "") {
    // Ensure the input is not empty
    addMessageToChat("You", userInput);
    processUserQuery();
    chatInput.value = "";
  }
});

// tablw work

let originalWeatherData = [];
let weatherData = [];
let currentPage = 0;
const itemsPerPage = 10;

let currentPagetoShow = 1;
const totalPages = 4;

// Toggle between Fahrenheit and Celsius
document.querySelector(".toggle").addEventListener("change", function () {
  let isFahrenheit = this.checked;
  weatherData = weatherData.map((item) => {
    if (isFahrenheit) {
      item.temp = ((item.temp * 9) / 5 + 32).toFixed(2); // Convert to Fahrenheit
    } else {
      item.temp = (((item.temp - 32) * 5) / 9).toFixed(2); // Convert to Celsius
    }
    return item;
  });
  renderTable(isFahrenheit);
});

// Toggle the side menu
document.getElementById("menu-toggle").addEventListener("click", function () {
  const sideMenu = document.querySelector(".side-menu");
  const navLinks = document.getElementById("nav-links");

  if (sideMenu.classList.contains("nav-open")) {
    sideMenu.classList.remove("nav-open");
  } else {
    sideMenu.classList.add("nav-open");
  }
});

// get prevPage and nextPage
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");

const updatePageIndicator = () => {
  document.getElementById(
    "pageIndicator"
  ).textContent = `Page ${currentPagetoShow} of ${totalPages}`;

  if (currentPagetoShow === 1) {
    prevPage.disabled = true;
  } else {
    prevPage.disabled = false;
  }

  if (currentPagetoShow === totalPages) {
    nextPage.disabled = true;
  } else {
    nextPage.disabled = false;
  }
};

//Uodate background color
function updateBackground(condition) {
  switch (condition) {
    case "Clear":
      document.body.style.background =
        "linear-gradient(to top, #fbc2eb, #a6c1ee)";
      break;
    case "Clouds":
      document.body.style.background =
        "linear-gradient(to top, #bdc3c7, #2c3e50)";
      break;
    case "Rain":
      document.body.style.background =
        "linear-gradient(to top, #3a6186, #89253e)";
      break;
    case "Thunderstorm":
      document.body.style.background =
        "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)";
      break;
    case "Drizzle":
      document.body.style.background =
        "linear-gradient(to top, #77a1d3, #79cbca, #e684ae)";
      break;
    case "Snow":
      document.body.style.background =
        "linear-gradient(to top, #e6dada, #274046)";
      break;
    case "Mist":
      document.body.style.background =
        "linear-gradient(to bottom, #606c88, #3f4c6b)";
      break;
    case "Smoke":
      document.body.style.background =
        "linear-gradient(to bottom, #636363, #a2ab58)";
      break;
    case "Haze":
      document.body.style.background =
        "linear-gradient(to bottom, #b7ada8, #f7f8f8)";
      break;
    case "Fog":
      document.body.style.background =
        "linear-gradient(to bottom, #b7ada8, #f7f8f8)";
      break;
    default:
      document.body.style.background =
        "linear-gradient(to bottom, #a1c4fd, #c2e9f0)";
  }
}

// Fetch weather data for a specific city
async function fetchWeatherData(city) {
  const apiKey = "076d4656c9f58268879199e0e3a57dc9";
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      alert("City not found! Please try again.");
      return;
    }

    const data = await response.json();
    const condition = data.list[0].weather[0].main;
    updateBackground(condition);
    weatherData = data.list.map((item) => ({
      date: item.dt_txt.split(" ")[0],
      temp: item.main.temp,
      condition: item.weather[0].description,
    }));
    originalWeatherData = [...weatherData];
    currentPage = 0;
    renderTable();
    document.getElementById("weather-section").style.display = "flex";
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Fetch weather data based on geolocation
async function fetchWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const apiKey = "076d4656c9f58268879199e0e3a57dc9";
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

        try {
          const response = await fetch(apiUrl);
          if (!response.ok) {
            alert("Unable to retrieve weather data for your location.");
            return;
          }

          const data = await response.json();
          document.getElementById("city-input").value = data.city.name;

          const condition = data.list[0].weather[0].main;
          updateBackground(condition);
          weatherData = data.list.map((item) => ({
            date: item.dt_txt.split(" ")[0],
            temp: item.main.temp,
            condition: item.weather[0].description,
          }));
          originalWeatherData = [...weatherData];
          currentPage = 0;
          renderTable();
          document.getElementById("weather-section").style.display = "flex";
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      },
      (error) => {
        alert("Unable to retrieve your location. Please check your settings.");
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

// Render the table with pagination
function renderTable(isFahrenheit) {
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedData = weatherData.slice(start, end);

  const tbody = document.getElementById("weatherData");
  tbody.innerHTML = paginatedData
    .map(
      (entry) => `
          <tr class="hover:bg-blue-100 transition-colors duration-200 cursor-pointer">
            <td class="border border-gray-600">${entry.date}</td>
            <td class="border border-gray-600">${entry.temp}°${
        isFahrenheit ? "F" : "C"
      }</td>
            <td class="border border-gray-600">${entry.condition}</td>
          </tr>
        `
    )
    .join("");
}

// Pagination controls
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    currentPagetoShow--;
    updatePageIndicator();

    renderTable();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if ((currentPage + 1) * itemsPerPage < weatherData.length) {
    currentPage++;
    currentPagetoShow++;
    updatePageIndicator();
    renderTable();
  }
});

// Sort temperatures in ascending order
document.getElementById("sortAsc").addEventListener("click", () => {
  // Make reset button active
  document.getElementById("resetFilter").style.display = "block";
  weatherData.sort((a, b) => a.temp - b.temp);
  renderTable();

  const filterButtons = document.querySelectorAll(
    "#sortAsc, #sortDesc, #filterRain, #showHighestTemp"
  );
  filterButtons.forEach((button) => button.classList.remove("active-filter"));
  document.getElementById("sortAsc").classList.add("active-filter");
});

// Sort temperatures in descending order
document.getElementById("sortDesc").addEventListener("click", () => {
  document.getElementById("resetFilter").style.display = "block";
  weatherData.sort((a, b) => b.temp - a.temp);
  renderTable();

  const filterButtons = document.querySelectorAll(
    "#sortAsc, #sortDesc, #filterRain, #showHighestTemp"
  );
  filterButtons.forEach((button) => button.classList.remove("active-filter"));
  document.getElementById("sortDesc").classList.add("active-filter");
});

// Filter days with rain
document.getElementById("filterRain").addEventListener("click", () => {
  document.getElementById("resetFilter").style.display = "block";
  const rainDays = weatherData.filter((entry) =>
    entry.condition.includes("rain")
  );
  weatherData = rainDays;

  // Show message in table if no rainy days
  if (weatherData.length === 0) {
    weatherData = [
      {
        date: "No rainy days",
        temp: "",
        condition: "",
      },
    ];
  }

  currentPagetoShow = 1;
  updatePageIndicator();
  currentPage = 0;
  renderTable();

  // Highlight selected filter button
  const filterButtons = document.querySelectorAll(
    "#sortAsc, #sortDesc, #filterRain, #showHighestTemp"
  );
  filterButtons.forEach((button) => button.classList.remove("active-filter"));
  document.getElementById("filterRain").classList.add("active-filter");
});

// Show the day with the highest temperature
document.getElementById("showHighestTemp").addEventListener("click", () => {
  document.getElementById("resetFilter").style.display = "block";
  const highestTemp = weatherData.reduce((acc, curr) =>
    acc.temp > curr.temp ? acc : curr
  );
  weatherData = [highestTemp];
  currentPage = 0;
  renderTable();

  // Highlight selected filter button
  const filterButtons = document.querySelectorAll(
    "#sortAsc, #sortDesc, #filterRain, #showHighestTemp"
  );
  filterButtons.forEach((button) => button.classList.remove("active-filter"));
  document.getElementById("showHighestTemp").classList.add("active-filter");
});

// Reset Filter Logic
document.getElementById("resetFilter").addEventListener("click", () => {
  weatherData = [...originalWeatherData];
  currentPage = 0;
  currentPagetoShow = 1;
  updatePageIndicator();
  renderTable();
  document.getElementById("resetFilter").style.display = "none";
  const filterButtons = document.querySelectorAll(
    "#sortAsc, #sortDesc, #filterRain, #showHighestTemp"
  );
  filterButtons.forEach((button) => button.classList.remove("active-filter"));
});

document.getElementById("fetch-weather").addEventListener("click", () => {
  const city = document.getElementById("city-input").value.trim();
  if (city) {
    showLoadingSpinner();
    hideLoadingSpinner();
    fetchWeatherData(city);
  } else {
    alert("Please enter a city name.");
  }
});

document.getElementById("city-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    document.getElementById("fetch-weather").click();
  }
});
document.getElementById("geolocation-button").addEventListener("click", () => {
  showLoadingSpinner();
  hideLoadingSpinner();
  fetchWeatherByLocation();
});
updatePageIndicator();
// Automatically fetch weather data for current location when the website is loaded
document.addEventListener("DOMContentLoaded", function () {
  showLoadingSpinner();
  hideLoadingSpinner();
  fetchWeatherByLocation();
});
